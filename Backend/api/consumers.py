import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from decimal import Decimal
import logging
from django.core.cache import cache

from .models import UserWallet, ProgressiveJackpot

logger = logging.getLogger('game_events')

class GameConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send_json({"type": "connected", "message": "WebSocket Connected"})

    async def disconnect(self, close_code):
        pass

    async def receive_json(self, content):
        action = content.get('action')
        
        if action == 'balance':
            await self.handle_balance(content)
        elif action == 'jackpot':
            await self.handle_jackpot(content)
        elif action == 'spin':
            await self.handle_spin(content)
        else:
            await self.send_json({"error": f"Unknown action: {action}"})

    @database_sync_to_async
    def get_user(self):
        user = self.scope.get('user')
        if not user or user.is_anonymous:
            user, _ = User.objects.get_or_create(username="dev_player")
        return user

    @database_sync_to_async
    def get_balance_data(self, user):
        wallet, _ = UserWallet.objects.get_or_create(user=user)
        return {
            "balance": float(wallet.balance),
            "free_spins_left": wallet.free_spins_left,
            "current_multiplier": wallet.current_multiplier,
            "free_spin_bet_amount": float(wallet.free_spin_bet_amount)
        }

    async def handle_balance(self, content):
        user = await self.get_user()
        data = await self.get_balance_data(user)
        await self.send_json({
            "action": "balance_result",
            "data": data
        })

    @database_sync_to_async
    def get_jackpot_data(self):
        jp = ProgressiveJackpot.get_solo()
        return {
            "mini":  float(jp.mini_pool),
            "minor": float(jp.minor_pool),
            "major": float(jp.major_pool),
            "grand": float(jp.grand_pool),
        }

    async def handle_jackpot(self, content):
        data = await self.get_jackpot_data()
        await self.send_json({
            "action": "jackpot_result",
            "data": data
        })

    # ── Spin over WebSocket ──────────────────────────────────────────────
    @database_sync_to_async
    def execute_spin_db(self, bet_amount, is_buy_bonus, is_ante_bet):
        """Runs the full BettingService spin inside a sync DB context."""
        from services.betting_service import BettingService, BettingError, InsufficientFunds
        from .models import ProgressiveJackpot

        user = self.scope.get('user')
        if not user or user.is_anonymous:
            user, _ = User.objects.get_or_create(username="dev_player")

        # Validation
        if bet_amount < Decimal('0.20') or bet_amount > Decimal('100.00'):
            return {"error": "Invalid bet amount ($0.20 - $100)"}

        # Ensure jackpot singleton exists
        ProgressiveJackpot.get_solo()

        try:
            spin_result = BettingService.execute_spin_transaction(
                user=user,
                requested_bet_amount=bet_amount,
                is_buy_bonus=is_buy_bonus,
                is_ante_bet=is_ante_bet,
            )

            # Update balance cache
            cache_key = f"user_balance_{user.id}"
            try:
                cache.set(cache_key, spin_result['current_balance'], timeout=300)
            except Exception:
                pass

            return spin_result

        except InsufficientFunds as e:
            return {"error": str(e), "code": "insufficient_funds"}
        except BettingError as e:
            return {"error": str(e), "code": "betting_error"}

    async def handle_spin(self, content):
        try:
            bet_amount = Decimal(str(content.get('bet_amount', '1.00')))
            is_buy_bonus = content.get('is_buy_bonus', False)
            is_ante_bet = content.get('is_ante_bet', False)

            result = await self.execute_spin_db(bet_amount, is_buy_bonus, is_ante_bet)

            if 'error' in result:
                await self.send_json({
                    "action": "spin_error",
                    "error": result['error'],
                    "code": result.get('code', 'unknown')
                })
            else:
                await self.send_json({
                    "action": "spin_result",
                    **result
                })
        except Exception as e:
            logger.error(f"WebSocket spin error: {str(e)}", exc_info=True)
            await self.send_json({
                "action": "spin_error",
                "error": "Internal server error"
            })
