from django.db import transaction, DatabaseError
from django.core.exceptions import ObjectDoesNotExist
from decimal import Decimal
import logging

from .game_engine_service import GameEngineService
from api.models import UserWallet, GameLog, ProgressiveJackpot
import secrets

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
    def execute_spin_transaction(user, requested_bet_amount, is_buy_bonus=False, is_ante_bet=False):
        """
        Orchestrates the entire betting cycle inside a single atomic transaction.
        Uses Pessimistic Locking (SELECT FOR UPDATE) to prevent concurrency attacks.
        Enforces game state (Free Spins, Multipliers) on the backend securely.
        """
        try:
            with transaction.atomic():
                # 1. Acquire PESSIMISTIC LOCK (Row-level)
                try:
                    wallet = UserWallet.objects.select_for_update(nowait=False).get(user=user)
                except ObjectDoesNotExist:
                    raise BettingError("User wallet not found")
                except DatabaseError:
                    raise TransactionTimeout("Concurrent request in progress, try again.")

                # Determine State
                is_free_spin = wallet.free_spins_left > 0
                
                if is_free_spin:
                    # Secure State Lock for Free Spins
                    bet_amount = wallet.free_spin_bet_amount
                    current_multiplier = wallet.current_multiplier
                    actual_cost = Decimal('0.00')
                    is_buy_bonus = False
                    is_ante_bet = False
                    force_scatters = 0
                else:
                    # Normal Spin
                    bet_amount = requested_bet_amount
                    current_multiplier = 1.0
                    actual_cost = Decimal(str(bet_amount))
                    force_scatters = 0
                    if is_buy_bonus:
                        actual_cost = bet_amount * 100
                        force_scatters = 4
                    elif is_ante_bet:
                        actual_cost = bet_amount * Decimal('1.25')

                # 2. Strict Validation (Inside the lock)
                if wallet.balance < actual_cost:
                    raise InsufficientFunds(f"Balance too low. Needed: {actual_cost}, Have: {wallet.balance}")

                # 3. Deduct Bet (Before result is known)
                wallet.balance -= actual_cost

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

                # 6. Update Bonus State Securely
                if spin_result['triggered_free_spins']:
                    wallet.free_spins_left += 15
                    if not is_free_spin:
                        wallet.free_spin_bet_amount = bet_amount
                        wallet.current_multiplier = 1.0
                
                if is_free_spin:
                    wallet.free_spins_left -= 1
                    wallet.current_multiplier = spin_result['global_multiplier_value']
                    # Capped Max Win forfeits remaining free spins
                    if spin_result.get('is_max_win', False):
                        wallet.free_spins_left = 0

                wallet.save()

                # 6b. Progressive Jackpot Contribution & Win Check (locked)
                # Step 1: Ensure singleton exists (outside lock to avoid SQLite deadlock)
                ProgressiveJackpot.objects.get_or_create(pk=1)
                # Step 2: Now lock it safely
                jackpot = ProgressiveJackpot.objects.select_for_update().get(pk=1)
                
                # Contribution: every spin adds a tiny % of bet into the pools
                if actual_cost > Decimal('0.00'):
                    # Use F() for safe atomic DB-level addition
                    # pyrefly: ignore [missing-import]
                    from django.db.models import F
                    ProgressiveJackpot.objects.filter(pk=1).update(
                        mini_pool=F('mini_pool')   + actual_cost * Decimal('0.0020'),
                        minor_pool=F('minor_pool') + actual_cost * Decimal('0.0010'),
                        major_pool=F('major_pool') + actual_cost * Decimal('0.0005'),
                        grand_pool=F('grand_pool') + actual_cost * Decimal('0.0002'),
                    )
                    # Re-fetch fresh values after update
                    jackpot.refresh_from_db()

                # Win Roll: Test Game Rule (Trigger a jackpot exactly every 50th spin)
                jackpot_won = None
                jackpot_won_tier = None
                
                from django.core.cache import cache
                spin_key = f"user_spin_counter_{user.id}"
                try:
                    spin_count = cache.get(spin_key, 0) + 1
                    cache.set(spin_key, spin_count, timeout=86400)
                except Exception:
                    # Ignore cache failures so the spin doesn't crash
                    spin_count = secrets.randbelow(49) + 1
                
                if spin_count % 50 == 0:
                    tier = secrets.choice(['MINI', 'MINOR', 'MAJOR', 'GRAND'])
                    if tier == 'GRAND':
                        jackpot_won = jackpot.grand_pool
                        jackpot.grand_pool = Decimal('50000.00')
                        jackpot_won_tier = 'GRAND'
                    elif tier == 'MAJOR':
                        jackpot_won = jackpot.major_pool
                        jackpot.major_pool = Decimal('5000.00')
                        jackpot_won_tier = 'MAJOR'
                    elif tier == 'MINOR':
                        jackpot_won = jackpot.minor_pool
                        jackpot.minor_pool = Decimal('500.00')
                        jackpot_won_tier = 'MINOR'
                    else:
                        jackpot_won = jackpot.mini_pool
                        jackpot.mini_pool = Decimal('100.00')
                        jackpot_won_tier = 'MINI'
                else:
                    # Normal random chance roll
                    r = secrets.randbelow(1_000_000)
                    if r < 5:       # 1 in 200,000 -> GRAND
                        jackpot_won = jackpot.grand_pool
                        jackpot.grand_pool = Decimal('50000.00')
                        jackpot_won_tier = 'GRAND'
                    elif r < 50:    # 1 in 22,000 -> MAJOR
                        jackpot_won = jackpot.major_pool
                        jackpot.major_pool = Decimal('5000.00')
                        jackpot_won_tier = 'MAJOR'
                    elif r < 300:   # 1 in 3,500 -> MINOR
                        jackpot_won = jackpot.minor_pool
                        jackpot.minor_pool = Decimal('500.00')
                        jackpot_won_tier = 'MINOR'
                    elif r < 2000:  # 1 in 500 -> MINI
                        jackpot_won = jackpot.mini_pool
                        jackpot.mini_pool = Decimal('100.00')
                        jackpot_won_tier = 'MINI'
                
                if jackpot_won:
                    wallet.balance += jackpot_won
                    wallet.save()
                    jackpot.save()  # Save reset values only if won
                else:
                    jackpot_won = None  # already None, just explicit

                # 7. Audit Logging
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
                spin_result['is_free_spin'] = is_free_spin
                spin_result['free_spins_left'] = wallet.free_spins_left
                spin_result['current_multiplier'] = wallet.current_multiplier
                spin_result['jackpot_won'] = float(jackpot_won) if jackpot_won else None
                spin_result['jackpot_won_tier'] = jackpot_won_tier
                spin_result['jackpot_pools'] = {
                    'mini':  float(jackpot.mini_pool),
                    'minor': float(jackpot.minor_pool),
                    'major': float(jackpot.major_pool),
                    'grand': float(jackpot.grand_pool),
                }
                
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
