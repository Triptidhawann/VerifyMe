import React from 'react';
import { ShieldCheck, Lock, Globe, Activity, Eye, FileText, CheckCircle2, Cpu, Radio, Sparkles } from 'lucide-react';

const TrustIntelligence = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Ambient background glow */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] opacity-25 blur-[120px] rounded-full"
        style={{ background: 'radial-gradient(circle, #6366F1 0%, #06B6D4 50%, transparent 80%)' }}
      />

      <div className="container relative z-10">
        <div className="section-title text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-4 shadow-sm">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Autonomous Signal Synthesis</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
            See the signals. Understand the risk.
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            VerifyMe doesn't just return a black-box score. We illuminate every deterministic protocol signal so you understand exactly how trust is determined.
          </p>
        </div>
        
        {/* Main Trust Intelligence Terminal Card */}
        <div className="trust-intel-card">
          {/* Card Terminal Header */}
          <div className="intel-card-header">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-mono tracking-widest text-indigo-300 uppercase font-semibold">
                    Trust Intelligence Radar
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
                    entity.example.com
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wide">
                  5/5 Signals In Agreement
                </span>
              </div>
            </div>
          </div>
          
          {/* 2-Column Content Grid */}
          <div className="intel-grid">
            {/* Left Box: Signals Analyzed */}
            <div className="intel-box">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold m-0">
                    Signals Analyzed
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Deterministic Stack</span>
              </div>

              <div className="space-y-3.5">
                <div className="intel-row flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-900/40 border border-slate-800/60 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-200 text-sm font-medium">Identity consistency</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">Verified</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                  </div>
                </div>

                <div className="intel-row flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-900/40 border border-slate-800/60 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-200 text-sm font-medium">Security posture</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">A+ Grade</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                  </div>
                </div>

                <div className="intel-row flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-900/40 border border-slate-800/60 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-200 text-sm font-medium">Domain relationship</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">SPF/MX Valid</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                  </div>
                </div>

                <div className="intel-row flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-900/40 border border-slate-800/60 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-200 text-sm font-medium">Reputation telemetry</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">0 Spam Flags</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                  </div>
                </div>

                <div className="intel-row flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-900/40 border border-slate-800/60 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-slate-200 text-sm font-medium">Threat intelligence</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold">Clean Feed</span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column: Interpretation & Explanation */}
            <div className="flex flex-col gap-5 justify-between">
              {/* Interpretation Box */}
              <div className="intel-box flex-1">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Eye className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold m-0">
                    Interpretation
                  </h4>
                </div>
                <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed m-0">
                  Multiple signals are evaluated concurrently across telecom carriers, DNS authoritative records, and behavioral reputation networks before a final result is synthesized.
                </p>
                <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Evaluation Latency</span>
                  <span className="text-indigo-400 font-semibold">0.18s Deterministic</span>
                </div>
              </div>

              {/* Explanation Box */}
              <div className="intel-box flex-1">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold m-0">
                    Explanation
                  </h4>
                </div>
                <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed m-0">
                  Understand exactly why an entity received its specific trust assessment based on empirical evidence — completely eliminating black-box opacity and arbitrary scoring.
                </p>
                <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Confidence Metric</span>
                  <span className="text-emerald-400 font-semibold">98/100 Verified Trust</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustIntelligence;
