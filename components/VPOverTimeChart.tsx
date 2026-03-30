'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateVotingPowerAtTime } from '@/lib/votemath';
import type { HiveAccount, VoteHistoryEntry } from '@/types/hive';

interface VPOverTimeChartProps {
  account: HiveAccount;
  voteHistory: VoteHistoryEntry[];
}

export default function VPOverTimeChart({ account, voteHistory }: VPOverTimeChartProps) {
  const vpData = useMemo(() => {
    if (voteHistory.length === 0) return [];

    // Get VP at each vote timestamp
    const dataPoints = voteHistory.map((vote) => {
      const timestamp = new Date(vote.timestamp).getTime() / 1000;
      const votingPower = calculateVotingPowerAtTime(account, timestamp);

      return {
        timestamp: new Date(vote.timestamp).getTime(),
        votingPower,
        formattedTime: new Date(vote.timestamp).toLocaleTimeString(),
      };
    });

    // Reverse to show chronologically (oldest to newest)
    return dataPoints.reverse();
  }, [account, voteHistory]);

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border-primary)] card-glow animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <span className="w-1 h-6 bg-[var(--hive-cyan)] rounded"></span>
        VP Timeline
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-6 uppercase tracking-wider">
        Voting Power History
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={vpData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="formattedTime"
            stroke="var(--text-muted)"
            tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fill: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}
            domain={[0, 100]}
            label={{ value: 'VP %', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontFamily: 'JetBrains Mono',
            }}
            labelStyle={{ color: 'var(--hive-cyan)', fontWeight: 'bold' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'VP']}
          />
          <Line
            type="monotone"
            dataKey="votingPower"
            stroke="var(--hive-cyan)"
            strokeWidth={3}
            dot={{ fill: 'var(--hive-cyan)', r: 4 }}
            activeDot={{ r: 6, fill: 'var(--hive-cyan)' }}
          />
        </LineChart>
      </ResponsiveContainer>

      {vpData.length === 0 && (
        <div className="text-center text-[var(--text-muted)] py-8">
          <div className="text-4xl mb-2 opacity-30">📈</div>
          <div className="text-sm">No vote history available</div>
        </div>
      )}
    </div>
  );
}
