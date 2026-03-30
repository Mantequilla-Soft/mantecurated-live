'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/format';

interface VotingPowerGaugeProps {
  votingPower: number;
  currentVoteValue: number;
  maxVoteValue: number;
}

export default function VotingPowerGauge({
  votingPower,
  currentVoteValue,
  maxVoteValue,
}: VotingPowerGaugeProps) {
  const data = [
    { name: 'Used', value: 100 - votingPower },
    { name: 'Available', value: votingPower },
  ];

  const COLORS = {
    available: '#FFA500',
    used: '#1a1a1a',
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border-primary)] card-glow animate-fade-in-up">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-[var(--mantequilla-gold)] rounded"></span>
        Voting Power
      </h2>

      <div className="flex items-center justify-center mb-8">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                startAngle={90}
                endAngle={-270}
                innerRadius={75}
                outerRadius={105}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill={COLORS.used} />
                <Cell fill={COLORS.available} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-5xl sm:text-6xl font-bold glow-red data-value" style={{ fontFamily: 'Syne, sans-serif' }}>
              {votingPower.toFixed(1)}
            </div>
            <div className="text-lg sm:text-xl font-semibold text-[var(--mantequilla-gold)] -mt-1">%</div>
            <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mt-2">Voting Power</div>
          </div>

          {/* Decorative ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[170px] h-[170px] sm:w-[190px] sm:h-[190px] rounded-full border border-[var(--border-primary)] opacity-30"></div>
          </div>
        </div>
      </div>

      {/* Vote Value */}
      <div className="bg-[var(--bg-secondary)] rounded-lg p-5 border border-[var(--border-primary)] hover:border-[var(--mantequilla-gold)] transition-colors">
        <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Full Weight Vote Value</div>
        <div className="text-3xl font-bold butter-gradient data-value mb-1">
          ${formatNumber(maxVoteValue, 3)}
        </div>
        <div className="text-xs text-[var(--text-muted)] leading-relaxed">
          Constant value per 100% vote • VP affects vote quantity, not value
        </div>
      </div>

      {/* Regeneration info */}
      <div className="mt-6 text-xs text-[var(--text-muted)] text-center border-t border-[var(--border-primary)] pt-4">
        <span className="opacity-60">↻</span> VP Regenerates 20% per day • Full recovery in 5 days
      </div>
    </div>
  );
}
