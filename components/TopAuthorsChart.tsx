'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { VoteHistoryEntry } from '@/types/hive';

interface TopAuthorsChartProps {
  voteHistory: VoteHistoryEntry[];
}

export default function TopAuthorsChart({ voteHistory }: TopAuthorsChartProps) {
  const { top10Authors, top50Authors } = useMemo(() => {
    // Filter to upvotes only (downvotes are for spam/abuse, not curation)
    const upvotesOnly = voteHistory.filter(vote => vote.weight > 0);

    // Count votes per author
    const authorVotes = upvotesOnly.reduce((acc, vote) => {
      if (!acc[vote.author]) {
        acc[vote.author] = 0;
      }
      acc[vote.author]++;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array and sort by vote count
    const sortedAuthors = Object.entries(authorVotes)
      .map(([author, voteCount]) => ({ author, voteCount }))
      .sort((a, b) => b.voteCount - a.voteCount);

    return {
      top10Authors: sortedAuthors.slice(0, 10),
      top50Authors: sortedAuthors.slice(0, 50),
    };
  }, [voteHistory]);

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border-primary)] card-glow animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <span className="w-1 h-6 bg-[var(--mantequilla-gold)] rounded"></span>
        Top Authors
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-6 uppercase tracking-wider">
        Most Voted Creators (Top 50)
      </p>

      {top50Authors.length === 0 ? (
        <div className="text-center text-[var(--text-muted)] py-8">
          <div className="text-4xl mb-2 opacity-30">📊</div>
          <div className="text-sm">No vote history available</div>
        </div>
      ) : (
        <>
          {/* Top 10 Bar Chart */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-4 uppercase tracking-wider">
              Top 10 Chart
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top10Authors} layout="horizontal" margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="author"
                  stroke="var(--text-muted)"
                  tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'var(--mantequilla-gold)', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="voteCount" fill="var(--mantequilla-gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 50 Table */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-4 uppercase tracking-wider">
              Full List (Top 50)
            </h3>
            <div className="relative max-h-96 overflow-y-scroll border border-[var(--border-primary)] rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-secondary)] sticky top-0 z-[1]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold border-b border-[var(--border-primary)]">
                      Rank
                    </th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold border-b border-[var(--border-primary)]">
                      Author
                    </th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold border-b border-[var(--border-primary)]">
                      Votes
                    </th>
                  </tr>
                </thead>
                <tbody className="relative z-0">
                  {top50Authors.map((author, index) => (
                    <tr
                      key={author.author}
                      className="border-t border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <td className="px-4 py-3 text-[var(--text-muted)] font-mono">
                        #{index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://peakd.com/@${author.author}/posts`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--mantequilla-gold)] hover:underline font-medium transition-colors hover:text-[var(--mantequilla-gold-light)] relative z-10"
                        >
                          @{author.author}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                        {author.voteCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
