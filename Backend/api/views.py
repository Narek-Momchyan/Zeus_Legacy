from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from django.db import transaction
from django.db.models import F
from django.contrib.auth.models import User
# pyrefly: ignore [missing-import]
from django.core.cache import cache
from decimal import Decimal
import logging

from services.game_engine_service import GameEngineService
from .models import UserWallet, GameLog

logger = logging.getLogger('game_events')

class SpinView(APIView):
    """
    API endpoint with Throttling, Anti-Fraud validation, and Atomic Transactions.
    """
    throttle_scope = 'spin'
    throttle_classes = [ScopedRateThrottle]

    def post(self, request, *args, **kwargs):
        try:
            # 1. Get user
            user = request.user
            if not user or user.is_anonymous:
                user, _ = User.objects.get_or_create(username="dev_player")
            
            # 2. Parse request data
            bet_amount = Decimal(str(request.data.get('bet_amount', '1.00')))
            is_free_spin = request.data.get('is_free_spin', False)
            is_buy_bonus = request.data.get('is_buy_bonus', False)
            is_ante_bet = request.data.get('is_ante_bet', False)
            current_multiplier = float(request.data.get('global_multiplier', 0.0))

            # 3. Validation
            if not is_free_spin:
                if bet_amount < Decimal('0.20') or bet_amount > Decimal('100.00'):
                    return Response({"error": "Invalid bet amount ($0.20 - $100)"}, status=400)

            # 4. Execute via Secure Service
            from services.betting_service import BettingService, BettingError, InsufficientFunds
            
            try:
                spin_result = BettingService.execute_spin_transaction(
                    user=user,
                    bet_amount=bet_amount,
                    is_free_spin=is_free_spin,
                    is_buy_bonus=is_buy_bonus,
                    is_ante_bet=is_ante_bet,
                    current_multiplier=current_multiplier
                )
                
                # Update cache
                cache_key = f"user_balance_{user.id}"
                cache.set(cache_key, spin_result['current_balance'], timeout=300)
                
                return Response(spin_result, status=200)

            except InsufficientFunds as e:
                return Response({"error": str(e)}, status=402) # Payment Required
            except BettingError as e:
                return Response({"error": str(e)}, status=400)

        except Exception as e:
            logger.error(f"SpinView Failure: {str(e)}", exc_info=True)
            return Response({"error": "Internal Server Error"}, status=500)


class BalanceView(APIView):
    """Returns the current user balance."""
    def get(self, request):
        user = request.user
        if not user or user.is_anonymous:
            user, _ = User.objects.get_or_create(username="dev_player")
        wallet, _ = UserWallet.objects.get_or_create(user=user)
        return Response({"balance": float(wallet.balance)}, status=200)
