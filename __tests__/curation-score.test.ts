import { describe, it, expect } from 'vitest';
import {
  filterVotesToWindow,
  calculateTotalVoteWeight,
  countUniqueAuthors,
  calculateSelfVoteWeight,
  groupVotesByAuthor,
  getTopAuthors,
  calculateTopNWeight,
  calculateBreadthScore,
  calculateGiniCoefficient,
  calculateDistributionScore,
  calculateAntiSelfScore,
  calculateFinalCQS,
  calculateCurationQualityScore,
} from '@/lib/curation-score';
import type { VoteHistoryEntry } from '@/types/hive';

// --- helpers ----------------------------------------------------------------

function makeVote(
  voter: string,
  author: string,
  weight: number,
  daysAgo: number
): VoteHistoryEntry {
  const ts = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return { transactionNumber: 0, timestamp: ts, voter, author, permlink: 'x', weight };
}

// A diverse, non-self-voting curator with 10 unique authors, equal weights
function makeIdealVotes(voter = 'alice', count = 10): VoteHistoryEntry[] {
  return Array.from({ length: count }, (_, i) =>
    makeVote(voter, `author${i}`, 1000, 1)
  );
}

// ---------------------------------------------------------------------------
// filterVotesToWindow
// ---------------------------------------------------------------------------
describe('filterVotesToWindow', () => {
  it('keeps votes inside the window', () => {
    const votes = [makeVote('a', 'b', 1000, 3), makeVote('a', 'c', 1000, 6)];
    expect(filterVotesToWindow(votes, 7)).toHaveLength(2);
  });

  it('drops votes outside the window', () => {
    const votes = [makeVote('a', 'b', 1000, 3), makeVote('a', 'c', 1000, 8)];
    expect(filterVotesToWindow(votes, 7)).toHaveLength(1);
  });

  it('returns empty array when all votes are outside the window', () => {
    const votes = [makeVote('a', 'b', 1000, 10)];
    expect(filterVotesToWindow(votes, 7)).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    expect(filterVotesToWindow([], 7)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// calculateTotalVoteWeight
// ---------------------------------------------------------------------------
describe('calculateTotalVoteWeight', () => {
  it('sums absolute weights including downvotes', () => {
    const votes = [
      makeVote('a', 'b', 5000, 1),
      makeVote('a', 'c', -3000, 1),
    ];
    expect(calculateTotalVoteWeight(votes)).toBe(8000);
  });

  it('returns 0 for empty input', () => {
    expect(calculateTotalVoteWeight([])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// countUniqueAuthors
// ---------------------------------------------------------------------------
describe('countUniqueAuthors', () => {
  it('counts distinct authors', () => {
    const votes = [
      makeVote('a', 'bob', 1000, 1),
      makeVote('a', 'bob', 1000, 2),
      makeVote('a', 'carol', 1000, 1),
    ];
    expect(countUniqueAuthors(votes)).toBe(2);
  });

  it('returns 0 for empty input', () => {
    expect(countUniqueAuthors([])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateSelfVoteWeight
// ---------------------------------------------------------------------------
describe('calculateSelfVoteWeight', () => {
  it('counts only votes where voter === author', () => {
    const votes = [
      makeVote('alice', 'alice', 5000, 1),
      makeVote('alice', 'bob', 3000, 1),
    ];
    expect(calculateSelfVoteWeight(votes)).toBe(5000);
  });

  it('returns 0 when there are no self-votes', () => {
    const votes = [makeVote('alice', 'bob', 5000, 1)];
    expect(calculateSelfVoteWeight(votes)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// groupVotesByAuthor / getTopAuthors / calculateTopNWeight
// ---------------------------------------------------------------------------
describe('groupVotesByAuthor', () => {
  it('accumulates weight and count per author', () => {
    const votes = [
      makeVote('a', 'bob', 2000, 1),
      makeVote('a', 'bob', 3000, 1),
      makeVote('a', 'carol', 1000, 1),
    ];
    const map = groupVotesByAuthor(votes);
    expect(map.get('bob')).toEqual({ count: 2, weight: 5000 });
    expect(map.get('carol')).toEqual({ count: 1, weight: 1000 });
  });
});

describe('getTopAuthors', () => {
  it('returns authors sorted by total weight descending', () => {
    const votes = [
      makeVote('a', 'low', 100, 1),
      makeVote('a', 'high', 9000, 1),
      makeVote('a', 'mid', 500, 1),
    ];
    const map = groupVotesByAuthor(votes);
    const top = getTopAuthors(map);
    expect(top[0].author).toBe('high');
    expect(top[1].author).toBe('mid');
    expect(top[2].author).toBe('low');
  });

  it('respects the topN limit', () => {
    const votes = makeIdealVotes('a', 10);
    const map = groupVotesByAuthor(votes);
    expect(getTopAuthors(map, 3)).toHaveLength(3);
  });
});

describe('calculateTopNWeight', () => {
  it('sums weight of top N authors only', () => {
    const votes = [
      makeVote('a', 'b1', 9000, 1),
      makeVote('a', 'b2', 500, 1),
      makeVote('a', 'b3', 100, 1),
    ];
    const map = groupVotesByAuthor(votes);
    expect(calculateTopNWeight(map, 2)).toBe(9500);
  });
});

// ---------------------------------------------------------------------------
// calculateBreadthScore
// ---------------------------------------------------------------------------
describe('calculateBreadthScore', () => {
  it('returns 0 for 0 unique authors', () => {
    expect(calculateBreadthScore(0)).toBe(0);
  });

  it('scales linearly up to 100 authors', () => {
    expect(calculateBreadthScore(50)).toBe(0.5);
  });

  it('caps at 1.0 for 100+ authors', () => {
    expect(calculateBreadthScore(100)).toBe(1.0);
    expect(calculateBreadthScore(200)).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// calculateGiniCoefficient
// ---------------------------------------------------------------------------
describe('calculateGiniCoefficient', () => {
  it('returns 0 for empty array', () => {
    expect(calculateGiniCoefficient([])).toBe(0);
  });

  it('returns 0 for a single author (degenerate perfect equality)', () => {
    expect(calculateGiniCoefficient([5000])).toBe(0);
  });

  it('returns 0 for perfectly equal weights', () => {
    const gini = calculateGiniCoefficient([1000, 1000, 1000, 1000]);
    expect(gini).toBeCloseTo(0, 5);
  });

  it('is high for maximally unequal weights', () => {
    // With 4 data points the formula caps around 0.75; still clearly skewed
    const gini = calculateGiniCoefficient([1, 1, 1, 99997]);
    expect(gini).toBeGreaterThan(0.7);
  });

  it('returns a value between 0 and 1 for mixed weights', () => {
    const gini = calculateGiniCoefficient([1000, 2000, 3000, 4000]);
    expect(gini).toBeGreaterThan(0);
    expect(gini).toBeLessThan(1);
  });
});

// ---------------------------------------------------------------------------
// calculateDistributionScore
// ---------------------------------------------------------------------------
describe('calculateDistributionScore', () => {
  it('returns 0.01 (worst) for a single author', () => {
    expect(calculateDistributionScore([5000])).toBe(0.01);
  });

  it('returns 1.0 for perfectly equal weights', () => {
    expect(calculateDistributionScore([1000, 1000, 1000])).toBeCloseTo(1.0, 5);
  });

  it('returns a low value for highly skewed weights', () => {
    // Gini ~0.75 with 4 points → D ~0.25; well below 0.5 confirms penalty
    const d = calculateDistributionScore([1, 1, 1, 99997]);
    expect(d).toBeLessThan(0.3);
  });
});

// ---------------------------------------------------------------------------
// calculateAntiSelfScore
// ---------------------------------------------------------------------------
describe('calculateAntiSelfScore', () => {
  it('returns 1.0 when there are no votes', () => {
    expect(calculateAntiSelfScore(0, 0)).toBe(1.0);
  });

  it('returns 1.0 when there are no self-votes', () => {
    expect(calculateAntiSelfScore(10000, 0)).toBe(1.0);
  });

  it('returns 0.0 when all votes are self-votes', () => {
    expect(calculateAntiSelfScore(10000, 10000)).toBe(0.0);
  });

  it('returns correct fractional value', () => {
    expect(calculateAntiSelfScore(10000, 2500)).toBeCloseTo(0.75);
  });
});

// ---------------------------------------------------------------------------
// calculateFinalCQS
// ---------------------------------------------------------------------------
describe('calculateFinalCQS', () => {
  it('returns score=100 for perfect sub-scores', () => {
    const { score } = calculateFinalCQS(1, 1, 1);
    expect(score).toBe(100);
  });

  it('returns score=1 for all-zero sub-scores', () => {
    const { score } = calculateFinalCQS(0, 0, 0);
    expect(score).toBe(1);
  });

  it('geometric mean punishes a single weak dimension', () => {
    const { score: balanced } = calculateFinalCQS(0.8, 0.8, 0.8);
    const { score: weak } = calculateFinalCQS(1.0, 1.0, 0.01);
    expect(balanced).toBeGreaterThan(weak);
  });

  it('rawScore is the cube root of the product', () => {
    const b = 0.8, d = 0.6, s = 0.9;
    const { rawScore } = calculateFinalCQS(b, d, s);
    expect(rawScore).toBeCloseTo(Math.pow(b * d * s, 1 / 3), 5);
  });

  it('score is always in range 1–100', () => {
    const cases: [number, number, number][] = [
      [0, 0, 0],
      [1, 1, 1],
      [0.5, 0.5, 0.5],
      [0.001, 0.999, 0.5],
    ];
    for (const [b, d, s] of cases) {
      const { score } = calculateFinalCQS(b, d, s);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

// ---------------------------------------------------------------------------
// calculateCurationQualityScore (integration)
// ---------------------------------------------------------------------------
describe('calculateCurationQualityScore', () => {
  it('returns score=1 for empty vote history', () => {
    const result = calculateCurationQualityScore([], 7);
    expect(result?.score).toBe(1);
    expect(result?.metrics.voteCount).toBe(0);
  });

  it('ignores downvotes and unvotes (weight <= 0)', () => {
    const votes = [
      makeVote('alice', 'bob', -5000, 1),   // downvote
      makeVote('alice', 'carol', 0, 1),      // unvote
    ];
    const result = calculateCurationQualityScore(votes, 7);
    expect(result?.metrics.voteCount).toBe(0);
    expect(result?.score).toBe(1);
  });

  it('ignores votes outside the time window', () => {
    const votes = [
      makeVote('alice', 'bob', 5000, 10),   // 10 days ago — outside 7-day window
    ];
    const result = calculateCurationQualityScore(votes, 7);
    expect(result?.metrics.voteCount).toBe(0);
  });

  it('scores a perfect curator near 100', () => {
    // 100 unique authors, equal weight, no self-votes
    const votes = Array.from({ length: 100 }, (_, i) =>
      makeVote('alice', `author${i}`, 1000, 1)
    );
    const result = calculateCurationQualityScore(votes, 7);
    expect(result?.score).toBeGreaterThanOrEqual(95);
  });

  it('scores a pure self-voter very low', () => {
    const votes = Array.from({ length: 20 }, (_, i) =>
      makeVote('alice', 'alice', 1000, 1)
    );
    const result = calculateCurationQualityScore(votes, 7);
    expect(result?.score).toBeLessThanOrEqual(10);
  });

  it('scores a single-author curator low (breadth and distribution penalised)', () => {
    const votes = Array.from({ length: 10 }, () =>
      makeVote('alice', 'bob', 1000, 1)
    );
    const result = calculateCurationQualityScore(votes, 7);
    expect(result?.score).toBeLessThan(20);
  });

  it('penalises a curator who concentrates weight on few authors despite breadth', () => {
    // 50 authors but 90% of weight goes to one
    const votes: VoteHistoryEntry[] = [
      makeVote('alice', 'whale', 90000, 1),
      ...Array.from({ length: 49 }, (_, i) =>
        makeVote('alice', `author${i}`, 100, 1)
      ),
    ];
    const balanced = Array.from({ length: 50 }, (_, i) =>
      makeVote('alice', `author${i}`, 1000, 1)
    );
    const concentrated = calculateCurationQualityScore(votes, 7);
    const even = calculateCurationQualityScore(balanced, 7);
    expect(even?.score).toBeGreaterThan(concentrated?.score ?? 0);
  });

  it('includes correct sub-score keys in result', () => {
    const result = calculateCurationQualityScore(makeIdealVotes(), 7);
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('rawScore');
    expect(result?.subScores).toHaveProperty('breadth');
    expect(result?.subScores).toHaveProperty('distribution');
    expect(result?.subScores).toHaveProperty('antiSelf');
    expect(result?.metrics).toHaveProperty('giniCoefficient');
    expect(result?.metrics).toHaveProperty('timeWindow');
  });

  it('sub-scores are all between 0 and 1', () => {
    const result = calculateCurationQualityScore(makeIdealVotes(), 7);
    const { breadth, distribution, antiSelf } = result!.subScores;
    expect(breadth).toBeGreaterThanOrEqual(0);
    expect(breadth).toBeLessThanOrEqual(1);
    expect(distribution).toBeGreaterThanOrEqual(0);
    expect(distribution).toBeLessThanOrEqual(1);
    expect(antiSelf).toBeGreaterThanOrEqual(0);
    expect(antiSelf).toBeLessThanOrEqual(1);
  });
});
