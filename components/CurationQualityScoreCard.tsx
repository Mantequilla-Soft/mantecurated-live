'use client';

import type { CurationQualityScore } from '@/types/hive';
import { getCQSColor, getCQSInterpretation } from '@/lib/curation-score';
import { formatInteger } from '@/lib/format';

interface CurationQualityScoreCardProps {
  cqs: CurationQualityScore | null;
}

interface SubScoreBarProps {
  label: string;
  value: number;
  description: string;
  metric?: string;
}

function SubScoreBar({ label, value, description, metric }: SubScoreBarProps) {
  const percentage = value * 100;

  // Color based on value
  let barColor = 'bg-red-500';
  if (value >= 0.8) barColor = 'bg-green-500';
  else if (value >= 0.6) barColor = 'bg-blue-500';
  else if (value >= 0.4) barColor = 'bg-yellow-500';
  else if (value >= 0.2) barColor = 'bg-orange-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className="text-xs text-[var(--text-muted)] ml-2">
            ({value.toFixed(2)})
          </span>
        </div>
        {metric && (
          <span className="text-xs text-[var(--text-muted)]">{metric}</span>
        )}
      </div>

      <div className="relative h-6 bg-[var(--bg-secondary)] rounded-lg overflow-hidden border border-[var(--border-primary)]">
        <div
          className={`absolute inset-y-0 left-0 ${barColor} transition-all duration-500 ease-out flex items-center justify-end pr-2`}
          style={{ width: `${percentage}%` }}
        >
          {percentage > 20 && (
            <span className="text-[10px] font-bold text-white drop-shadow-lg">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed opacity-75">
        {description}
      </p>
    </div>
  );
}

export default function CurationQualityScoreCard({ cqs }: CurationQualityScoreCardProps) {
  if (!cqs) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border-primary)] card-glow animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-[var(--mantequilla-gold)] rounded"></span>
          Curation Quality Score
        </h2>
        <div className="flex items-center justify-center py-12">
          <p className="text-[var(--text-muted)]">Calculating curation metrics...</p>
        </div>
      </div>
    );
  }

  const { score, rawScore, subScores, metrics } = cqs;
  const hasVotes = metrics.voteCount > 0;
  const colorGradient = getCQSColor(score);
  const interpretation = getCQSInterpretation(score);

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border-primary)] card-glow animate-fade-in-up">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-[var(--mantequilla-gold)] rounded"></span>
        Curation Quality Score
      </h2>

      {!hasVotes ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-[var(--text-muted)] mb-2">No votes in the last 7 days</p>
            <p className="text-xs text-[var(--text-muted)] opacity-60">
              Cast some votes to see your curation quality metrics
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Main Score Display */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              {/* Decorative rings */}
              <div className={`absolute inset-0 bg-gradient-to-br ${colorGradient} rounded-full blur-2xl opacity-20 animate-pulse`}></div>

              <div className={`relative flex flex-col items-center justify-center w-48 h-48 rounded-full border-4 bg-[var(--bg-secondary)] shadow-xl`}
                   style={{ borderImage: `linear-gradient(135deg, ${colorGradient.replace('from-', '').replace('to-', '')}) 1` }}>
                <div className="text-7xl font-bold glow-red data-value" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {score}
                </div>
                <div className="text-sm font-semibold text-[var(--text-muted)] mt-1">/ 100</div>
                <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] mt-2">
                  Quality Score
                </div>
              </div>
            </div>
          </div>

          {/* Interpretation */}
          <div className={`bg-gradient-to-r ${colorGradient} bg-opacity-10 rounded-lg p-4 mb-6 border border-opacity-30`}
               style={{ borderColor: colorGradient.includes('green') ? '#10b981' : colorGradient.includes('blue') ? '#3b82f6' : colorGradient.includes('yellow') ? '#eab308' : '#ef4444' }}>
            <p className="text-sm text-center text-white font-medium leading-relaxed">
              {interpretation}
            </p>
          </div>

          {/* Sub-Scores */}
          <div className="space-y-5 mb-6">
            <SubScoreBar
              label="Breadth"
              value={subScores.breadth}
              description="Diversity of authors (ideal: 100 unique authors)"
              metric={`${metrics.uniqueAuthors} authors`}
            />

            <SubScoreBar
              label="Distribution"
              value={subScores.distribution}
              description="How evenly vote weight is spread across authors (Gini-based)"
              metric={`Gini: ${metrics.giniCoefficient.toFixed(3)}`}
            />

            <SubScoreBar
              label="Anti-Self"
              value={subScores.antiSelf}
              description="Avoiding self-vote bias (lower is better)"
              metric={`${((1 - subScores.antiSelf) * 100).toFixed(1)}% self-votes`}
            />
          </div>

          {/* Metrics Summary */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-primary)]">
              <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Total Votes
              </div>
              <div className="text-xl font-bold butter-gradient data-value">
                {formatInteger(metrics.voteCount)}
              </div>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-primary)]">
              <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Unique Authors
              </div>
              <div className="text-xl font-bold butter-gradient data-value">
                {formatInteger(metrics.uniqueAuthors)}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-xs text-[var(--text-muted)] text-center border-t border-[var(--border-primary)] pt-4">
            7-day rolling window • Raw Score: {rawScore.toFixed(3)}
          </div>
        </>
      )}
    </div>
  );
}
