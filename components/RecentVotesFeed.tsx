'use client';

import { useMemo } from 'react';
import { calculateVotingPowerAtTime, calculateRshares, estimateVoteValue } from '@/lib/votemath';
import type { VoteHistoryEntry, HiveAccount, RewardFund } from '@/types/hive';

interface RecentVotesFeedProps {
  voteHistory: VoteHistoryEntry[];
  account: HiveAccount;
  rewardFund: RewardFund;
  hivePriceUsd: number;
}

export default function RecentVotesFeed({
  voteHistory,
  account,
  rewardFund,
  hivePriceUsd,
}: RecentVotesFeedProps) {
  const votesWithValues = useMemo(() => {
    return voteHistory.slice(0, 20).map((vote) => {
      const timestamp = new Date(vote.timestamp).getTime() / 1000;
      const votingPowerAtTime = calculateVotingPowerAtTime(account, timestamp);
      // Vote value is constant - only affected by vote weight (slider %), not VP
      const rshares = calculateRshares(account, 100, vote.weight);
      const estimatedValue = estimateVoteValue(rshares, rewardFund, hivePriceUsd);

      return {
        ...vote,
        votingPowerAtTime,
        estimatedValue,
      };
    });
  }, [voteHistory, account, rewardFund, hivePriceUsd]);

  const getVoteTypeColor = (weight: number) => {
    if (weight > 0) return 'text-green-400';
    if (weight < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getVoteTypeText = (weight: number) => {
    if (weight > 0) return `+${(weight / 100).toFixed(0)}%`;
    if (weight < 0) return `${(weight / 100).toFixed(0)}%`;
    return 'Unvote';
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border-primary)] card-glow animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <span className="w-1 h-6 bg-[var(--hive-red)] rounded"></span>
        Recent Votes
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-6 uppercase tracking-wider">
        Latest Activity • Live Feed
      </p>

      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
        {votesWithValues.map((vote, index) => (
          <div
            key={`${vote.transactionNumber}-${index}`}
            className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-primary)] hover:border-[var(--hive-red)] transition-all group"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-[var(--hive-red)] data-value">
                    @{vote.author}
                  </span>
                  <span className="text-[var(--text-muted)] text-xs truncate font-mono">
                    /{vote.permlink.substring(0, 25)}
                    {vote.permlink.length > 25 ? '...' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="font-mono">{new Date(vote.timestamp).toLocaleString()}</span>
                  <span className="px-2 py-1 bg-[var(--bg-card)] rounded border border-[var(--border-primary)]">
                    VP: {vote.votingPowerAtTime.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 min-w-[100px]">
                <span className={`font-bold text-lg ${getVoteTypeColor(vote.weight)}`}>
                  {getVoteTypeText(vote.weight)}
                </span>
                <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-card)] px-3 py-1 rounded border border-[var(--border-primary)] data-value">
                  ${vote.estimatedValue.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {votesWithValues.length === 0 && (
        <div className="text-center text-[var(--text-muted)] py-16">
          <div className="text-5xl mb-3 opacity-30">🗳️</div>
          <div className="text-sm">No recent votes found</div>
          <div className="text-xs mt-2 opacity-50">Vote activity will appear here</div>
        </div>
      )}
    </div>
  );
}
