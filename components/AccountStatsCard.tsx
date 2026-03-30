'use client';

import type { AccountStats } from '@/types/hive';
import { formatNumber } from '@/lib/format';

interface AccountStatsCardProps {
  stats: AccountStats;
  accountName: string;
}

export default function AccountStatsCard({ stats, accountName }: AccountStatsCardProps) {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border-primary)] card-glow animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-[var(--mantequilla-gold)] rounded"></span>
        <span className="text-[var(--text-secondary)]">@</span>{accountName}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Own Hive Power */}
        <div className="bg-[var(--bg-secondary)] rounded-lg p-5 border border-[var(--border-primary)] hover:border-[var(--mantequilla-gold)] transition-all group">
          <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--mantequilla-gold)] group-hover:animate-pulse"></span>
            Own Hive Power
          </div>
          <div className="text-2xl font-bold butter-gradient data-value">
            {formatNumber(stats.ownHivePower)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">HP</div>
        </div>

        {/* Total Hive Power */}
        <div className="bg-[var(--bg-secondary)] rounded-lg p-5 border border-[var(--border-primary)] hover:border-[var(--mantequilla-yellow)] transition-all group">
          <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--mantequilla-yellow)] group-hover:animate-pulse"></span>
            Total Hive Power
          </div>
          <div className="text-2xl font-bold text-[var(--mantequilla-yellow)] data-value">
            {formatNumber(stats.hivePower)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">HP (with delegations)</div>
        </div>

        {/* Incoming Delegations */}
        <div className="bg-[var(--bg-secondary)] rounded-lg p-5 border border-[var(--border-primary)] hover:border-green-500 transition-all group">
          <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 group-hover:animate-pulse"></span>
            Incoming
          </div>
          <div className="text-2xl font-bold text-green-400 data-value">
            {stats.incomingDelegations > 0 ? '+' : ''}{formatNumber(stats.incomingDelegations)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">HP delegated to you</div>
        </div>

        {/* Outgoing Delegations */}
        <div className="bg-[var(--bg-secondary)] rounded-lg p-5 border border-[var(--border-primary)] hover:border-red-500 transition-all group">
          <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 group-hover:animate-pulse"></span>
            Outgoing
          </div>
          <div className="text-2xl font-bold text-red-400 data-value">
            {stats.outgoingDelegations > 0 ? '-' : ''}{formatNumber(stats.outgoingDelegations)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">HP you delegated</div>
        </div>
      </div>
    </div>
  );
}
