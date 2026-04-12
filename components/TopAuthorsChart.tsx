'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { VoteHistoryEntry } from '@/types/hive';

interface TopAuthorsChartProps {
  voteHistory: VoteHistoryEntry[];
}

export default function TopAuthorsChart({ voteHistory }: TopAuthorsChartProps) {
  const topAuthors = useMemo(() => {
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
    return Object.entries(authorVotes)
      .map(([author, voteCount]) => ({ author, voteCount }))
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 10); // Top 10 authors
  }, [voteHistory]);

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border-primary)] card-glow animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <span className="w-1 h-6 bg-[var(--mantequilla-gold)] rounded"></span>
        Top Authors
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-6 uppercase tracking-wider">
        Most Voted Creators
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={topAuthors} layout="horizontal" margin={{ bottom: 60 }}>
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

      {topAuthors.length === 0 && (
        <div className="text-center text-[var(--text-muted)] py-8">
          <div className="text-4xl mb-2 opacity-30">📊</div>
          <div className="text-sm">No vote history available</div>
        </div>
      )}
    </div>
  );
}
