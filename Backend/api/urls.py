from django.urls import path
from .views import SpinView, BalanceView, GameConfigView

urlpatterns = [
    path('spin/', SpinView.as_view(), name='game-spin'),
    path('balance/', BalanceView.as_view(), name='game-balance'),
    path('game-config/', GameConfigView.as_view(), name='game-config'),
]
