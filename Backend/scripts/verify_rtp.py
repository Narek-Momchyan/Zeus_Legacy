import os
import sys
import django
from decimal import Decimal

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import GameLog

def calculate_rtp(limit=100000):
    """
    Calculates the Return to Player (RTP) percentage based on GameLog records.
    RTP = (Total Win / Total Bet) * 100
    """
    print(f"--- RTP Analysis (Last {limit} spins) ---")
    
    logs = GameLog.objects.all().order_by('-created_at')[:limit]
    
    if not logs.exists():
        print("No game logs found to analyze.")
        return

    total_bet = sum(log.bet_amount for log in logs)
    total_win = sum(log.win_amount for log in logs)
    
    if total_bet == 0:
        print("Total bet is zero. Cannot calculate RTP.")
        return

    rtp = (total_win / total_bet) * 100
    
    print(f"Total Spins Analyzed: {len(logs)}")
    print(f"Total Amount Bet:    ${total_bet:,.2f}")
    print(f"Total Amount Won:    ${total_win:,.2f}")
    print(f"Calculated RTP:      {rtp:.2f}%")
    
    if 95 <= rtp <= 98:
        print("\n[SUCCESS] RTP is within the healthy professional range (95-98%).")
    elif rtp > 98:
        print("\n[WARNING] RTP is high (>98%). The house edge is very thin or negative.")
    else:
        print("\n[NOTE] RTP is low (<95%). This increases house margin.")

if __name__ == "__main__":
    calculate_rtp()
