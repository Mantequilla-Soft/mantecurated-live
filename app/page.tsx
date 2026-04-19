import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--mantequilla-gold)]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[var(--hive-red)]/5 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
      </div>

      <div className="max-w-6xl w-full space-y-12 relative z-10">
        {/* Logo and Header */}
        <div className="text-center space-y-6 animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <Image
              src="/mantequillaSoftLogo.png"
              alt="Mantequilla Soft Logo"
              width={200}
              height={200}
              className="drop-shadow-2xl hover:scale-105 transition-transform duration-300"
              priority
            />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold flex flex-col items-center gap-3">
            <span className="butter-gradient">ManteCurated Live</span>
            <span className="text-2xl md:text-3xl text-[var(--text-muted)] font-normal">
              Hive Curation Analytics
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed">
            Analyze curation quality on <a href="https://hive.io" target="_blank" rel="noopener noreferrer" className="text-[var(--mantequilla-gold)] font-semibold hover:underline transition-all">Hive blockchain</a> with the revolutionary <span className="text-[var(--mantequilla-gold)] font-semibold">Curation Quality Score (CQS)</span> system
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up animation-delay-200">
          <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] hover:border-[var(--mantequilla-gold)]/50 transition-all group">
            <div className="w-12 h-12 bg-[var(--mantequilla-gold)]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[var(--mantequilla-gold)]/20 transition-all">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="14" width="4" height="7" rx="1" fill="var(--mantequilla-gold)"/>
                <rect x="10" y="8" width="4" height="13" rx="1" fill="var(--mantequilla-gold)"/>
                <rect x="17" y="3" width="4" height="18" rx="1" fill="var(--mantequilla-gold)"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 text-[var(--mantequilla-gold)]">CQS Score 1-100</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Comprehensive quality metric measuring curator performance across breadth, distribution, and anti-self dimensions
            </p>
          </div>

          <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] hover:border-[var(--mantequilla-gold)]/50 transition-all group">
            <div className="w-12 h-12 bg-[var(--mantequilla-gold)]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[var(--mantequilla-gold)]/20 transition-all">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17L9 11L13 15L21 7" stroke="var(--mantequilla-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17,7 21,7 21,11" stroke="var(--mantequilla-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 text-[var(--mantequilla-gold)]">Real-Time Analytics</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Live voting power tracking, vote history analysis, and detailed metrics from Hive blockchain
            </p>
          </div>

          <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] hover:border-[var(--mantequilla-gold)]/50 transition-all group">
            <div className="w-12 h-12 bg-[var(--mantequilla-gold)]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[var(--mantequilla-gold)]/20 transition-all">
              <div className="space-y-1">
                <div className="w-6 h-1 bg-[var(--mantequilla-gold)] rounded"></div>
                <div className="w-5 h-1 bg-[var(--mantequilla-gold)] rounded"></div>
                <div className="w-4 h-1 bg-[var(--mantequilla-gold)] rounded"></div>
              </div>
            </div>
            <h3 className="text-lg font-bold mb-2 text-[var(--mantequilla-gold)]">Compare & Export</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Side-by-side curator comparison with exportable reports in Markdown, JSON, and CSV formats
            </p>
          </div>
        </div>

        {/* CQS Explanation */}
        <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] rounded-2xl p-8 border border-[var(--border-primary)] animate-fade-in-up animation-delay-300">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-[var(--mantequilla-gold)] rounded"></span>
            What is Curation Quality Score?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="border-l-4 border-[var(--mantequilla-gold)] pl-4">
              <h3 className="text-lg font-semibold text-[var(--mantequilla-gold)] mb-2">Breadth</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Measures diversity of content curation. Ideal curators support up to <strong>100 unique authors</strong>, fostering a vibrant ecosystem.
              </p>
            </div>
            <div className="border-l-4 border-[var(--mantequilla-gold)] pl-4">
              <h3 className="text-lg font-semibold text-[var(--mantequilla-gold)] mb-2">Distribution</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Evaluates fairness using the Gini coefficient. High scores indicate <strong>balanced voting</strong> rather than concentrated power.
              </p>
            </div>
            <div className="border-l-4 border-[var(--mantequilla-gold)] pl-4">
              <h3 className="text-lg font-semibold text-[var(--mantequilla-gold)] mb-2">Anti-Self</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Rewards <strong>community-focused curation</strong>. Lower self-voting percentages lead to higher quality scores.
              </p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] text-center border-t border-[var(--border-primary)] pt-4">
            <strong>Geometric Mean Formula:</strong> CQS combines all three dimensions using (B × D × S)^(1/3), ensuring balanced excellence across all metrics
          </p>
        </div>

        {/* Two Choice Buttons */}
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in-up animation-delay-400">
          {/* Single Account Button */}
          <Link
            href="/s/single"
            className="group relative bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] rounded-2xl p-10 border-2 border-[var(--border-primary)] hover:border-[var(--mantequilla-gold)] transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden block"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-[var(--mantequilla-gold)]/10 group-hover:to-yellow-600/5 transition-all duration-500"></div>

            <div className="relative z-10 space-y-4">
              <div className="w-16 h-16 bg-[var(--mantequilla-gold)]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[var(--mantequilla-gold)]/20 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="10" r="6" stroke="var(--mantequilla-gold)" strokeWidth="2.5" fill="none"/>
                  <path d="M6 26C6 21 10 18 16 18C22 18 26 21 26 26" stroke="var(--mantequilla-gold)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white group-hover:text-[var(--mantequilla-gold)] transition-colors">
                Single Account
              </h2>
              <p className="text-[var(--text-muted)] group-hover:text-white/80 transition-colors leading-relaxed">
                Deep dive into individual curator performance with detailed dashboards, voting power tracking, top authors analysis, and comprehensive quality metrics
              </p>
              <div className="pt-4">
                <span className="inline-block px-6 py-3 bg-[var(--mantequilla-gold)]/20 group-hover:bg-[var(--mantequilla-gold)] text-[var(--mantequilla-gold)] group-hover:text-black rounded-lg font-semibold transition-all duration-300 text-lg">
                  View Dashboard →
                </span>
              </div>
            </div>
          </Link>

          {/* Comparison Button */}
          <Link
            href="/c/compare"
            className="group relative bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] rounded-2xl p-10 border-2 border-[var(--border-primary)] hover:border-[var(--mantequilla-gold)] transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden block"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-[var(--mantequilla-gold)]/10 group-hover:to-yellow-600/5 transition-all duration-500"></div>

            <div className="relative z-10 space-y-4">
              <div className="w-16 h-16 bg-[var(--mantequilla-gold)]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[var(--mantequilla-gold)]/20 transform group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                <div className="space-y-1.5">
                  <div className="w-8 h-1.5 bg-[var(--mantequilla-gold)] rounded"></div>
                  <div className="w-7 h-1.5 bg-[var(--mantequilla-gold)] rounded"></div>
                  <div className="w-6 h-1.5 bg-[var(--mantequilla-gold)] rounded"></div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white group-hover:text-[var(--mantequilla-gold)] transition-colors">
                Compare Curators
              </h2>
              <p className="text-[var(--text-muted)] group-hover:text-white/80 transition-colors leading-relaxed">
                Side-by-side comparison of multiple curators with sortable metrics, rankings, and powerful export tools for creating detailed analysis reports
              </p>
              <div className="pt-4">
                <span className="inline-block px-6 py-3 bg-[var(--mantequilla-gold)]/20 group-hover:bg-[var(--mantequilla-gold)] text-[var(--mantequilla-gold)] group-hover:text-black rounded-lg font-semibold transition-all duration-300 text-lg">
                  Start Comparing →
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="text-center space-y-4 animate-fade-in-up animation-delay-500">
          <div className="flex items-center justify-center gap-2 text-lg">
            <span className="text-[var(--text-muted)]">Built by</span>
            <a
              href="https://mantequilla-soft.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--mantequilla-gold)] font-bold hover:underline transition-all hover:scale-105 inline-block"
            >
              Mantequilla Soft
            </a>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              Direct link format: <code className="bg-[var(--bg-secondary)] px-2 py-1 rounded text-[var(--mantequilla-gold)]">mantecurated.3speak.tv/@username</code>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] max-w-2xl mx-auto">
            Open source analytics tool for the Hive community. Empowering curators with data-driven insights to improve content discovery and reward distribution.
          </p>
        </div>
      </div>
    </main>
  );
}
