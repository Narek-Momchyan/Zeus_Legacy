from django.db import transaction, DatabaseError
from django.core.exceptions import ObjectDoesNotExist
from decimal import Decimal
import logging

from .game_engine_service import GameEngineService
from api.models import UserWallet, GameLog

logger = logging.getLogger('game_events')

class BettingError(Exception):
    """Base exception for betting service."""
    pass

class InsufficientFunds(BettingError):
    """Raised when user balance is lower than the bet amount."""
    pass

class TransactionTimeout(BettingError):
    """Raised when database lock cannot be acquired."""
    pass

class BettingService:
    """
    Senior Backend Security Expert implementation of the Casino Betting logic.
    Ensures ACID compliance, prevents race conditions, and double-spending.
    """

    @staticmethod
    def execute_spin_transaction(user, bet_amount, is_free_spin=False, is_buy_bonus=False, 
                                is_ante_bet=False, current_multiplier=0.0):
        """
        Orchestrates the entire betting cycle inside a single atomic transaction.
        Uses Pessimistic Locking (SELECT FOR UPDATE) to prevent concurrency attacks.
        """
        
        # Determine actual cost
        actual_cost = Decimal(str(bet_amount))
        force_scatters = 0
        
        if is_buy_bonus:
            actual_cost = Decimal(str(bet_amount)) * 100
            force_scatters = 4
        elif is_ante_bet and not is_free_spin:
            actual_cost = Decimal(str(bet_amount)) * Decimal('1.25')
        
        if is_free_spin:
            actual_cost = Decimal('0.00')

        try:
            with transaction.atomic():
                # 1. Acquire PESSIMISTIC LOCK (Row-level)
                # Using select_for_update() blocks other transactions from modifying this wallet
                try:
                    wallet = UserWallet.objects.select_for_update(nowait=False).get(user=user)
                except ObjectDoesNotExist:
                    raise BettingError("User wallet not found")
                except DatabaseError:
                    # Usually happens if lock cannot be acquired (timeout)
                    raise TransactionTimeout("Concurrent request in progress, try again.")

                # 2. Strict Validation (Inside the lock)
                if wallet.balance < actual_cost:
                    raise InsufficientFunds(f"Balance too low. Needed: {actual_cost}, Have: {wallet.balance}")

                # 3. Deduct Bet (Before result is known)
                wallet.balance -= actual_cost
                wallet.save()

                # 4. Execute Game Logic (Engine is stateless)
                engine = GameEngineService()
                spin_result = engine.execute_spin(
                    is_free_spin=is_free_spin,
                    current_global_multiplier=current_multiplier,
                    force_scatters=force_scatters,
                    is_ante_bet=is_ante_bet
                )

                # 5. Calculate & Credit Winnings
                win_multiplier = Decimal(str(spin_result['total_win']))
                win_amount = Decimal(str(bet_amount)) * win_multiplier
                
                if win_amount > 0:
                    wallet.balance += win_amount
                    wallet.save()

                # 6. Audit Logging (Inside transaction for integrity)
                GameLog.objects.create(
                    user=user,
                    bet_amount=actual_cost,
                    win_amount=win_amount,
                    total_multiplier=spin_result['global_multiplier_value'],
                    history_payload=spin_result,
                    is_free_spin=is_free_spin,
                    is_buy_bonus=is_buy_bonus
                )

                # Prepare final response payload
                spin_result['total_win'] = float(win_amount)
                spin_result['current_balance'] = float(wallet.balance)
                
                # Scale step payouts for the UI
                for step in spin_result['tumble_history']:
                    step['payout'] = float(Decimal(str(step['payout'])) * Decimal(str(bet_amount)))

                return spin_result

        except (InsufficientFunds, TransactionTimeout) as e:
            # Re-raise known business logic errors
            raise e
        except Exception as e:
            # Log unexpected critical failures (Engine crash, DB crash)
            logger.critical(f"FATAL BETTING FAILURE: User {user.id} | Error: {str(e)}", exc_info=True)
            raise BettingError("An internal game error occurred. No funds were lost.")
