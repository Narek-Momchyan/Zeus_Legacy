"""
Progressive jackpot rules (pure Python, no Django), shared by BettingService
and the offline RTP simulation.

The chance to win a tier is proportional to the real money wagered on the spin,
so the jackpot RTP is the same for every bet size: a $0.20 spin has 1/500 of the
chance of a $100 spin. With chance = stake * contribution_rate / seed_pool, a
pool is won on average after it has grown by one extra seed, so each tier
returns about 2 * contribution_rate (all tiers together ~0.74% RTP).
"""
from decimal import Decimal
import secrets

# Ordered from the rarest to the most common tier
TIERS = ('GRAND', 'MAJOR', 'MINOR', 'MINI')

SEED_POOLS = {
    'MINI': Decimal('100.00'),
    'MINOR': Decimal('500.00'),
    'MAJOR': Decimal('5000.00'),
    'GRAND': Decimal('50000.00'),
}

# Share of every paid stake that is added to each pool
CONTRIBUTION_RATES = {
    'MINI': Decimal('0.0020'),
    'MINOR': Decimal('0.0010'),
    'MAJOR': Decimal('0.0005'),
    'GRAND': Decimal('0.0002'),
}

_RANDOM_RESOLUTION = 10 ** 12


def hit_chance(tier, stake):
    """Probability of winning `tier` on a spin that cost `stake`."""
    return float(stake) * float(CONTRIBUTION_RATES[tier]) / float(SEED_POOLS[tier])


def roll_jackpot(stake, rand=None):
    """
    Returns the won tier name or None. Spins with no real money stake (free spins)
    can never win. `rand` is an optional callable returning a float in [0, 1).
    """
    if stake <= 0:
        return None
    r = rand() if rand else secrets.randbelow(_RANDOM_RESOLUTION) / _RANDOM_RESOLUTION
    cursor = 0.0
    for tier in TIERS:
        cursor += hit_chance(tier, stake)
        if r < cursor:
            return tier
    return None
