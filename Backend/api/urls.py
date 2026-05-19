from django.urls import path
from .views import SpinView, BalanceView, GameConfigView, JackpotView, ResetWalletView

urlpatterns = [
    path('spin/', SpinView.as_view(), name='game-spin'),
    path('balance/', BalanceView.as_view(), name='game-balance'),
    path('game-config/', GameConfigView.as_view(), name='game-config'),
    path('jackpot/', JackpotView.as_view(), name='game-jackpot'),
    path('reset-wallet/', ResetWalletView.as_view(), name='game-reset-wallet'),
]
