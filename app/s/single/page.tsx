'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SingleAccountPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (cleanUsername) {
      router.push(`/@${cleanUsername}`);
    }
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-10">
      <div className="max-w-7xl mx-auto overflow-x-hidden space-y-6">
        {/* Back Button */}
        <Link
          href="/"
          className="text-[var(--text-muted)] hover:text-[var(--mantequilla-gold)] transition-colors flex items-center gap-2 inline-block"
        >
          ← Back to menu
        </Link>

        {/* Single Account Lookup */}
        <div className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border-primary)]">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-[var(--mantequilla-gold)] rounded"></span>
            View Account Dashboard
          </h2>
          <p className="text-[var(--text-muted)] mb-4">
            Enter a Hive username to view their complete curation analytics
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-6">
            <strong>Tip:</strong> Enter username without @ (system will automatically remove it if included)
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="aliento"
              className="flex-1 bg-[var(--bg-secondary)] text-white px-4 py-3 rounded-lg border border-[var(--border-primary)] focus:outline-none focus:border-[var(--mantequilla-gold)] focus:ring-2 focus:ring-[var(--mantequilla-gold)]/20 transition-all"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!username.trim()}
              className="px-6 py-3 bg-gradient-to-r from-[var(--mantequilla-gold)] to-yellow-600 text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View Dashboard
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
