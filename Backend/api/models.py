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
    
    # Secure Game State Tracking
    free_spins_left = models.IntegerField(default=0)
    current_multiplier = models.FloatField(default=1.0)
    free_spin_bet_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
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


class Symbol(models.Model):
    """
    Model to configure slot machine symbols dynamically from Django Admin.
    """
    SYMBOL_TYPES = [
        ('regular', 'Regular Symbol'),
        ('scatter', 'Scatter Symbol'),
        ('multiplier', 'Multiplier Symbol'),
    ]

    symbol_id = models.CharField(max_length=50, unique=True, help_text="e.g. crown, red_gem, scatter, mult_500")
    name = models.CharField(max_length=100)
    symbol_type = models.CharField(max_length=20, choices=SYMBOL_TYPES, default='regular')
    weight_base = models.FloatField(default=10.0, help_text="Weight/frequency during normal spins")
    weight_free = models.FloatField(default=10.0, help_text="Weight/frequency during free spins")
    
    # Multiplier properties
    multiplier_value = models.FloatField(default=0.0, help_text="Used only if symbol is Multiplier type")

    # Paytable properties (as payout multipliers of the bet)
    payout_8_9 = models.FloatField(default=0.0, help_text="Payout multiplier for 8-9 matching symbols (or 4 scatters)")
    payout_10_11 = models.FloatField(default=0.0, help_text="Payout multiplier for 10-11 matching symbols (or 5 scatters)")
    payout_12_plus = models.FloatField(default=0.0, help_text="Payout multiplier for 12+ matching symbols (or 6 scatters)")

    # Custom Asset upload
    custom_image = models.ImageField(upload_to='symbols/', blank=True, null=True, help_text="Upload custom image to replace default asset")

    def __str__(self):
        return f"{self.name} ({self.symbol_id}) - Base Weight: {self.weight_base}"


class GameAudio(models.Model):
    """
    Model to configure audio assets dynamically from Django Admin.
    """
    audio_id = models.CharField(max_length=50, unique=True, help_text="e.g. bg_music, spin_start, win_epic, scatter_land")
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    custom_audio = models.FileField(upload_to='audios/', blank=True, null=True, help_text="Upload custom audio file (.mp3 / .wav)")

    def __str__(self):
        return f"{self.name} ({self.audio_id}) - Active: {self.is_active}"


class ProgressiveJackpot(models.Model):
    """
    Singleton model to hold progressive jackpot pools.
    """
    mini_pool = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('100.00'))
    minor_pool = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('500.00'))
    major_pool = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('5000.00'))
    grand_pool = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('50000.00'))
    
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_solo(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f"Jackpots - Grand: ${self.grand_pool}"

