from django.urls import path
from .views import SpinView, GameConfigView, ResetWalletView

urlpatterns = [
    path('spin/', SpinView.as_view(), name='game-spin'),
    path('game-config/', GameConfigView.as_view(), name='game-config'),
    path('reset-wallet/', ResetWalletView.as_view(), name='game-reset-wallet'),
]