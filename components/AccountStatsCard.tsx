'use client';

import type { AccountStats } from '@/types/hive';

interface AccountStatsCardProps {
  stats: AccountStats;
  accountName: string;
}

export default function AccountStatsCard({ stats, accountName }: AccountStatsCardProps) {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border-primary)] card-glow animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-[var(--hive-red)] rounded"></span>
        <span className="text-[var(--text-secondary)]">@</span>{accountName}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Hive Power */}
        <div className="bg-[var(--bg-secondary)] rounded-lg p-5 border border-[var(--border-primary)] hover:border-[var(--hive-red)] transition-all group">
          <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--hive-red)] group-hover:animate-pulse"></span>
            Hive Power
          </div>
          <div className="text-2xl font-bold text-[var(--hive-red)] data-value">
            {stats.hivePower.toFixed(2)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">HP</div>
        </div>

        {/* Resource Credits */}
        <div className="bg-[var(--bg-secondary)] rounded-lg p-5 border border-[var(--border-primary)] hover:border-[var(--hive-cyan)] transition-all group">
          <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--hive-cyan)] group-hover:animate-pulse"></span>
            Resource Credits
          </div>
          <div className="text-2xl font-bold text-[var(--hive-cyan)] data-value">
            {stats.resourceCredits.toFixed(1)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">%</div>
        </div>

        {/* Reputation */}
        <div className="bg-[var(--bg-secondary)] rounded-lg p-5 border border-[var(--border-primary)] hover:border-purple-500 transition-all group">
          <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 group-hover:animate-pulse"></span>
            Reputation
          </div>
          <div className="text-2xl font-bold text-purple-400 data-value">
            {stats.reputation.toFixed(2)}
          </div>
        </div>

        {/* HIVE Balance */}
        <div className="bg-[var(--bg-secondary)] rounded-lg p-5 border border-[var(--border-primary)] hover:border-green-500 transition-all group">
          <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 group-hover:animate-pulse"></span>
            HIVE Balance
          </div>
          <div className="text-2xl font-bold text-green-400 data-value">
            {stats.hiveBalance.toFixed(3)}
          </div>
        </div>

        {/* HBD Balance */}
        <div className="bg-[var(--bg-secondary)] rounded-lg p-5 border border-[var(--border-primary)] hover:border-yellow-500 transition-all col-span-2 group">
          <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 group-hover:animate-pulse"></span>
            HBD Balance (Stablecoin)
          </div>
          <div className="text-3xl font-bold text-yellow-400 data-value">
            ${stats.hbdBalance.toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
}
