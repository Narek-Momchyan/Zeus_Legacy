from django.contrib import admin
from .models import UserWallet, GameLog, Symbol, GameAudio

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

@admin.register(Symbol)
class SymbolAdmin(admin.ModelAdmin):
    list_display = ('symbol_id', 'name', 'symbol_type', 'weight_base', 'weight_free', 'multiplier_value', 'payout_8_9', 'payout_10_11', 'payout_12_plus')
    list_editable = ('weight_base', 'weight_free', 'payout_8_9', 'payout_10_11', 'payout_12_plus')
    search_fields = ('symbol_id', 'name')
    list_filter = ('symbol_type',)

@admin.register(GameAudio)
class GameAudioAdmin(admin.ModelAdmin):
    list_display = ('audio_id', 'name', 'is_active', 'custom_audio')
    list_editable = ('is_active',)
    search_fields = ('audio_id', 'name')
