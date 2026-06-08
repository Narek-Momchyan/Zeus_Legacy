# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
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
from .models import UserWallet, GameLog, ProgressiveJackpot

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
            is_buy_bonus = request.data.get('is_buy_bonus', False)
            is_ante_bet = request.data.get('is_ante_bet', False)

            # 3. Validation
            if bet_amount < Decimal('0.20') or bet_amount > Decimal('100.00'):
                return Response({"error": "Invalid bet amount ($0.20 - $100)"}, status=400)

            # 4. Execute via Secure Service
            from services.betting_service import BettingService, BettingError, InsufficientFunds
            
            # Ensure jackpot singleton exists
            ProgressiveJackpot.get_solo()
            
            try:
                spin_result = BettingService.execute_spin_transaction(
                    user=user,
                    requested_bet_amount=bet_amount,
                    is_buy_bonus=is_buy_bonus,
                    is_ante_bet=is_ante_bet
                )
                
                # Update cache
                cache_key = f"user_balance_{user.id}"
                try:
                    cache.set(cache_key, spin_result['current_balance'], timeout=300)
                except Exception:
                    pass
                
                return Response(spin_result, status=200)

            except InsufficientFunds as e:
                return Response({"error": str(e)}, status=402) # Payment Required
            except BettingError as e:
                return Response({"error": str(e)}, status=400)

        except Exception as e:
            logger.error(f"SpinView Failure: {str(e)}", exc_info=True)
            return Response({"error": "Internal Server Error"}, status=500)



from .models import Symbol, GameAudio

class GameConfigView(APIView):
    """
    Returns the game symbols and game audios.
    Automatically seeds them if they are empty in the database.
    """
    def get(self, request):
        # Retrieve and format response
        symbols = []
        for s in Symbol.objects.all():
            img_url = None
            if s.custom_image:
                img_url = request.build_absolute_uri(s.custom_image.url)
            symbols.append({
                "symbol_id": s.symbol_id,
                "name": s.name,
                "symbol_type": s.symbol_type,
                "weight_base": s.weight_base,
                "weight_free": s.weight_free,
                "multiplier_value": s.multiplier_value,
                "payout_8_9": s.payout_8_9,
                "payout_10_11": s.payout_10_11,
                "payout_12_plus": s.payout_12_plus,
                "image_url": img_url
            })

        audios = []
        for a in GameAudio.objects.filter(is_active=True):
            audio_url = None
            if a.custom_audio:
                audio_url = request.build_absolute_uri(a.custom_audio.url)
            audios.append({
                "audio_id": a.audio_id,
                "name": a.name,
                "audio_url": audio_url
            })

        return Response({
            "symbols": symbols,
            "audios": audios
        }, status=200)



class ResetWalletView(APIView):
    """Resets the user wallet to base game state with zero free spins and $100,000 balance."""
    def post(self, request):
        user = request.user
        if not user or user.is_anonymous:
            user, _ = User.objects.get_or_create(username="dev_player")
        wallet, _ = UserWallet.objects.get_or_create(user=user)
        wallet.free_spins_left = 0
        wallet.current_multiplier = 1.0
        wallet.free_spin_bet_amount = Decimal('0.00')
        wallet.save()
        
        # Clear cache
        cache_key = f"user_balance_{user.id}"
        try:
            cache.delete(cache_key)
        except Exception:
            pass
        
        return Response({
            "balance": float(wallet.balance),
            "free_spins_left": wallet.free_spins_left,
            "current_multiplier": wallet.current_multiplier
        }, status=200)
