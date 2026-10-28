"""
Monte Carlo RTP simulation for the Zeus Legacy slot engine.

Runs GameEngineService directly (no database, no Django setup) and mirrors the
game-state flow of BettingService: base spins, free spin awards, retriggers,
the persistent free-spin multiplier and the max-win forfeit rule.

Usage (from the Backend directory):
    python scripts/simulate_rtp.py                     # 200,000 base spins
    python scripts/simulate_rtp.py --spins 1000000 --seed 42
    python scripts/simulate_rtp.py --mode ante
    python scripts/simulate_rtp.py --mode buy --spins 20000
"""
import argparse
import os
import random
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services import game_engine_service  # noqa: E402
from services.game_engine_service import GameEngineService  # noqa: E402

try:
    from services import jackpot as jackpot_rules  # noqa: E402
except ImportError:
    jackpot_rules = None

BUY_BONUS_COST = 100.0
ANTE_BET_COST = 1.25


class OfflineEngine(GameEngineService):
    """Engine that skips the database and uses the built-in default weights."""

    def _load_symbols_from_db(self):
        return None, None, None


class SeededRandom:
    """Drop-in replacement for the `secrets` module calls used by the engine."""

    def __init__(self, seed):
        self._rng = random.Random(seed)

    def randbelow(self, n):
        return self._rng.randrange(n)

    def choice(self, seq):
        return self._rng.choice(seq)


def simulate(spins, mode, seed=None):
    if seed is not None:
        game_engine_service.secrets = SeededRandom(seed)

    engine = OfflineEngine()
    start_multiplier = getattr(GameEngineService, "START_MULTIPLIER", 1.0)
    fs_award = getattr(GameEngineService, "FREE_SPINS_AWARD", 15)
    fs_retrigger = getattr(GameEngineService, "FREE_SPINS_RETRIGGER", 15)

    is_ante = mode == "ante"
    is_buy = mode == "buy"
    cost = BUY_BONUS_COST if is_buy else (ANTE_BET_COST if is_ante else 1.0)

    total_bet = 0.0
    base_win = 0.0
    bonus_win = 0.0
    jackpot_win = 0.0
    base_hits = 0
    bonus_triggers = 0
    retriggers = 0
    free_spins_played = 0
    max_wins = 0
    best_round = 0.0

    if jackpot_rules:
        jackpot_seeds = {t: float(v) for t, v in jackpot_rules.SEED_POOLS.items()}
        jackpot_rates = {t: float(v) for t, v in jackpot_rules.CONTRIBUTION_RATES.items()}
        jackpot_pools = dict(jackpot_seeds)
    jackpot_rng = random.Random(None if seed is None else seed + 1)

    for _ in range(spins):
        total_bet += cost

        if jackpot_rules:
            jackpot_pools = {t: p + cost * jackpot_rates[t] for t, p in jackpot_pools.items()}
            tier = jackpot_rules.roll_jackpot(cost, rand=jackpot_rng.random)
            if tier:
                jackpot_win += jackpot_pools[tier]
                jackpot_pools[tier] = jackpot_seeds[tier]

        result = engine.execute_spin(
            is_free_spin=False,
            current_global_multiplier=start_multiplier,
            force_scatters=4 if is_buy else 0,
            is_ante_bet=is_ante,
        )
        round_win = result["total_win"]
        base_win += result["total_win"]
        if result["total_win"] > 0:
            base_hits += 1
        if result.get("is_max_win"):
            max_wins += 1

        if result["triggered_free_spins"]:
            bonus_triggers += 1
            free_spins_left = fs_award
            fs_multiplier = start_multiplier
            while free_spins_left > 0:
                fs = engine.execute_spin(is_free_spin=True, current_global_multiplier=fs_multiplier)
                free_spins_played += 1
                bonus_win += fs["total_win"]
                round_win += fs["total_win"]
                free_spins_left -= 1
                fs_multiplier = fs["global_multiplier_value"]
                if fs["triggered_free_spins"]:
                    retriggers += 1
                    free_spins_left += fs_retrigger
                if fs.get("is_max_win"):
                    max_wins += 1
                    free_spins_left = 0
        best_round = max(best_round, round_win)

    total_win = base_win + bonus_win
    return {
        "spins": spins,
        "mode": mode,
        "total_bet": total_bet,
        "base_win": base_win,
        "bonus_win": bonus_win,
        "jackpot_win": jackpot_win,
        "rtp": total_win / total_bet * 100,
        "rtp_base": base_win / total_bet * 100,
        "rtp_bonus": bonus_win / total_bet * 100,
        "rtp_jackpot": jackpot_win / total_bet * 100,
        "hit_rate": base_hits / spins * 100,
        "bonus_triggers": bonus_triggers,
        "retriggers": retriggers,
        "free_spins_played": free_spins_played,
        "max_wins": max_wins,
        "best_round": best_round,
    }


def main():
    parser = argparse.ArgumentParser(description="Simulate slot RTP without a database.")
    parser.add_argument("--spins", type=int, default=200_000, help="number of paid spins (default 200000)")
    parser.add_argument("--mode", choices=["base", "ante", "buy"], default="base")
    parser.add_argument("--seed", type=int, default=None, help="use a seeded PRNG for reproducible, faster runs")
    args = parser.parse_args()

    started = time.time()
    s = simulate(args.spins, args.mode, args.seed)
    elapsed = time.time() - started

    print(f"=== Zeus Legacy RTP simulation ({s['mode']} mode, {s['spins']:,} paid spins) ===")
    print(f"Total bet:            {s['total_bet']:,.2f}")
    print(f"Total win (game):     {s['base_win'] + s['bonus_win']:,.2f}")
    print(f"RTP (game):           {s['rtp']:.2f}%")
    print(f"  base game part:     {s['rtp_base']:.2f}%")
    print(f"  free spins part:    {s['rtp_bonus']:.2f}%")
    if jackpot_rules:
        print(f"RTP (jackpots):       {s['rtp_jackpot']:.2f}%")
        print(f"RTP (game+jackpots):  {s['rtp'] + s['rtp_jackpot']:.2f}%")
    print(f"Hit rate:             {s['hit_rate']:.2f}% (paid spins with a win)")
    if s["bonus_triggers"]:
        print(f"Bonus frequency:      1 in {s['spins'] / s['bonus_triggers']:,.1f} spins ({s['bonus_triggers']:,} triggers)")
        print(f"Avg free spins/bonus: {s['free_spins_played'] / s['bonus_triggers']:.1f}")
        print(f"Avg bonus win:        {s['bonus_win'] / s['bonus_triggers']:.2f}x bet")
    else:
        print("Bonus frequency:      no bonus triggered")
    print(f"Retriggers:           {s['retriggers']:,}")
    print(f"Max-win (cap) hits:   {s['max_wins']:,}")
    print(f"Best round:           {s['best_round']:.2f}x bet")
    print(f"Elapsed:              {elapsed:.1f}s")


if __name__ == "__main__":
    main()
