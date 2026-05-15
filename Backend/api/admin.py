from django.contrib import admin
from .models import UserWallet, GameLog

@admin.register(UserWallet)
class UserWalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance', 'updated_at')
    search_fields = ('user__username',)
    list_editable = ('balance',)

@admin.register(GameLog)
class GameLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'bet_amount', 'win_amount', 'total_multiplier', 'created_at')
    list_filter = ('is_free_spin', 'is_buy_bonus', 'created_at')
    readonly_fields = ('created_at',)
