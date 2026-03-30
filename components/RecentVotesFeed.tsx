'use client';

import { useMemo, useState, useEffect } from 'react';
import { calculateVotingPowerAtTime, calculateRshares, estimateVoteValue } from '@/lib/votemath';
import { formatNumber } from '@/lib/format';
import type { VoteHistoryEntry, HiveAccount, RewardFund } from '@/types/hive';

interface RecentVotesFeedProps {
  voteHistory: VoteHistoryEntry[];
  account: HiveAccount;
  rewardFund: RewardFund;
  hivePriceUsd: number;
}

const VOTES_PER_PAGE = 10;

export default function RecentVotesFeed({
  voteHistory,
  account,
  rewardFund,
  hivePriceUsd,
}: RecentVotesFeedProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const votesWithValues = useMemo(() => {
    return voteHistory.map((vote) => {
      const timestamp = new Date(vote.timestamp).getTime() / 1000;
      const votingPowerAtTime = calculateVotingPowerAtTime(account, timestamp);
      const rshares = calculateRshares(account, 100, vote.weight);
      const estimatedValue = estimateVoteValue(rshares, rewardFund, hivePriceUsd);

      return {
        ...vote,
        votingPowerAtTime,
        estimatedValue,
      };
    });
  }, [voteHistory, account, rewardFund, hivePriceUsd]);

  useEffect(() => {
    setCurrentPage(1);
  }, [voteHistory.length]);

  const totalPages = Math.ceil(votesWithValues.length / VOTES_PER_PAGE);
  const startIndex = (currentPage - 1) * VOTES_PER_PAGE;
  const endIndex = startIndex + VOTES_PER_PAGE;
  const currentVotes = votesWithValues.slice(startIndex, endIndex);

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

  const formatLocalTime = (timestamp: string) => {
    const date = new Date(timestamp + 'Z');
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border-primary)] animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <span className="w-1 h-6 bg-[var(--mantequilla-gold)] rounded"></span>
        Recent Votes
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-6 uppercase tracking-wider">
        Latest Activity • {votesWithValues.length} Total Votes
      </p>

      <div className="space-y-2 mb-6">
        {currentVotes.map((vote, index) => {
          const postUrl = `https://peakd.com/@${vote.author}/${vote.permlink}`;

          return (
            <a
              key={`${vote.transactionNumber}-${index}`}
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-primary)] hover:border-[var(--mantequilla-gold)] transition-all no-underline"
            >
              <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-bold text-[var(--mantequilla-gold)] hover:text-[var(--mantequilla-yellow)] transition-colors">
                      @{vote.author}
                    </span>
                    <span className="text-[var(--text-muted)] text-xs font-mono">
                      /{vote.permlink.substring(0, 25)}
                      {vote.permlink.length > 25 ? '...' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] flex-wrap">
                    <span className="font-mono text-[10px] sm:text-xs">{formatLocalTime(vote.timestamp)}</span>
                    <span className="px-2 py-1 bg-[var(--bg-card)] rounded border border-[var(--border-primary)] whitespace-nowrap">
                      VP: {vote.votingPowerAtTime.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 min-w-[100px]">
                  <span className={`font-bold text-lg ${getVoteTypeColor(vote.weight)}`}>
                    {getVoteTypeText(vote.weight)}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-card)] px-3 py-1 rounded border border-[var(--border-primary)] data-value whitespace-nowrap">
                    ${formatNumber(vote.estimatedValue, 4)}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border-primary)]">
          <div className="text-xs text-[var(--text-muted)]">
            Page {currentPage} of {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                console.log('Prev button clicked!');
                setCurrentPage(p => Math.max(1, p - 1));
              }}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm font-semibold hover:border-[var(--mantequilla-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      console.log('Page button clicked:', pageNum);
                      setCurrentPage(pageNum);
                    }}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-[var(--mantequilla-gold)] to-[var(--mantequilla-yellow)] text-black'
                        : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--mantequilla-gold)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                console.log('Next button clicked!');
                setCurrentPage(p => Math.min(totalPages, p + 1));
              }}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm font-semibold hover:border-[var(--mantequilla-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}

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
