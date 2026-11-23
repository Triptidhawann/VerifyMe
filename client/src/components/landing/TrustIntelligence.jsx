import React from 'react';
import { ShieldCheck, Lock, Globe, Activity, Eye, FileText, CheckCircle2, Cpu, Radio, Sparkles, Briefcase, Award } from 'lucide-react';

const TrustIntelligence = () => {
  return (
    <section className="section-padding relative overflow-hidden bg-[#FAFCFA]">
      {/* Ambient background glow */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] opacity-30 blur-[120px] rounded-full"
        style={{ background: 'radial-gradient(circle, #EFF8F3 0%, #49B99A 40%, transparent 80%)' }}
      />

      <div className="container relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="section-title text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF8F3] border border-[#D2E8DB] text-[#2E7D5B] text-xs font-mono uppercase tracking-wider mb-4 shadow-sm">
            <Radio className="w-3.5 h-3.5 text-[#2E7D5B] animate-pulse" />
            <span>Multi-Vector Signal Synthesis</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#202923] tracking-tight mb-4">
            See the signals. Understand the risk.
          </h2>
          <p className="text-[#737D76] text-base sm:text-lg leading-relaxed">
            VerifyMe doesn't just return a black-box score. We illuminate every deterministic protocol signal, digital signature, and authoritative registry record so you understand exactly how trust is determined.
          </p>
        </div>
        
        {/* Main Trust Intelligence Radar Card */}
        <div className="bg-white rounded-3xl border border-[#E7EEE9] p-6 sm:p-10 max-w-5xl mx-auto shadow-xl shadow-[#49B99A]/5 relative">
          {/* Card Radar Header */}
          <div className="mb-8 pb-6 border-b border-[#E7EEE9]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFF8F3] border border-[#D2E8DB] flex items-center justify-center text-[#2E7D5B] shadow-inner">
                  <Globe className="w-5 h-5 text-[#2E7D5B]" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-mono tracking-widest text-[#2E7D5B] uppercase font-bold">
                    Trust Intelligence Radar
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-bold text-[#202923] tracking-tight">
                    investigation.verifyme.internal
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#EFF8F3] border border-[#D2E8DB] px-3.5 py-1.5 rounded-full">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#49B99A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#49B99A]"></span>
                </span>
                <span className="text-xs font-mono font-semibold text-[#2E7D5B] uppercase tracking-wide">
                  All Systems In Agreement
                </span>
              </div>
            </div>
          </div>
          
          {/* 2-Column Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Box: Signals Analyzed */}
            <div className="lg:col-span-7 bg-[#FAFCFA] rounded-2xl border border-[#E7EEE9] p-6">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E7EEE9]">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#2E7D5B]" />
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#202923] font-bold m-0">
                    Signals Analyzed
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[#737D76]">Deterministic Stack</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white border border-[#E7EEE9] hover:border-[#49B99A]/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                    <span className="text-[#202923] text-sm font-medium">Identity consistency & carrier</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-[#2E7D5B] font-semibold">Verified</span>
                    <span className="w-2 h-2 rounded-full bg-[#49B99A]"></span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white border border-[#E7EEE9] hover:border-[#49B99A]/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                    <span className="text-[#202923] text-sm font-medium">Security posture & DNSSEC</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-[#2E7D5B] font-semibold">A+ Grade</span>
                    <span className="w-2 h-2 rounded-full bg-[#49B99A]"></span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white border border-[#E7EEE9] hover:border-[#49B99A]/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                    <span className="text-[#202923] text-sm font-medium">JobShield ATS requisition match</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-[#2E7D5B] font-semibold">Correlated</span>
                    <span className="w-2 h-2 rounded-full bg-[#49B99A]"></span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white border border-[#E7EEE9] hover:border-[#49B99A]/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                    <span className="text-[#202923] text-sm font-medium">CredentialCheck PKCS#7 signature</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-[#2E7D5B] font-semibold">Authentic</span>
                    <span className="w-2 h-2 rounded-full bg-[#49B99A]"></span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white border border-[#E7EEE9] hover:border-[#49B99A]/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                    <span className="text-[#202923] text-sm font-medium">Autonomous threat intelligence</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-[#2E7D5B] font-semibold">Zero Flags</span>
                    <span className="w-2 h-2 rounded-full bg-[#49B99A]"></span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column: Interpretation & Explanation */}
            <div className="lg:col-span-5 flex flex-col gap-5 justify-between">
              {/* Interpretation Box */}
              <div className="bg-[#FAFCFA] rounded-2xl border border-[#E7EEE9] p-6 flex-1">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-[#EFF8F3] border border-[#D2E8DB] flex items-center justify-center text-[#2E7D5B]">
                    <Eye className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#202923] font-bold m-0">
                    Interpretation
                  </h4>
                </div>
                <p className="text-[#737D76] text-sm leading-relaxed m-0">
                  Multiple signals are evaluated concurrently across telecom carriers, DNS authoritative records, ATS requisition logs, and cryptographic document layers before a verdict is synthesized.
                </p>
                <div className="mt-4 pt-3 border-t border-[#E7EEE9] flex items-center justify-between text-xs text-[#737D76] font-mono">
                  <span>Evaluation Latency</span>
                  <span className="text-[#2E7D5B] font-semibold">0.18s Deterministic</span>
                </div>
              </div>

              {/* Explanation Box */}
              <div className="bg-[#FAFCFA] rounded-2xl border border-[#E7EEE9] p-6 flex-1">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-[#EFF8F3] border border-[#D2E8DB] flex items-center justify-center text-[#2E7D5B]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#202923] font-bold m-0">
                    Evidence Ledger Explanation
                  </h4>
                </div>
                <p className="text-[#737D76] text-sm leading-relaxed m-0">
                  Understand exactly why an entity or file received its specific assessment based on empirical findings — completely eliminating black-box opacity and guesswork.
                </p>
                <div className="mt-4 pt-3 border-t border-[#E7EEE9] flex items-center justify-between text-xs text-[#737D76] font-mono">
                  <span>Ledger Integrity</span>
                  <span className="text-[#2E7D5B] font-semibold">100% Traceable</span>
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
