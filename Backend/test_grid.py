import sys
import os
from collections import Counter

# Add current directory to path to import the service
sys.path.append(os.getcwd())

from services.game_engine_service import GameEngineService

def test_grid_generation():
    engine = GameEngineService()
    
    print("--- Single Grid Sample ---")
    grid = engine.generate_grid()
    for row in grid:
        print(row)
    
    print("\n--- Weight Verification (10,000 spins) ---")
    all_symbols = []
    for _ in range(10000):
        grid = engine.generate_grid()
        for row in grid:
            all_symbols.extend(row)
    
    counts = Counter(all_symbols)
    total = len(all_symbols)
    
    print(f"{'Symbol':<15} | {'Actual %':<10} | {'Expected %'}")
    print("-" * 45)
    
    # Calculate total weight
    total_weight = sum(s.weight for s in engine.config.symbols)
    
    for symbol in engine.config.symbols:
        actual_pct = (counts[symbol.id] / total) * 100
        expected_pct = (symbol.weight / total_weight) * 100
        print(f"{symbol.name:<15} | {actual_pct:>8.2f}% | {expected_pct:>8.2f}%")

def test_win_evaluation():
    engine = GameEngineService()
    
    print("\n--- Win Evaluation Test ---")
    # Force a winning grid
    grid = [
        ['crown', 'crown', 'crown', 'crown', 'crown', 'crown'],
        ['crown', 'crown', 'crown', 'crown', 'crown', 'crown'],
        ['blue_gem', 'blue_gem', 'blue_gem', 'blue_gem', 'blue_gem', 'blue_gem'],
        ['red_gem', 'red_gem', 'red_gem', 'red_gem', 'red_gem', 'red_gem'],
        ['red_gem', 'red_gem', 'red_gem', 'red_gem', 'red_gem', 'red_gem'],
    ]
    
    result = engine.evaluate_wins(grid)
    print(f"Total Payout: {result.total_payout}")
    for win in result.wins:
        print(f"Win: {win.symbol_id} x{win.count} -> {win.payout}")
    
    print(f"Winning coords count: {len(result.winning_coords)}")

    print("\n--- Tumble Test ---")
    new_grid = engine.apply_tumble(grid, result.winning_coords)
    print("New Grid after tumble:")
    for row in new_grid:
        print(row)

def test_full_spin():
    engine = GameEngineService()
    print("\n--- Full Spin Execution Test ---")
    
    # Run a real spin
    payload = engine.execute_spin()
    
    print(f"Total Win: {payload['total_win']}")
    print(f"Total Tumbles: {payload['tumble_count']}")
    
    # Check history structure
    for step in payload['tumble_history']:
        print(f"\nStep {step['step']}:")
        print(f"  Wins: {len(step['wins'])}")
        if step['win_amount'] > 0:
            print(f"  Amount: {step['win_amount']}")
            for win in step['wins']:
                print(f"    - {win['symbol_id']} x{win['count']}")

    # Verify JSON serializability
    import json
    try:
        json_payload = json.dumps(payload)
        print("\n[SUCCESS] Payload is fully JSON serializable.")
    except Exception as e:
        print(f"\n[ERROR] Serialization failed: {e}")

if __name__ == "__main__":
    test_grid_generation()
    test_win_evaluation()
    test_full_spin()
