"""
EV Charging Gap Scoring Engine.
Formula:
RawGap_c = max(0.0, Demand_c - alpha * Supply_c)
GapScore_c = 100.0 * (RawGap_c - min(RawGap)) / (max(RawGap) - min(RawGap))

Monotonicity Property:
Holding demand constant, increasing supply strictly decreases or maintains the gap score.
"""

from typing import List

def compute_gap_scores(
    demand_scores: List[float],
    supply_scores: List[float],
    alpha: float = 0.85
) -> List[float]:
    """
    Computes normalised gap scores in [0, 100].
    Higher score indicates higher unmet charging demand.
    """
    assert len(demand_scores) == len(supply_scores), "Demand and supply arrays must match in length"

    raw_gaps = []
    for d, s in zip(demand_scores, supply_scores):
        gap = max(0.0, float(d) - alpha * float(s))
        raw_gaps.append(gap)

    min_gap = min(raw_gaps) if raw_gaps else 0.0
    max_gap = max(raw_gaps) if raw_gaps else 1.0
    denom = (max_gap - min_gap) if max_gap > min_gap else 1.0

    gap_scores = [
        round(100.0 * (g - min_gap) / denom, 2)
        for g in raw_gaps
    ]

    return gap_scores
