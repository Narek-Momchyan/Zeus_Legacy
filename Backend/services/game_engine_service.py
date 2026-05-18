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

    def _load_symbols_from_db(self):
        try:
            from api.models import Symbol, GameAudio
            # If the database is empty, seed it (fallback)
            if Symbol.objects.count() == 0:
                self._seed_db_symbols_local()
                
            if GameAudio.objects.count() == 0:
                self._seed_db_audios_local()
                
            db_symbols = Symbol.objects.all()
            if not db_symbols:
                return None, None, None
                
            symbols = []
            base_weights = {}
            free_weights = {}
            
            for s in db_symbols:
                payout_cfg = {}
                if s.symbol_type == 'scatter':
                    payout_cfg = {4: s.payout_8_9, 5: s.payout_10_11, 6: s.payout_12_plus}
                elif s.symbol_type == 'regular':
                    payout_cfg = {8: s.payout_8_9, 10: s.payout_10_11, 12: s.payout_12_plus}
                
                symbols.append(SymbolConfig(
                    id=s.symbol_id,
                    name=s.name,
                    weight=int(s.weight_base),
                    payout_config=payout_cfg,
                    type=s.symbol_type,
                    multiplier_value=s.multiplier_value
                ))
                
                base_weights[s.symbol_id] = s.weight_base
                free_weights[s.symbol_id] = s.weight_free
                
            return symbols, base_weights, free_weights
        except Exception as e:
            import logging
            logging.getLogger('django').warning(f"Failed to load slot symbols from DB: {str(e)}. Using static math configuration fallback.")
            return None, None, None

    def _seed_db_symbols_local(self):
        from api.models import Symbol
        
        # Check if database has the old high win chance weights, and purge to auto-upgrade to real casino math
        if Symbol.objects.filter(symbol_id="blue_gem", weight_base=75.0).exists():
            Symbol.objects.all().delete()
            
        default_symbols = [
            {"id": "crown", "name": "Crown", "type": "regular", "weight_base": 2.5, "weight_free": 4.0, "payout_8_9": 10.0, "payout_10_11": 25.0, "payout_12_plus": 50.0},
            {"id": "hourglass", "name": "Hourglass", "type": "regular", "weight_base": 4.0, "weight_free": 8.0, "payout_8_9": 2.5, "payout_10_11": 10.0, "payout_12_plus": 25.0},
            {"id": "ring", "name": "Ring", "type": "regular", "weight_base": 6.0, "weight_free": 12.0, "payout_8_9": 2.0, "payout_10_11": 5.0, "payout_12_plus": 15.0},
            {"id": "cup", "name": "Cup", "type": "regular", "weight_base": 8.0, "weight_free": 18.0, "payout_8_9": 1.5, "payout_10_11": 2.0, "payout_12_plus": 12.0},
            {"id": "red_gem", "name": "Red Gem", "type": "regular", "weight_base": 15.0, "weight_free": 22.0, "payout_8_9": 1.0, "payout_10_11": 1.5, "payout_12_plus": 10.0},
            {"id": "purple_gem", "name": "Purple Gem", "type": "regular", "weight_base": 18.0, "weight_free": 24.0, "payout_8_9": 0.8, "payout_10_11": 1.2, "payout_12_plus": 8.0},
            {"id": "yellow_gem", "name": "Yellow Gem", "type": "regular", "weight_base": 20.0, "weight_free": 26.0, "payout_8_9": 0.5, "payout_10_11": 1.0, "payout_12_plus": 5.0},
            {"id": "green_gem", "name": "Green Gem", "type": "regular", "weight_base": 22.0, "weight_free": 28.0, "payout_8_9": 0.4, "payout_10_11": 0.9, "payout_12_plus": 4.0},
            {"id": "blue_gem", "name": "Blue Gem", "type": "regular", "weight_base": 24.0, "weight_free": 30.0, "payout_8_9": 0.25, "payout_10_11": 0.75, "payout_12_plus": 2.0},
            {"id": "scatter", "name": "Zeus Scatter", "type": "scatter", "weight_base": 1.5, "weight_free": 8.0, "payout_8_9": 3.0, "payout_10_11": 5.0, "payout_12_plus": 100.0},
            {"id": "mult_2", "name": "x2 Multiplier", "type": "multiplier", "weight_base": 1.0, "weight_free": 16.0, "multiplier_value": 2.0},
            {"id": "mult_5", "name": "x5 Multiplier", "type": "multiplier", "weight_base": 0.5, "weight_free": 10.0, "multiplier_value": 5.0},
            {"id": "mult_10", "name": "x10 Multiplier", "type": "multiplier", "weight_base": 0.2, "weight_free": 6.0, "multiplier_value": 10.0},
            {"id": "mult_25", "name": "x25 Multiplier", "type": "multiplier", "weight_base": 0.05, "weight_free": 3.0, "multiplier_value": 25.0},
            {"id": "mult_50", "name": "x50 Multiplier", "type": "multiplier", "weight_base": 0.02, "weight_free": 1.5, "multiplier_value": 50.0},
            {"id": "mult_100", "name": "x100 Multiplier", "type": "multiplier", "weight_base": 0.01, "weight_free": 0.8, "multiplier_value": 100.0},
            {"id": "mult_250", "name": "x250 Multiplier", "type": "multiplier", "weight_base": 0.005, "weight_free": 0.3, "multiplier_value": 250.0},
            {"id": "mult_500", "name": "x500 Multiplier", "type": "multiplier", "weight_base": 0.002, "weight_free": 0.1, "multiplier_value": 500.0},
        ]
        for ds in default_symbols:
            Symbol.objects.get_or_create(
                symbol_id=ds["id"],
                defaults={
                    "name": ds["name"],
                    "symbol_type": ds["type"],
                    "weight_base": ds["weight_base"],
                    "weight_free": ds["weight_free"],
                    "multiplier_value": ds.get("multiplier_value", 0.0),
                    "payout_8_9": ds.get("payout_8_9", 0.0),
                    "payout_10_11": ds.get("payout_10_11", 0.0),
                    "payout_12_plus": ds.get("payout_12_plus", 0.0),
                }
            )

    def _seed_db_audios_local(self):
        from api.models import GameAudio
        default_audios = [
            {"id": "stoneTumble", "name": "Stone Tumble Sound"},
            {"id": "sparkleWin", "name": "Sparkle Win Sound"},
            {"id": "zeusLightning", "name": "Zeus Lightning Sound"},
            {"id": "epicDrop", "name": "Epic Drop Sound"},
            {"id": "freeSpinsTheme", "name": "Free Spins Background Music"},
            {"id": "bigWin", "name": "Big Win Fanfare"},
            {"id": "megaWin", "name": "Mega Win Fanfare"},
            {"id": "ultraWin", "name": "Ultra Win Fanfare"},
            {"id": "anteToggle", "name": "Ante Bet Toggle Switch"},
            {"id": "symbolExplode", "name": "Symbol Explosion Impact"},
            {"id": "collectMultiplier", "name": "Collect Multiplier Chime"},
            {"id": "winTick", "name": "Balance Count-up Ticking"},
            {"id": "scatterImpact", "name": "Scatter Landing Impact"},
        ]
        for da in default_audios:
            GameAudio.objects.get_or_create(
                audio_id=da["id"],
                defaults={"name": da["name"]}
            )

    def __init__(self, config: Optional[GameConfig] = None):
        db_symbols, db_base_weights, db_free_weights = self._load_symbols_from_db()
        
        if db_symbols:
            self.config = GameConfig(rows=5, cols=6, symbols=db_symbols)
            self.BASE_GAME_WEIGHTS = db_base_weights
            self.FREE_SPIN_WEIGHTS = db_free_weights
        else:
            self.config = config or self._get_default_config()
            self.BASE_GAME_WEIGHTS = {
                "crown": 2.5, "hourglass": 4.0, "ring": 6.0, "cup": 8.0,
                "red_gem": 15.0, "purple_gem": 18.0, "yellow_gem": 20.0, "green_gem": 22.0, "blue_gem": 24.0,
                "scatter": 1.5,
                "mult_2": 1.0, "mult_5": 0.5, "mult_10": 0.2, "mult_25": 0.05,
                "mult_50": 0.02, "mult_100": 0.01, "mult_250": 0.005, "mult_500": 0.002
            }
            self.FREE_SPIN_WEIGHTS = {
                "crown": 4.0, "hourglass": 8.0, "ring": 12.0, "cup": 18.0,
                "red_gem": 22.0, "purple_gem": 24.0, "yellow_gem": 26.0, "green_gem": 28.0, "blue_gem": 30.0,
                "scatter": 8.0,
                "mult_2": 16.0, "mult_5": 10.0, "mult_10": 6.0, "mult_25": 3.0,
                "mult_50": 1.5, "mult_100": 0.8, "mult_250": 0.3, "mult_500": 0.1
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
        any_multiplier_collected = False
        
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
                any_multiplier_collected = True
            
            # 3. Payout Calculation
            cumulative_base_win += result.total_payout
            
            # Sequence win = (Sum of gem wins * Current Global Multiplier) + Scatter Win
            # Real Slot Rule: Accumulated multiplier ONLY applies if at least one multiplier landed in a winning tumble of this spin.
            current_multiplier_to_apply = global_mult if (global_mult > 0 and any_multiplier_collected) else 1
            # IMPORTANT: Scatter wins are NEVER multiplied by the global multiplier in real slots.
            current_sequence_win = (cumulative_base_win * current_multiplier_to_apply) + total_scatter_win

            # 3b. MAX WIN CAPPING (1000x)
            max_win_capped = False
            if current_sequence_win >= 1000.0:
                current_sequence_win = 1000.0
                max_win_capped = True

            next_grid = self.apply_tumble(
                current_grid, 
                result.winning_coords, 
                is_free_spin=is_free_spin, 
                is_ante_bet=is_ante_bet,
                disable_multipliers=disable_multipliers
            ) if (result.wins and not max_win_capped) else [row[:] for row in current_grid]

            step_data = {
                "step": tumble_count,
                "grid": [row[:] for row in current_grid],
                "next_grid": next_grid if not max_win_capped else [row[:] for row in current_grid],
                "winning_coords": result.winning_coords if not max_win_capped else [],
                "multiplier": tumble_mult_sum if tumble_mult_sum > 0 else None,
                "payout": result.total_payout if not max_win_capped else 0,
                "sequence_win": current_sequence_win,
                "is_free_spin": is_free_spin,
                "is_max_win": max_win_capped
            }
            tumble_history.append(step_data)
            
            if not result.wins or max_win_capped:
                break
                
            current_grid = next_grid
            tumble_count += 1
            
        final_multiplier_to_apply = global_mult if (global_mult > 0 and any_multiplier_collected) else 1
        final_total_win = (cumulative_base_win * final_multiplier_to_apply) + total_scatter_win
        
        # FINAL PROTECTION: Max win capped at 1000.0
        final_total_win = min(final_total_win, 1000.0)

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
