/**
 * Curation Quality Score (CQS) Calculation Module
 *
 * Implements the Curation-Quality Score proposal for Hive blockchain.
 * Measures curation quality across three dimensions:
 * - Breadth (B): Diversity of authors (up to 50)
 * - Distribution (D): How evenly weight is spread (Gini-based)
 * - Anti-Self (S): Avoiding self-vote bias
 *
 * Formula: CQS = ceil(RawScore × 9) + 1, where RawScore = (B × D × S)^(1/3)
 * Range: 1-10 (higher is better)
 */

import type { VoteHistoryEntry, CurationMetrics, CurationSubScores, CurationQualityScore } from '@/types/hive';

/**
 * Filter votes to last N days
 */
export function filterVotesToWindow(
  votes: VoteHistoryEntry[],
  windowDays: number = 7
): VoteHistoryEntry[] {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  return votes.filter(vote => {
    const voteDate = new Date(vote.timestamp);
    return voteDate >= windowStart;
  });
}

/**
 * Calculate total vote weight (absolute values)
 * Weight ranges from -10000 to +10000, we use absolute values
 */
export function calculateTotalVoteWeight(votes: VoteHistoryEntry[]): number {
  return votes.reduce((sum, vote) => sum + Math.abs(vote.weight), 0);
}

/**
 * Count unique authors voted for
 */
export function countUniqueAuthors(votes: VoteHistoryEntry[]): number {
  const uniqueAuthors = new Set(votes.map(vote => vote.author));
  return uniqueAuthors.size;
}

/**
 * Calculate weight sent to self-votes
 */
export function calculateSelfVoteWeight(votes: VoteHistoryEntry[]): number {
  return votes
    .filter(vote => vote.voter === vote.author)
    .reduce((sum, vote) => sum + Math.abs(vote.weight), 0);
}

/**
 * Group votes by author and calculate total weight per author
 */
export function groupVotesByAuthor(votes: VoteHistoryEntry[]): Map<string, { count: number; weight: number }> {
  const authorMap = new Map<string, { count: number; weight: number }>();

  votes.forEach(vote => {
    const existing = authorMap.get(vote.author);
    const weight = Math.abs(vote.weight);

    if (existing) {
      existing.count += 1;
      existing.weight += weight;
    } else {
      authorMap.set(vote.author, { count: 1, weight });
    }
  });

  return authorMap;
}

/**
 * Get top N authors by vote weight
 */
export function getTopAuthors(
  authorMap: Map<string, { count: number; weight: number }>,
  topN: number = 50
): Array<{ author: string; voteCount: number; totalWeight: number }> {
  const authors = Array.from(authorMap.entries()).map(([author, data]) => ({
    author,
    voteCount: data.count,
    totalWeight: data.weight,
  }));

  // Sort by total weight descending
  authors.sort((a, b) => b.totalWeight - a.totalWeight);

  return authors.slice(0, topN);
}

/**
 * Calculate weight directed to top N authors
 */
export function calculateTopNWeight(
  authorMap: Map<string, { count: number; weight: number }>,
  topN: number = 50
): number {
  const topAuthors = getTopAuthors(authorMap, topN);
  return topAuthors.reduce((sum, author) => sum + author.totalWeight, 0);
}

/**
 * Calculate Breadth Score (B)
 * B = min(U / 50, 1.0)
 * Rewards voting for up to 50 unique authors
 */
export function calculateBreadthScore(uniqueAuthors: number): number {
  return Math.min(uniqueAuthors / 50, 1.0);
}

/**
 * Calculate Gini Coefficient for weight distribution inequality
 * Gini = 0: Perfect equality (all authors get equal weight)
 * Gini = 1: Perfect inequality (one author gets all weight)
 *
 * Uses the standard Gini formula:
 * Gini = (2 * Σ(i * weight_i)) / (n * Σ(weight_i)) - (n + 1) / n
 * where weights are sorted in ascending order
 */
export function calculateGiniCoefficient(authorWeights: number[]): number {
  if (authorWeights.length === 0) return 0;
  if (authorWeights.length === 1) return 0; // Single author = perfect equality

  // Sort weights in ascending order
  const sortedWeights = [...authorWeights].sort((a, b) => a - b);
  const n = sortedWeights.length;
  const totalWeight = sortedWeights.reduce((sum, w) => sum + w, 0);

  if (totalWeight === 0) return 0;

  // Calculate Gini using standard formula
  let numerator = 0;
  sortedWeights.forEach((weight, index) => {
    numerator += (index + 1) * weight;
  });

  const gini = (2 * numerator) / (n * totalWeight) - (n + 1) / n;

  return Math.max(0, Math.min(1, gini)); // Clamp to [0, 1]
}

/**
 * Calculate Distribution Score (D)
 * D = 1 - Gini
 * Measures how evenly vote weight is distributed across authors
 * Higher score = more equal distribution
 *
 * Special case: Voting only 1 author = worst distribution (0.01)
 */
export function calculateDistributionScore(authorWeights: number[]): number {
  // Special case: voting only 1 author is terrible distribution for curation
  if (authorWeights.length === 1) {
    return 0.01; // Worst possible distribution
  }

  const gini = calculateGiniCoefficient(authorWeights);
  return 1 - gini;
}

/**
 * Calculate Anti-Self Score (S)
 * S = 1 - (Ws / Wtot)
 * Penalizes self-voting
 */
export function calculateAntiSelfScore(totalWeight: number, selfWeight: number): number {
  if (totalWeight === 0) return 1.0; // No votes = no self-voting
  return Math.max(0, 1 - (selfWeight / totalWeight));
}

/**
 * Calculate final CQS from sub-scores using Geometric Mean
 * RawScore = (B × D × S)^(1/3)
 * CQS = ceil(RawScore × 9) + 1
 * Range: 1-10
 *
 * Geometric mean naturally penalizes imbalance - you cannot have one terrible
 * dimension and still score high by compensating with other dimensions.
 */
export function calculateFinalCQS(breadth: number, distribution: number, antiSelf: number): { score: number; rawScore: number } {
  // Use very small minimum to allow terrible curators to score 1/10
  // but prevent complete zeros from breaking the calculation
  const MIN_VALUE = 0.001;
  const b = Math.max(breadth, MIN_VALUE);
  const d = Math.max(distribution, MIN_VALUE);
  const s = Math.max(antiSelf, MIN_VALUE);

  // Geometric mean: cube root of the product
  const rawScore = Math.pow(b * d * s, 1/3);

  // For very low scores (rawScore < 0.02), use floor instead of ceil
  // This allows truly terrible curators to score 1/10
  let score;
  if (rawScore < 0.02) {
    score = Math.max(1, Math.floor(rawScore * 9) + 1);
  } else {
    score = Math.ceil(rawScore * 9) + 1;
  }

  return { score, rawScore };
}

/**
 * Main function: Calculate complete Curation Quality Score
 */
export function calculateCurationQualityScore(
  votes: VoteHistoryEntry[],
  windowDays: number = 7
): CurationQualityScore | null {
  // Filter to time window
  const windowedVotes = filterVotesToWindow(votes, windowDays);

  // Filter out downvotes and unvotes - only count upvotes for curation quality
  // Downvotes (weight < 0) are for spam/abuse prevention, not curation
  const upvotesOnly = windowedVotes.filter(vote => vote.weight > 0);

  // Handle edge case: no upvotes in window
  if (upvotesOnly.length === 0) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

    return {
      score: 1,
      rawScore: 0,
      subScores: {
        breadth: 0,
        distribution: 1.0, // No votes = perfect distribution (no inequality)
        antiSelf: 1.0,
      },
      metrics: {
        totalVoteWeight: 0,
        uniqueAuthors: 0,
        top50Weight: 0,
        selfVoteWeight: 0,
        voteCount: 0,
        giniCoefficient: 0,
        timeWindow: {
          startDate: windowStart.toISOString(),
          endDate: now.toISOString(),
          daysIncluded: windowDays,
        },
      },
      topAuthors: [],
    };
  }

  // Calculate metrics (using upvotes only)
  const totalVoteWeight = calculateTotalVoteWeight(upvotesOnly);
  const uniqueAuthors = countUniqueAuthors(upvotesOnly);
  const selfVoteWeight = calculateSelfVoteWeight(upvotesOnly);
  const authorMap = groupVotesByAuthor(upvotesOnly);
  const top50Weight = calculateTopNWeight(authorMap, 50);
  const topAuthors = getTopAuthors(authorMap, 50);

  // Extract author weights for Gini calculation
  const authorWeights = Array.from(authorMap.values()).map(data => data.weight);

  // Calculate Gini coefficient
  const giniCoefficient = calculateGiniCoefficient(authorWeights);

  // Calculate sub-scores
  const breadth = calculateBreadthScore(uniqueAuthors);
  const distribution = calculateDistributionScore(authorWeights);
  const antiSelf = calculateAntiSelfScore(totalVoteWeight, selfVoteWeight);

  // Calculate final CQS
  const { score, rawScore } = calculateFinalCQS(breadth, distribution, antiSelf);

  // Get time window info
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const oldestVote = upvotesOnly.length > 0
    ? new Date(upvotesOnly[upvotesOnly.length - 1].timestamp)
    : windowStart;

  return {
    score,
    rawScore,
    subScores: {
      breadth,
      distribution,
      antiSelf,
    },
    metrics: {
      totalVoteWeight,
      uniqueAuthors,
      top50Weight,
      selfVoteWeight,
      voteCount: upvotesOnly.length,
      giniCoefficient,
      timeWindow: {
        startDate: oldestVote.toISOString(),
        endDate: now.toISOString(),
        daysIncluded: windowDays,
      },
    },
    topAuthors,
  };
}

/**
 * Get color for CQS score (for UI)
 */
export function getCQSColor(score: number): string {
  if (score >= 9) return 'from-green-500 to-emerald-600';
  if (score >= 7) return 'from-blue-500 to-cyan-600';
  if (score >= 5) return 'from-yellow-500 to-orange-500';
  if (score >= 3) return 'from-orange-500 to-red-500';
  return 'from-red-500 to-red-700';
}

/**
 * Get interpretation text for CQS score
 */
export function getCQSInterpretation(score: number): string {
  if (score >= 9) return 'Exceptional curator - Diverse, balanced, community-focused';
  if (score >= 7) return 'Strong curator - Good diversity and distribution';
  if (score >= 5) return 'Average curator - Room for improvement in breadth or distribution';
  if (score >= 3) return 'Narrow curator - Limited diversity or concentrated voting';
  return 'Very narrow curation - Consider diversifying and spreading votes more evenly';
}
