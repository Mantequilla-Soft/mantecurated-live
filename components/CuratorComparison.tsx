'use client';

import { useState } from 'react';
import { getAccount, getGlobalProperties, getRewardFund, getCurrentMedianHistoryPrice, getVoteHistory, getHivePrice } from '@/lib/hive';
import { calculateVotingPower, calculateFullVoteValue, getEffectiveHivePower, toNumber } from '@/lib/votemath';
import { calculateCurationQualityScore } from '@/lib/curation-score';
import type { CurationQualityScore } from '@/types/hive';

interface CuratorData {
  username: string;
  loading: boolean;
  error: string | null;
  cqs: CurationQualityScore | null;
  hivePower: number;
  votingPower: number;
}

type SortField = 'username' | 'score' | 'breadth' | 'distribution' | 'antiSelf' | 'uniqueAuthors' | 'totalVotes';
type SortDirection = 'asc' | 'desc';

export default function CuratorComparison() {
  const [curators, setCurators] = useState<CuratorData[]>([]);
  const [inputUsername, setInputUsername] = useState('');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const addCurator = async (username: string) => {
    // Clean username - remove @ symbol
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    if (!cleanUsername) return;

    // Check if already exists
    if (curators.some(c => c.username === cleanUsername)) {
      alert('This curator is already in the list!');
      return;
    }

    // Add placeholder
    const newCurator: CuratorData = {
      username: cleanUsername,
      loading: true,
      error: null,
      cqs: null,
      hivePower: 0,
      votingPower: 0,
    };

    setCurators(prev => [...prev, newCurator]);

    // Fetch data
    try {
      const [accountData, globalData, rewardData, priceData, hivePrice] = await Promise.all([
        getAccount(cleanUsername),
        getGlobalProperties(),
        getRewardFund(),
        getCurrentMedianHistoryPrice(),
        getHivePrice(),
      ]);

      if (!accountData) {
        throw new Error('Account not found');
      }

      // Get vote history (raw format)
      const votes = await getVoteHistory(cleanUsername, 7);

      // Process vote history into VoteHistoryEntry format
      const voteHistory = votes.map((entry: any) => {
        const [transactionNumber, transaction] = entry;
        const voteOp = transaction.op[1];

        return {
          transactionNumber,
          timestamp: transaction.timestamp,
          voter: voteOp.voter,
          author: voteOp.author,
          permlink: voteOp.permlink,
          weight: voteOp.weight,
        };
      });

      // Calculate CQS
      const cqsData = calculateCurationQualityScore(voteHistory, 7);

      // Calculate HP and VP
      const hivePower = getEffectiveHivePower(accountData, globalData);
      const votingPower = calculateVotingPower(accountData);

      // Update curator data
      setCurators(prev =>
        prev.map(c =>
          c.username === cleanUsername
            ? { ...c, loading: false, cqs: cqsData, hivePower, votingPower }
            : c
        )
      );
    } catch (err) {
      setCurators(prev =>
        prev.map(c =>
          c.username === cleanUsername
            ? { ...c, loading: false, error: err instanceof Error ? err.message : 'Failed to load' }
            : c
        )
      );
    }
  };

  const addMultipleCurators = () => {
    if (!inputUsername.trim()) return;

    // Split by commas and/or spaces
    const usernames = inputUsername
      .split(/[,\s]+/)
      .map(u => u.trim().toLowerCase().replace(/^@/, ''))
      .filter(u => u.length > 0);

    // Clear input
    setInputUsername('');

    // Add each username
    usernames.forEach(username => {
      addCurator(username);
    });
  };

  const removeCurator = (username: string) => {
    setCurators(prev => prev.filter(c => c.username !== username));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedCurators = () => {
    return [...curators].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'username':
          aVal = a.username;
          bVal = b.username;
          break;
        case 'score':
          aVal = a.cqs?.score ?? 0;
          bVal = b.cqs?.score ?? 0;
          break;
        case 'breadth':
          aVal = a.cqs?.subScores.breadth ?? 0;
          bVal = b.cqs?.subScores.breadth ?? 0;
          break;
        case 'distribution':
          aVal = a.cqs?.subScores.distribution ?? 0;
          bVal = b.cqs?.subScores.distribution ?? 0;
          break;
        case 'antiSelf':
          aVal = a.cqs?.subScores.antiSelf ?? 0;
          bVal = b.cqs?.subScores.antiSelf ?? 0;
          break;
        case 'uniqueAuthors':
          aVal = a.cqs?.metrics.uniqueAuthors ?? 0;
          bVal = b.cqs?.metrics.uniqueAuthors ?? 0;
          break;
        case 'totalVotes':
          aVal = a.cqs?.metrics.voteCount ?? 0;
          bVal = b.cqs?.metrics.voteCount ?? 0;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const exportAsMarkdown = () => {
    const sorted = getSortedCurators();
    const date = new Date().toISOString().split('T')[0];

    let markdown = `# Curator Quality Comparison - ${date}\n\n`;
    markdown += `Generated with [ManteCurated Live](https://mantecurated.3speak.tv) by Mantequilla Soft\n\n`;
    markdown += `| Rank | Curator | Score | Breadth | Distribution | Anti-Self | Unique Authors | Total Votes |\n`;
    markdown += `|------|---------|-------|---------|--------------|-----------|----------------|-------------|\n`;

    sorted.forEach((curator, index) => {
      if (!curator.cqs) return;
      markdown += `| ${index + 1} | @${curator.username} | ${curator.cqs.score}/100 | ${curator.cqs.subScores.breadth.toFixed(2)} | ${curator.cqs.subScores.distribution.toFixed(2)} | ${curator.cqs.subScores.antiSelf.toFixed(2)} | ${curator.cqs.metrics.uniqueAuthors} | ${curator.cqs.metrics.voteCount} |\n`;
    });

    navigator.clipboard.writeText(markdown);
    alert('Markdown copied to clipboard!');
  };

  const exportAsJSON = () => {
    const sorted = getSortedCurators();
    const data = sorted.map((curator, index) => ({
      rank: index + 1,
      username: curator.username,
      score: curator.cqs?.score ?? null,
      subScores: curator.cqs?.subScores ?? null,
      metrics: curator.cqs?.metrics ?? null,
      hivePower: curator.hivePower,
      votingPower: curator.votingPower,
    }));

    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert('JSON copied to clipboard!');
  };

  const exportAsCSV = () => {
    const sorted = getSortedCurators();

    let csv = 'Rank,Username,Score,Breadth,Distribution,Anti-Self,Unique Authors,Total Votes,Hive Power,Voting Power\n';

    sorted.forEach((curator, index) => {
      if (!curator.cqs) return;
      csv += `${index + 1},@${curator.username},${curator.cqs.score},${curator.cqs.subScores.breadth.toFixed(2)},${curator.cqs.subScores.distribution.toFixed(2)},${curator.cqs.subScores.antiSelf.toFixed(2)},${curator.cqs.metrics.uniqueAuthors},${curator.cqs.metrics.voteCount},${curator.hivePower.toFixed(2)},${curator.votingPower.toFixed(2)}\n`;
    });

    navigator.clipboard.writeText(csv);
    alert('CSV copied to clipboard!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-500/20 text-green-500 border-green-500/30';
    if (score >= 70) return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    if (score >= 50) return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    if (score >= 30) return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
    return 'bg-red-500/20 text-red-500 border-red-500/30';
  };

  const sortedCurators = getSortedCurators();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border-primary)]">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <span className="w-1.5 h-10 bg-[var(--mantequilla-gold)] rounded"></span>
          Curator Comparison
        </h1>
        <p className="text-[var(--text-muted)] mb-4">
          Compare curation quality across multiple Hive accounts
        </p>
        <p className="text-xs text-[var(--text-muted)] mb-6">
          💡 <strong>Tip:</strong> Enter usernames without @ symbol. Separate multiple accounts with commas or spaces (e.g., "aliento, appreciator blocktrades")
        </p>

        {/* Add Curator Input */}
        <form onSubmit={(e) => { e.preventDefault(); addMultipleCurators(); }} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            placeholder="aliento, appreciator, blocktrades"
            className="flex-1 bg-[var(--bg-secondary)] text-white px-4 py-3 rounded-lg border border-[var(--border-primary)] focus:outline-none focus:border-[var(--mantequilla-gold)] focus:ring-2 focus:ring-[var(--mantequilla-gold)]/20 transition-all"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!inputUsername.trim()}
            className="px-6 py-3 bg-gradient-to-r from-[var(--mantequilla-gold)] to-yellow-600 text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Curator(s)
          </button>
        </form>

        {curators.length > 0 && (
          <div className="mt-4 text-sm text-[var(--text-muted)]">
            {curators.length} curator{curators.length !== 1 ? 's' : ''} added
          </div>
        )}
      </div>

      {/* Export Buttons */}
      {curators.length > 0 && (
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)]">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-[var(--mantequilla-gold)] rounded"></span>
            Export Results
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportAsMarkdown}
              className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-white rounded-lg hover:border-[var(--mantequilla-gold)] transition-colors font-medium"
            >
              📋 Copy as Markdown
            </button>
            <button
              type="button"
              onClick={exportAsJSON}
              className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-white rounded-lg hover:border-[var(--mantequilla-gold)] transition-colors font-medium"
            >
              📊 Copy as JSON
            </button>
            <button
              type="button"
              onClick={exportAsCSV}
              className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-white rounded-lg hover:border-[var(--mantequilla-gold)] transition-colors font-medium"
            >
              📈 Copy as CSV
            </button>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {sortedCurators.length > 0 && (
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-secondary)] sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                  Rank
                </th>
                <th
                  className="text-left px-4 py-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold cursor-pointer hover:text-[var(--mantequilla-gold)]"
                  onClick={() => handleSort('username')}
                >
                  Curator {sortField === 'username' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-center px-4 py-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold cursor-pointer hover:text-[var(--mantequilla-gold)]"
                  onClick={() => handleSort('score')}
                >
                  CQS Score {sortField === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-center px-4 py-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold cursor-pointer hover:text-[var(--mantequilla-gold)]"
                  onClick={() => handleSort('breadth')}
                >
                  Breadth {sortField === 'breadth' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-center px-4 py-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold cursor-pointer hover:text-[var(--mantequilla-gold)]"
                  onClick={() => handleSort('distribution')}
                >
                  Distribution {sortField === 'distribution' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-center px-4 py-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold cursor-pointer hover:text-[var(--mantequilla-gold)]"
                  onClick={() => handleSort('antiSelf')}
                >
                  Anti-Self {sortField === 'antiSelf' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-center px-4 py-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold cursor-pointer hover:text-[var(--mantequilla-gold)]"
                  onClick={() => handleSort('uniqueAuthors')}
                >
                  Unique Authors {sortField === 'uniqueAuthors' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-center px-4 py-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold cursor-pointer hover:text-[var(--mantequilla-gold)]"
                  onClick={() => handleSort('totalVotes')}
                >
                  Total Votes {sortField === 'totalVotes' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCurators.map((curator, index) => (
                <tr
                  key={curator.username}
                  className="border-t border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <td className="px-4 py-4 text-[var(--text-muted)] font-mono font-semibold">
                    #{index + 1}
                  </td>
                  <td className="px-4 py-4">
                    <a
                      href={`/@${curator.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--mantequilla-gold)] hover:underline font-medium"
                    >
                      @{curator.username}
                    </a>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {curator.loading ? (
                      <span className="text-[var(--text-muted)]">Loading...</span>
                    ) : curator.error ? (
                      <span className="text-red-500 text-xs">{curator.error}</span>
                    ) : curator.cqs ? (
                      <span className={`inline-block px-3 py-1 rounded-full border font-bold ${getScoreBadge(curator.cqs.score)}`}>
                        {curator.cqs.score}/100
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center font-mono">
                    {curator.cqs ? curator.cqs.subScores.breadth.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-4 text-center font-mono">
                    {curator.cqs ? curator.cqs.subScores.distribution.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-4 text-center font-mono">
                    {curator.cqs ? curator.cqs.subScores.antiSelf.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-4 text-center font-mono font-semibold">
                    {curator.cqs ? curator.cqs.metrics.uniqueAuthors : '-'}
                  </td>
                  <td className="px-4 py-4 text-center font-mono font-semibold">
                    {curator.cqs ? curator.cqs.metrics.voteCount : '-'}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => removeCurator(curator.username)}
                      className="text-red-500 hover:text-red-400 transition-colors font-semibold"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {curators.length === 0 && (
        <div className="bg-[var(--bg-card)] rounded-xl p-12 border border-[var(--border-primary)] text-center">
          <div className="text-6xl mb-4 opacity-30">📊</div>
          <h3 className="text-xl font-semibold mb-2">No curators added yet</h3>
          <p className="text-[var(--text-muted)]">
            Add Hive accounts above to start comparing their curation quality scores
          </p>
        </div>
      )}
    </div>
  );
}
