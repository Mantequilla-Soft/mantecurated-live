'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAccount, getGlobalProperties, getRewardFund, getCurrentMedianHistoryPrice, getVoteHistory, getHivePrice } from '@/lib/hive';
import { calculateVotingPower, calculateFullVoteValue, calculateMaxVoteValue, getEffectiveHivePower, getOwnHivePower, getIncomingDelegations, getOutgoingDelegations, parseReputation, calculateResourceCredits, toNumber } from '@/lib/votemath';
import { calculateCurationQualityScore } from '@/lib/curation-score';
import type { HiveAccount, GlobalProperties, RewardFund, MedianPrice, VoteHistoryEntry, AccountStats, TopAuthor, CurationQualityScore } from '@/types/hive';
import VotingPowerGauge from '@/components/VotingPowerGauge';
import AccountStatsCard from '@/components/AccountStatsCard';
import RecentVotesFeed from '@/components/RecentVotesFeed';
import TopAuthorsChart from '@/components/TopAuthorsChart';
import CurationQualityScoreCard from '@/components/CurationQualityScoreCard';

interface DashboardProps {
  initialUsername?: string;
}

export default function Dashboard({ initialUsername = 'mantecurated' }: DashboardProps) {
  const router = useRouter();
  const [accountName, setAccountName] = useState(initialUsername);
  const [inputValue, setInputValue] = useState(initialUsername);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hive data
  const [account, setAccount] = useState<HiveAccount | null>(null);
  const [globalProps, setGlobalProps] = useState<GlobalProperties | null>(null);
  const [rewardFund, setRewardFund] = useState<RewardFund | null>(null);
  const [medianPrice, setMedianPrice] = useState<MedianPrice | null>(null);
  const [hivePriceUsd, setHivePriceUsd] = useState<number>(0);
  const [voteHistory, setVoteHistory] = useState<VoteHistoryEntry[]>([]);

  // Computed stats
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [cqs, setCqs] = useState<CurationQualityScore | null>(null);

  const exportAsMarkdown = () => {
    if (!account || !stats || !cqs) return;

    // Helper function to format numbers with commas
    const formatNumber = (num: number, decimals: number = 2): string => {
      return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const date = new Date().toISOString().split('T')[0];
    let markdown = `# @${account.name} - Curation Dashboard Report\n\n`;
    markdown += `**Generated:** ${date} | **Powered by:** [ManteCurated Live](https://mantecurated.3speak.tv)\n\n`;
    markdown += `---\n\n`;

    // Account Overview
    markdown += `## Account Overview\n\n`;
    markdown += `- **Username:** @${account.name}\n`;
    markdown += `- **Total Hive Power:** ${formatNumber(stats.hivePower)} HP\n`;
    markdown += `  - Own: ${formatNumber(stats.ownHivePower)} HP\n`;
    markdown += `  - Incoming Delegations: ${formatNumber(stats.incomingDelegations)} HP\n`;
    markdown += `  - Outgoing Delegations: ${formatNumber(stats.outgoingDelegations)} HP\n\n`;

    // Voting Power
    markdown += `## Voting Power & Value\n\n`;
    markdown += `- **Current Voting Power:** ${stats.votingPower.toFixed(2)}%\n`;
    markdown += `- **Vote Value:** $${stats.currentVoteValue.toFixed(4)}\n\n`;

    // Curation Quality Score
    markdown += `## Curation Quality Score (CQS)\n\n`;
    markdown += `### Overall Score: ${cqs.score}/100\n\n`;
    markdown += `**Raw Score:** ${cqs.rawScore.toFixed(3)}\n\n`;
    markdown += `### Sub-Scores\n\n`;
    markdown += `| Dimension | Score | Description |\n`;
    markdown += `|-----------|-------|-------------|\n`;
    markdown += `| **Breadth** | ${cqs.subScores.breadth.toFixed(2)} | Diversity of authors (ideal: 100 unique) |\n`;
    markdown += `| **Distribution** | ${cqs.subScores.distribution.toFixed(2)} | Balance of vote weight (Gini-based) |\n`;
    markdown += `| **Anti-Self** | ${cqs.subScores.antiSelf.toFixed(2)} | Community focus vs self-voting |\n\n`;

    // Metrics
    markdown += `### Detailed Metrics\n\n`;
    markdown += `- **Total Votes (7 days):** ${cqs.metrics.voteCount}\n`;
    markdown += `- **Unique Authors:** ${cqs.metrics.uniqueAuthors}\n`;
    markdown += `- **Self-Vote Weight:** ${(cqs.metrics.selfVoteWeight / 100).toFixed(2)}%\n`;
    markdown += `- **Self-Vote Percentage:** ${((1 - cqs.subScores.antiSelf) * 100).toFixed(2)}%\n`;
    markdown += `- **Gini Coefficient:** ${cqs.metrics.giniCoefficient.toFixed(3)}\n`;
    markdown += `- **Time Window:** ${cqs.metrics.timeWindow.daysIncluded} days\n\n`;

    // Top Authors - Process the same way as TopAuthorsChart component for consistency
    if (voteHistory && voteHistory.length > 0) {
      // Filter to upvotes only
      const upvotesOnly = voteHistory.filter(vote => vote.weight > 0);

      // Count votes per author and calculate cumulative weight
      const authorData: Record<string, { voteCount: number; totalWeight: number }> = {};
      upvotesOnly.forEach(vote => {
        if (!authorData[vote.author]) {
          authorData[vote.author] = { voteCount: 0, totalWeight: 0 };
        }
        authorData[vote.author].voteCount++;
        authorData[vote.author].totalWeight += Math.abs(vote.weight);
      });

      // Sort by vote count (same as display)
      const sortedAuthors = Object.entries(authorData)
        .map(([author, data]) => ({
          author,
          voteCount: data.voteCount,
          totalWeight: data.totalWeight
        }))
        .sort((a, b) => b.voteCount - a.voteCount)
        .slice(0, 50);

      if (sortedAuthors.length > 0) {
        markdown += `## Top 50 Authors Voted (7 days)\n\n`;
        markdown += `*Sorted by vote count. Weight represents cumulative voting power spent on each author.*\n\n`;
        markdown += `| Rank | Author | Votes | Cumulative Weight |\n`;
        markdown += `|------|--------|-------|------------------|\n`;
        sortedAuthors.forEach((author, index) => {
          markdown += `| ${index + 1} | @${author.author} | ${author.voteCount} | ${(author.totalWeight / 100).toFixed(2)}% |\n`;
        });
        markdown += `\n`;
      }
    }

    // Footer
    markdown += `---\n\n`;
    markdown += `*Report generated by [ManteCurated Live](https://mantecurated.3speak.tv/@${account.name})*\n`;
    markdown += `*Built by [Mantequilla Soft](https://mantequilla-soft.com)*\n`;

    // Copy to clipboard
    navigator.clipboard.writeText(markdown);
    alert('Markdown report copied to clipboard!');
  };

  const fetchAccountData = async (username: string) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [accountData, globalData, rewardData, priceData, hivePrice] = await Promise.all([
        getAccount(username),
        getGlobalProperties(),
        getRewardFund(),
        getCurrentMedianHistoryPrice(),
        getHivePrice(),
      ]);

      if (!accountData) {
        throw new Error(`Account @${username} not found`);
      }

      setAccount(accountData);
      setGlobalProps(globalData);
      setRewardFund(rewardData);
      setMedianPrice(priceData);
      setHivePriceUsd(hivePrice);

      // Fetch vote history (fetches enough to cover 7 days, pre-filtered for this user)
      const votes = await getVoteHistory(username, 7);
      console.log('Raw votes fetched:', votes.length);

      // Process vote history into VoteHistoryEntry format
      const processedVotes: VoteHistoryEntry[] = votes.map((entry: any) => {
        const [transactionNumber, transaction] = entry;
        const [, opData] = transaction.op;

        return {
          transactionNumber,
          timestamp: transaction.timestamp,
          voter: opData.voter,
          author: opData.author,
          permlink: opData.permlink,
          weight: opData.weight,
        };
      });

      console.log('Processed votes (cast by account):', processedVotes.length);
      setVoteHistory(processedVotes);

      // Calculate Curation Quality Score
      const curationScore = calculateCurationQualityScore(processedVotes, 7);
      console.log('Curation Quality Score:', curationScore);
      setCqs(curationScore);

      // Calculate stats
      const votingPower = calculateVotingPower(accountData);
      const hivePower = getEffectiveHivePower(accountData, globalData);
      const ownHivePower = getOwnHivePower(accountData, globalData);
      const incomingDelegations = getIncomingDelegations(accountData, globalData);
      const outgoingDelegations = getOutgoingDelegations(accountData, globalData);
      const resourceCredits = calculateResourceCredits(accountData);
      const reputation = parseReputation(accountData.reputation);
      const hiveBalance = toNumber(accountData.balance);
      const hbdBalance = toNumber(accountData.hbd_balance);
      // On current Hive: vote value is constant (doesn't scale with VP)
      const voteValue = calculateMaxVoteValue(accountData, rewardData, hivePrice);

      console.log('HIVE price (USD):', '$' + hivePrice.toFixed(3));
      console.log('Own HP:', ownHivePower.toFixed(2));
      console.log('Total HP:', hivePower.toFixed(2));
      console.log('Incoming:', incomingDelegations.toFixed(2));
      console.log('Outgoing:', outgoingDelegations.toFixed(2));
      console.log('Full vote value: $' + voteValue.toFixed(3));

      setStats({
        votingPower,
        hivePower,
        ownHivePower,
        incomingDelegations,
        outgoingDelegations,
        resourceCredits,
        reputation,
        hiveBalance,
        hbdBalance,
        currentVoteValue: voteValue,
        maxVoteValue: voteValue,
      });

    } catch (err) {
      console.error('Error fetching account data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch account data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountData(accountName);
  }, [accountName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const username = inputValue.trim().toLowerCase();
      setAccountName(username);
      // Update URL without page reload
      router.push(`/${username}`);
    }
  };

  return (
    <>
      {/* Back Button */}
      <Link
        href="/"
        className="text-[var(--text-muted)] hover:text-[var(--mantequilla-gold)] transition-colors flex items-center gap-2 mb-6 inline-block"
      >
        ← Back to Menu
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 md:gap-4 mb-4">
          <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
            <img
              src="/mantequillaSoftLogo.png"
              alt="Mantequilla Soft Logo"
              className="w-12 h-12 md:w-16 md:h-16 object-contain flex-shrink-0"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              <span className="glow-red">ManteCurated</span>
              <span className="text-[var(--text-secondary)] ml-1 md:ml-2 whitespace-nowrap">LIVE</span>
            </h1>
            <p className="text-[var(--text-muted)] text-[10px] sm:text-xs uppercase tracking-widest mt-1">
              Powered by <span className="butter-gradient font-semibold">Mantequilla Soft</span>
            </p>
          </div>
        </div>
        <p className="text-[var(--text-muted)] text-xs sm:text-sm uppercase tracking-widest">Hive Blockchain Curation Terminal</p>
        <div className="w-20 h-1 bg-gradient-to-r from-[var(--mantequilla-gold)] via-[var(--mantequilla-yellow)] to-transparent mt-4"></div>
      </div>

      {/* Account Input */}
      <form onSubmit={handleSubmit} className="mb-10">
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">@</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="hive-username"
              className="w-full pl-8 pr-4 py-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)] text-white placeholder:text-[var(--text-muted)] transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-[var(--mantequilla-gold)] to-[var(--mantequilla-yellow)] hover:from-[var(--mantequilla-yellow)] hover:to-[var(--mantequilla-gold)] disabled:bg-[var(--border-primary)] disabled:cursor-not-allowed rounded-xl font-bold transition-all relative overflow-hidden group whitespace-nowrap"
          >
            <span className="relative z-10">{loading ? 'LOADING...' : 'ANALYZE'}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-5 bg-red-900/20 border border-red-500/50 rounded-xl text-red-300 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block w-16 h-16 border-4 border-[var(--border-primary)] border-t-[var(--mantequilla-gold)] rounded-full animate-spin mb-4"></div>
            <p className="text-[var(--text-muted)] uppercase tracking-wider text-sm">Analyzing Blockchain Data...</p>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      {account && stats && globalProps && rewardFund && medianPrice && hivePriceUsd > 0 && !loading && (
        <div className="space-y-6">
          {/* Export Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={exportAsMarkdown}
              className="px-6 py-3 bg-[var(--bg-secondary)] border border-[var(--mantequilla-gold)] text-[var(--mantequilla-gold)] rounded-lg hover:bg-[var(--mantequilla-gold)] hover:text-black transition-all font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M8 4V2M12 4V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 8H20V22H8V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Copy Full Report as Markdown
            </button>
          </div>

          {/* Top Row: VP Gauge and Account Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VotingPowerGauge
              votingPower={stats.votingPower}
              currentVoteValue={stats.currentVoteValue}
              maxVoteValue={stats.maxVoteValue}
            />
            <AccountStatsCard stats={stats} accountName={account.name} />
          </div>

          {/* Second Row: Curation Quality Score */}
          <CurationQualityScoreCard cqs={cqs} />

          {/* Third Row: Top Authors Chart */}
          <TopAuthorsChart voteHistory={voteHistory} />

          {/* Bottom Row: Recent Votes Feed */}
          <RecentVotesFeed
            voteHistory={voteHistory}
            account={account}
            rewardFund={rewardFund}
            hivePriceUsd={hivePriceUsd}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-[var(--border-primary)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/mantequillaSoftLogo.png"
              alt="Mantequilla Soft Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            />
            <div>
              <p className="text-sm font-semibold butter-gradient">Mantequilla Soft</p>
              <p className="text-xs text-[var(--text-muted)]">Butter-smooth tools for Hive</p>
            </div>
          </div>
          <div className="flex items-center flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-[var(--text-muted)]">
            <a
              href="https://mantequilla-soft.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--mantequilla-gold)] transition-colors"
            >
              Website
            </a>
            <a
              href="https://github.com/Mantequilla-Soft"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--mantequilla-gold)] transition-colors"
            >
              GitHub
            </a>
            <span className="text-xs">
              © {new Date().getFullYear()} Mantequilla Soft
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
