'use client';

import Link from 'next/link';
import CuratorComparison from '@/components/CuratorComparison';

export default function ComparePage() {
  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-10">
      <div className="max-w-7xl mx-auto overflow-x-hidden space-y-6">
        {/* Back Button */}
        <Link
          href="/"
          className="text-[var(--text-muted)] hover:text-[var(--mantequilla-gold)] transition-colors flex items-center gap-2"
        >
          ← Back to menu
        </Link>

        {/* Curator Comparison */}
        <CuratorComparison />
      </div>
    </main>
  );
}
