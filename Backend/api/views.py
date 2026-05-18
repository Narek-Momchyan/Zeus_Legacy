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


from .models import Symbol, GameAudio

class GameConfigView(APIView):
    """
    Returns the game symbols and game audios.
    Automatically seeds them if they are empty in the database.
    """
    def get(self, request):
        # 1. Auto-seed Symbols
        if Symbol.objects.filter(symbol_id="blue_gem", weight_base=75.0).exists():
            Symbol.objects.all().delete()
            
        if Symbol.objects.count() == 0:
            default_symbols = [
                {"id": "crown", "name": "Crown", "type": "regular", "weight_base": 2.5, "weight_free": 4.0, "payout_8_9": 10.0, "payout_10_11": 25.0, "payout_12_plus": 50.0},
                {"id": "hourglass", "name": "Hourglass", "type": "regular", "weight_base": 4.0, "weight_free": 8.0, "payout_8_9": 2.5, "payout_10_11": 10.0, "payout_12_plus": 25.0},
                {"id": "ring", "name": "Ring", "type": "regular", "weight_base": 6.0, "weight_free": 12.0, "payout_8_9": 2.0, "payout_10_11": 5.0, "payout_12_plus": 15.0},
                {"id": "cup", "name": "Cup", "type": "regular", "weight_base": 8.0, "weight_free": 18.0, "payout_8_9": 1.5, "payout_10_11": 2.0, "payout_12_plus": 12.0},
                {"id": "red_gem", "name": "Red Gem", "type": "regular", "weight_base": 15.0, "weight_free": 22.0, "payout_8_9": 1.0, "payout_10_11": 1.5, "payout_12_plus": 10.0},
                {"id": "purple_gem", "name": "Purple Gem", "type": "regular", "weight_base": 18.0, "weight_free": 24.0, "payout_8_9": 0.8, "payout_10_11": 1.2, "payout_12_plus": 8.0},
                {"id": "yellow_gem", "name": "Yellow Gem", "type": "regular", "weight_base": 20.0, "weight_free": 26.0, "payout_8_9": 0.5, "payout_10_11": 1.0, "payout_12_plus": 5.0},
                {"id": "green_gem", "name": "Green Gem", "type": "regular", "weight_base": 22.0, "weight_free": 28.0, "payout_8_9": 0.4, "payout_10_11": 0.9, "payout_12_plus": 4.0},
                {"id": "blue_gem", "name": "Blue Gem", "type": "regular", "weight_base": 24.0, "weight_free": 30.0, "payout_8_9": 0.25, "payout_10_11": 0.75, "payout_12_plus": 2.0},
                {"id": "scatter", "name": "Zeus Scatter", "type": "scatter", "weight_base": 1.5, "weight_free": 8.0, "payout_8_9": 3.0, "payout_10_11": 5.0, "payout_12_plus": 100.0},
                {"id": "mult_2", "name": "x2 Multiplier", "type": "multiplier", "weight_base": 1.0, "weight_free": 16.0, "multiplier_value": 2.0},
                {"id": "mult_5", "name": "x5 Multiplier", "type": "multiplier", "weight_base": 0.5, "weight_free": 10.0, "multiplier_value": 5.0},
                {"id": "mult_10", "name": "x10 Multiplier", "type": "multiplier", "weight_base": 0.2, "weight_free": 6.0, "multiplier_value": 10.0},
                {"id": "mult_25", "name": "x25 Multiplier", "type": "multiplier", "weight_base": 0.05, "weight_free": 3.0, "multiplier_value": 25.0},
                {"id": "mult_50", "name": "x50 Multiplier", "type": "multiplier", "weight_base": 0.02, "weight_free": 1.5, "multiplier_value": 50.0},
                {"id": "mult_100", "name": "x100 Multiplier", "type": "multiplier", "weight_base": 0.01, "weight_free": 0.8, "multiplier_value": 100.0},
                {"id": "mult_250", "name": "x250 Multiplier", "type": "multiplier", "weight_base": 0.005, "weight_free": 0.3, "multiplier_value": 250.0},
                {"id": "mult_500", "name": "x500 Multiplier", "type": "multiplier", "weight_base": 0.002, "weight_free": 0.1, "multiplier_value": 500.0},
            ]
            for ds in default_symbols:
                Symbol.objects.create(
                    symbol_id=ds["id"],
                    name=ds["name"],
                    symbol_type=ds["type"],
                    weight_base=ds["weight_base"],
                    weight_free=ds.get("weight_free", ds["weight_base"]),
                    multiplier_value=ds.get("multiplier_value", 0.0),
                    payout_8_9=ds.get("payout_8_9", 0.0),
                    payout_10_11=ds.get("payout_10_11", 0.0),
                    payout_12_plus=ds.get("payout_12_plus", 0.0),
                )

        # 2. Auto-seed Audios
        if GameAudio.objects.count() == 0:
            default_audios = [
                {"id": "stoneTumble", "name": "Stone Tumble Sound"},
                {"id": "sparkleWin", "name": "Sparkle Win Sound"},
                {"id": "zeusLightning", "name": "Zeus Lightning Sound"},
                {"id": "epicDrop", "name": "Epic Drop Sound"},
                {"id": "freeSpinsTheme", "name": "Free Spins Background Music"},
                {"id": "bigWin", "name": "Big Win Fanfare"},
                {"id": "megaWin", "name": "Mega Win Fanfare"},
                {"id": "ultraWin", "name": "Ultra Win Fanfare"},
                {"id": "anteToggle", "name": "Ante Bet Toggle Sound"},
                {"id": "symbolExplode", "name": "Symbol Explosion Sound"},
                {"id": "collectMultiplier", "name": "Multiplier Collect Sound"},
                {"id": "winTick", "name": "Win Value Counter Sound"},
                {"id": "scatterImpact", "name": "Scatter Landing Impact"},
            ]
            for da in default_audios:
                GameAudio.objects.create(
                    audio_id=da["id"],
                    name=da["name"],
                    is_active=True
                )

        # 3. Retrieve and format response
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
