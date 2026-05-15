from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal

class UserWallet(models.Model):
    """
    Stores the financial balance for a specific user.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='wallet'
    )
    balance = models.DecimalField(
        max_digits=20, 
        decimal_places=2, 
        default=Decimal('1000.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user.username}'s Wallet - {self.balance}"

class GameLog(models.Model):
    """
    Audit trail for every spin performed in the game.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='game_logs'
    )
    bet_amount = models.DecimalField(max_digits=12, decimal_places=2)
    win_amount = models.DecimalField(max_digits=12, decimal_places=2)
    total_multiplier = models.FloatField(default=1.0)
    history_payload = models.JSONField()
    is_free_spin = models.BooleanField(default=False)
    is_buy_bonus = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', '-created_at']), # Optimized for player history
            models.Index(fields=['win_amount']),         # For Big Win statistics
        ]

    def __str__(self):
        return f"Spin by {self.user.username} - Win: {self.win_amount}"
