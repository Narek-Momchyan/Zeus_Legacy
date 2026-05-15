from django.urls import path
from .views import SpinView, BalanceView

urlpatterns = [
    path('spin/', SpinView.as_view(), name='game-spin'),
    path('balance/', BalanceView.as_view(), name='game-balance'),
]
