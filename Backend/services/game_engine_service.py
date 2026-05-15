import secrets
import random # Keep random for shuffle if needed, but use secrets for outcomes
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional


@dataclass(frozen=True)
class SymbolConfig:
    """Configuration for a single game symbol."""
    id: str
    name: str
    weight: int  # Higher weight = more frequent appearance
    payout_config: Dict[int, float]  # Key: min count, Value: payout multiplier
    type: str = "regular"  # "regular", "scatter", or "multiplier"
    multiplier_value: float = 0.0  # Used only if type is "multiplier"


@dataclass
class GameConfig:
    """Global configuration for the slot engine."""
    rows: int = 5
    cols: int = 6
    symbols: List[SymbolConfig] = field(default_factory=list)


@dataclass
class WinDetail:
    """Details of a specific symbol win."""
    symbol_id: str
    count: int
    payout: float


@dataclass
class TumbleResult:
    """Result of a single grid evaluation."""
    wins: List[WinDetail]
    total_payout: float
    winning_coords: List[tuple]  # List of (row, col)
    grid: List[List[str]]
    multiplier_symbols: List[float] = field(default_factory=list) # Values of x2, x10, etc.


class GameEngineService:
    """
    Core engine service for the cascading slot game.
    Handles grid generation, win evaluation, and tumbling mechanics.
    """

    def __init__(self, config: Optional[GameConfig] = None):
        # Default configuration if none provided
        self.config = config or self._get_default_config()
        
        # Define State-Dependent Weight Tables (Senior Casino Math implementation)
        # BASE GAME: Multipliers (x symbols) are extremely rare
        self.BASE_GAME_WEIGHTS = {
            "crown": 4.0, "hourglass": 8.0, "ring": 12.0, "cup": 18.0,
            "red_gem": 35.0, "purple_gem": 45.0, "yellow_gem": 55.0, "green_gem": 65.0, "blue_gem": 75.0,
            "scatter": 6.0,
            "mult_2": 0.05, "mult_5": 0.02, "mult_10": 0.01, "mult_25": 0.005,
            "mult_50": 0.002, "mult_100": 0.001, "mult_250": 0.0005, "mult_500": 0.0001
        }

        # FREE SPINS: Multipliers are frequent (The 'Money' round)
        self.FREE_SPIN_WEIGHTS = {
            "crown": 4.0, "hourglass": 8.0, "ring": 12.0, "cup": 18.0,
            "red_gem": 35.0, "purple_gem": 45.0, "yellow_gem": 55.0, "green_gem": 65.0, "blue_gem": 75.0,
            "scatter": 9.0, # Slightly higher scatter for retriggers
            "mult_2": 8.0, "mult_5": 5.0, "mult_10": 3.0, "mult_25": 1.5,
            "mult_50": 0.8, "mult_100": 0.4, "mult_250": 0.1, "mult_500": 0.05
        }

        # Sync symbol IDs from the config
        self._symbol_ids = [s.id for s in self.config.symbols]
        self._symbol_map = {s.id: s for s in self.config.symbols}

    def _secure_choice(self, population: List[Any], weights: List[float], k: int = 1) -> List[Any]:
        """
        Cryptographically Secure Weighted Selection.
        Equivalent to random.choices but using secrets module.
        """
        results = []
        for _ in range(k):
            # Convert float weights to integers for randbelow (scaling by 1000 for precision)
            int_weights = [int(w * 1000) for w in weights]
            total = sum(int_weights)
            r = secrets.randbelow(total)
            
            cursor = 0
            for i, weight in enumerate(int_weights):
                cursor += weight
                if r < cursor:
                    results.append(population[i])
                    break
        return results

    def _secure_shuffle(self, x: List[Any]):
        """CSPRNG implementation of Fisher-Yates shuffle."""
        for i in range(len(x) - 1, 0, -1):
            j = secrets.randbelow(i + 1)
            x[i], x[j] = x[j], x[i]

    def _get_default_config(self) -> GameConfig:
        """Provides a mathematically balanced 'Gates of Olympus' config with professional paytable."""
        return GameConfig(
            symbols=[
                SymbolConfig(
                    id="crown", name="Crown", weight=4, 
                    payout_config={8: 10.0, 10: 25.0, 12: 50.0} # Standard: 50x for 12+
                ),
                SymbolConfig(
                    id="hourglass", name="Hourglass", weight=8,
                    payout_config={8: 2.5, 10: 10.0, 12: 25.0} # 25x
                ),
                SymbolConfig(
                    id="ring", name="Ring", weight=12,
                    payout_config={8: 2.0, 10: 5.0, 12: 15.0} # 15x
                ),
                SymbolConfig(
                    id="cup", name="Cup", weight=18,
                    payout_config={8: 1.5, 10: 2.0, 12: 12.0} # 12x
                ),
                SymbolConfig(
                    id="red_gem", name="Red Gem", weight=35,
                    payout_config={8: 1.0, 10: 1.5, 12: 10.0}
                ),
                SymbolConfig(
                    id="purple_gem", name="Purple Gem", weight=45,
                    payout_config={8: 0.8, 10: 1.2, 12: 8.0}
                ),
                SymbolConfig(
                    id="yellow_gem", name="Yellow Gem", weight=55,
                    payout_config={8: 0.5, 10: 1.0, 12: 5.0}
                ),
                SymbolConfig(
                    id="green_gem", name="Green Gem", weight=65,
                    payout_config={8: 0.4, 10: 0.9, 12: 4.0}
                ),
                SymbolConfig(
                    id="blue_gem", name="Blue Gem", weight=75,
                    payout_config={8: 0.25, 10: 0.75, 12: 2.0}
                ),
                SymbolConfig(
                    id="scatter", name="Zeus Scatter", weight=6.0, type="scatter",
                    payout_config={4: 3.0, 5: 5.0, 6: 100.0} # Authentic: 100x for 6 scatters
                ),
                SymbolConfig(
                    id="mult_2", name="x2 Multiplier", weight=3.5, type="multiplier", 
                    multiplier_value=2.0, payout_config={}
                ),
                SymbolConfig(
                    id="mult_5", name="x5 Multiplier", weight=1.8, type="multiplier", 
                    multiplier_value=5.0, payout_config={}
                ),
                SymbolConfig(
                    id="mult_10", name="x10 Multiplier", weight=0.8, type="multiplier", 
                    multiplier_value=10.0, payout_config={}
                ),
                SymbolConfig(
                    id="mult_25", name="x25 Multiplier", weight=0.3, type="multiplier", 
                    multiplier_value=25.0, payout_config={}
                ),
                SymbolConfig(
                    id="mult_50", name="x50 Multiplier", weight=0.15, type="multiplier", 
                    multiplier_value=50.0, payout_config={}
                ),
                SymbolConfig(
                    id="mult_100", name="x100 Multiplier", weight=0.05, type="multiplier", 
                    multiplier_value=100.0, payout_config={}
                ),
                SymbolConfig(
                    id="mult_250", name="x250 Multiplier", weight=0.01, type="multiplier", 
                    multiplier_value=250.0, payout_config={}
                ),
                SymbolConfig(
                    id="mult_500", name="x500 Multiplier", weight=0.005, type="multiplier", 
                    multiplier_value=500.0, payout_config={}
                ),
            ]
        )

    def _get_current_weights(self, is_free_spin: bool, is_ante_bet: bool) -> List[float]:
        """Returns the appropriate weight list based on game state."""
        weight_map = self.FREE_SPIN_WEIGHTS if is_free_spin else self.BASE_GAME_WEIGHTS
        weights = [weight_map.get(sid, 1.0) for sid in self._symbol_ids]
        if is_ante_bet and not is_free_spin:
            try:
                weights[self._symbol_ids.index("scatter")] *= 2.0
            except: pass
        return weights

    def generate_grid(self, force_scatters: int = 0, is_ante_bet: bool = False, is_free_spin: bool = False) -> List[List[str]]:
        """
        Generates a 6x5 grid of symbols.
        """
        weights = self._get_current_weights(is_free_spin, is_ante_bet)
        
        # Adjustments are now handled by _get_current_weights

        # CRITICAL: If we are triggering a bonus (force_scatters > 0), 
        # we disable multipliers in the triggering grid to avoid absurd initial wins.
        if force_scatters > 0:
            for i, sym_id in enumerate(self._symbol_ids):
                if sym_id.startswith("mult_"):
                    weights[i] = 0

        grid = []
        for _ in range(self.config.rows):
            row = self._secure_choice(
                population=self._symbol_ids,
                weights=weights,
                k=self.config.cols
            )
            grid.append(row)
        
        if force_scatters > 0:
            # Randomly place forced scatters
            current_scatters = sum(row.count("scatter") for row in grid)
            needed = force_scatters - current_scatters
            if needed > 0:
                all_coords = [(r, c) for r in range(self.config.rows) for c in range(self.config.cols)]
                self._secure_shuffle(all_coords)
                for i in range(needed):
                    r, c = all_coords[i]
                    grid[r][c] = "scatter"
                    
        return grid

    def evaluate_wins(self, grid: List[List[str]]) -> TumbleResult:
        """
        Identifies all winning symbols based on the 'Pay Anywhere' (8+) rule.
        
        Args:
            grid: The current 6x5 grid.
            
        Returns:
            TumbleResult: Data containing win details and coordinates to explode.
        """
        # 1. Count occurrences of each symbol
        counts = {}
        coords_map = {}  # symbol_id -> list of (r, c)
        
        for r in range(self.config.rows):
            for c in range(self.config.cols):
                symbol_id = grid[r][c]
                counts[symbol_id] = counts.get(symbol_id, 0) + 1
                if symbol_id not in coords_map:
                    coords_map[symbol_id] = []
                coords_map[symbol_id].append((r, c))
        
        # 2. Evaluate against paytable
        wins = []
        total_payout = 0.0
        winning_coords = []
        multiplier_symbols = []
        
        for symbol_id, count in counts.items():
            symbol_cfg = self._symbol_map.get(symbol_id)
            if not symbol_cfg:
                continue
            
            # Multiplier symbols: Record them but don't add to winning_coords here
            if symbol_cfg.type == "multiplier":
                for _ in range(count):
                    multiplier_symbols.append(symbol_cfg.multiplier_value)
                continue

            # Scatters: Record them but don't add to winning_coords (they stay on grid)
            if symbol_cfg.type == "scatter":
                # Scatters pay if 4+ land, but they don't explode
                applicable = [b for b in symbol_cfg.payout_config.keys() if count >= b]
                if applicable:
                    payout = symbol_cfg.payout_config[max(applicable)]
                    wins.append(WinDetail(symbol_id=symbol_id, count=count, payout=payout))
                    total_payout += payout
                continue

            # Regular symbols: Evaluate paytable
            applicable_brackets = [b for b in symbol_cfg.payout_config.keys() if count >= b]
            if applicable_brackets:
                max_bracket = max(applicable_brackets)
                payout = symbol_cfg.payout_config[max_bracket]
                
                wins.append(WinDetail(symbol_id=symbol_id, count=count, payout=payout))
                total_payout += payout
                winning_coords.extend(coords_map[symbol_id])
        
        return TumbleResult(
            wins=wins,
            total_payout=total_payout,
            winning_coords=winning_coords,
            grid=grid,
            multiplier_symbols=multiplier_symbols
        )

    def apply_tumble(self, grid: List[List[str]], winning_coords: List[tuple], is_free_spin: bool = False, is_ante_bet: bool = False, disable_multipliers: bool = False) -> List[List[str]]:
        """
        Removes winning symbols, applies gravity, and refills empty spaces.
        """
        # Create a working copy of the grid with None for winning symbols
        new_grid_data = [row[:] for row in grid]
        for r, c in winning_coords:
            new_grid_data[r][c] = None
            
        weights = self._get_current_weights(is_free_spin, is_ante_bet)
        
        # CRITICAL: Disable multipliers if requested (for trigger spins)
        if disable_multipliers:
            for i, sym_id in enumerate(self._symbol_ids):
                if sym_id.startswith("mult_"):
                    weights[i] = 0

        # Process column by column to apply gravity
        final_grid = [[None for _ in range(self.config.cols)] for _ in range(self.config.rows)]
        
        for c in range(self.config.cols):
            existing_symbols = [new_grid_data[r][c] for r in range(self.config.rows) if new_grid_data[r][c] is not None]
            needed = self.config.rows - len(existing_symbols)
            
            new_symbols = self._secure_choice(
                population=self._symbol_ids,
                weights=weights,
                k=needed
            )
            
            # 4. Combine: New symbols on top, existing symbols on bottom
            full_column = new_symbols + existing_symbols
            
            # 5. Place back into final_grid
            for r in range(self.config.rows):
                final_grid[r][c] = full_column[r]
                
        return final_grid

    def execute_spin(self, is_free_spin: bool = False, current_global_multiplier: float = 0, force_scatters: int = 0, is_ante_bet: bool = False) -> Dict[str, Any]:
        """
        Orchestrates a full spin with Free Spins detection and Global Multiplier logic.
        """
        # If we are forcing scatters (Buy Bonus or Trigger), we disable multipliers for the WHOLE spin
        disable_multipliers = force_scatters > 0
        
        current_grid = self.generate_grid(force_scatters=force_scatters, is_ante_bet=is_ante_bet, is_free_spin=is_free_spin)
        initial_grid = [row[:] for row in current_grid]
        
        cumulative_base_win = 0.0
        total_scatter_win = 0.0
        tumble_history = []
        max_tumbles = 30
        tumble_count = 0
        
        global_mult = current_global_multiplier
        scatters_paid = False
        triggered_free_spins = False
        
        while tumble_count < max_tumbles:
            result = self.evaluate_wins(current_grid)
            
            # 1. Handle Scatters (Pay once per spin)
            scatter_count = sum(row.count("scatter") for row in current_grid)
            if scatter_count >= 4:
                triggered_free_spins = True
                if not scatters_paid:
                    scatter_cfg = self._symbol_map["scatter"]
                    applicable = [b for b in scatter_cfg.payout_config.keys() if scatter_count >= b]
                    if applicable:
                        total_scatter_win = scatter_cfg.payout_config[max(applicable)]
                        scatters_paid = True

            # 2. Multiplier logic
            tumble_mult_sum = sum(result.multiplier_symbols)
            
            # If there's a win in this tumble, multipliers are collected
            if result.wins and tumble_mult_sum > 0:
                global_mult += tumble_mult_sum
            
            # 3. Payout Calculation
            cumulative_base_win += result.total_payout
            
            # Sequence win = (Sum of gem wins * Current Global Multiplier) + Scatter Win
            current_multiplier_to_apply = global_mult if global_mult > 0 else 1
            # IMPORTANT: Scatter wins are NEVER multiplied by the global multiplier in real slots.
            current_sequence_win = (cumulative_base_win * current_multiplier_to_apply) + total_scatter_win

            next_grid = self.apply_tumble(
                current_grid, 
                result.winning_coords, 
                is_free_spin=is_free_spin, 
                is_ante_bet=is_ante_bet,
                disable_multipliers=disable_multipliers
            ) if result.wins else [row[:] for row in current_grid]

            step_data = {
                "step": tumble_count,
                "grid": [row[:] for row in current_grid],
                "next_grid": next_grid,
                "winning_coords": result.winning_coords,
                "multiplier": tumble_mult_sum if tumble_mult_sum > 0 else None,
                "payout": result.total_payout,
                "sequence_win": current_sequence_win,
                "is_free_spin": is_free_spin
            }
            tumble_history.append(step_data)
            
            if not result.wins:
                break
                
            current_grid = next_grid
            tumble_count += 1
            
        final_total_win = (cumulative_base_win * (global_mult if global_mult > 0 else 1)) + total_scatter_win
        
        # FINAL PROTECTION: Max win in Gates of Olympus is 5000x
        final_total_win = min(final_total_win, 5000.0)

        # TRIGGER CAP: Cap the win of the spin that triggers free spins to 10x
        if force_scatters > 0:
            final_total_win = min(final_total_win, 10.0)

        return {
            "initial_grid": initial_grid,
            "tumble_history": tumble_history,
            "total_win": final_total_win,
            "tumble_count": tumble_count,
            "triggered_free_spins": triggered_free_spins,
            "free_spins_left": 15 if triggered_free_spins else 0,
            "global_multiplier_value": global_mult,
            "is_free_spin": is_free_spin
        }
