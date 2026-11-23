import React from 'react';
import { Search, FileText, Layers, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

const ProductPrinciples = () => {
  const principles = [
    {
      num: '01',
      title: 'Evidence-Based',
      icon: Search,
      tag: 'Authoritative Sources',
      description: 'Results are derived directly from empirical protocol evidence, live carrier invariance checks, cryptographic DNS records, and statutory registries rather than unsupported assumptions or static blocklists.'
    },
    {
      num: '02',
      title: 'Explainable Evidence Ledger',
      icon: FileText,
      tag: 'Deterministic Factors',
      description: 'Users understand exactly why an entity or document received its specific trust assessment through an audit-grade evidence ledger without technical confusion, proprietary black-boxes, or mysterious scoring.'
    },
    {
      num: '03',
      title: 'Unified Multi-Vector Platform',
      icon: Layers,
      tag: 'Cross-Vector Intelligence',
      description: 'One cohesive platform to investigate phone numbers, email domains, website URLs, job offers (JobShield), and credentials (CredentialCheck) simultaneously with synchronized threat telemetry.'
    },
    {
      num: '04',
      title: 'Privacy-First Architecture',
      icon: ShieldCheck,
      tag: 'Zero-Knowledge Protocol',
      description: 'We minimize unnecessary exposure and treat your verification queries with strict data responsibility, zero search logging, and cryptographic workspace isolation.'
    }
  ];

  return (
    <section id="why" className="section-padding relative overflow-hidden bg-[#FAFCFA]">
      {/* Background radial accent */}
      <div 
        className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[300px] opacity-25 blur-[130px] rounded-full"
        style={{ background: 'radial-gradient(circle, #EFF8F3 0%, #49B99A 40%, transparent 80%)' }}
      />

      <div className="container relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="section-title text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF8F3] border border-[#D2E8DB] text-[#2E7D5B] text-xs font-mono uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#2E7D5B]" />
            <span>Core Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#202923] tracking-tight mb-4">
            Product Principles
          </h2>
          <p className="text-[#737D76] text-base sm:text-lg leading-relaxed">
            The fundamental engineering disciplines and zero-trust principles powering VerifyMe's verification pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl border border-[#E7EEE9] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#49B99A]/50 hover:shadow-lg hover:shadow-[#49B99A]/10 group relative flex flex-col justify-between">
                {/* Number Watermark */}
                <span className="absolute top-6 right-6 font-mono text-3xl font-black text-[#E7EEE9] select-none group-hover:text-[#49B99A]/20 transition-colors">
                  {p.num}
                </span>

                <div>
                  {/* Icon Box */}
                  <div className="w-12 h-12 rounded-xl bg-[#EFF8F3] border border-[#D2E8DB] flex items-center justify-center text-[#2E7D5B] mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-5 h-5 text-[#2E7D5B]" />
                  </div>

                  <h3 className="text-xl font-bold text-[#202923] tracking-tight group-hover:text-[#2E7D5B] transition-colors mb-2.5">
                    {p.title}
                  </h3>

                  <p className="text-[#737D76] text-sm leading-relaxed mb-6">
                    {p.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E7EEE9] flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#2E7D5B] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5B]" />
                    {p.tag}
                  </span>
                  <span className="text-xs font-mono text-[#737D76] group-hover:text-[#202923] transition-colors">
                    Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductPrinciples;
