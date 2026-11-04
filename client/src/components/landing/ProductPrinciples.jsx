import React from 'react';
import { Search, FileText, Layers, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

const ProductPrinciples = () => {
  const principles = [
    {
      num: '01',
      title: 'Evidence-Based',
      icon: Search,
      tag: 'Authoritative Sources',
      description: 'Results are derived directly from empirical protocol evidence, live carrier invariance checks, and cryptographic DNS validation rather than unsupported assumptions or static blocklists.'
    },
    {
      num: '02',
      title: 'Explainable',
      icon: FileText,
      tag: 'Deterministic Factors',
      description: 'Users understand exactly why an entity received its specific trust assessment without technical confusion, proprietary black-boxes, or mysterious scoring algorithms.'
    },
    {
      num: '03',
      title: 'Unified Platform',
      icon: Layers,
      tag: 'Cross-Vector Intelligence',
      description: 'One cohesive platform to investigate phone numbers, email domains, and website URLs simultaneously with synchronized threat telemetry and cross-vector correlation.'
    },
    {
      num: '04',
      title: 'Privacy-First',
      icon: ShieldCheck,
      tag: 'Zero-Knowledge Protocol',
      description: 'We minimize unnecessary exposure and treat your verification queries with strict data responsibility, zero search logging, and cryptographic data isolation.'
    }
  ];

  return (
    <section id="why" className="section-padding relative overflow-hidden">
      {/* Background radial accent */}
      <div 
        className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[300px] opacity-20 blur-[130px] rounded-full"
        style={{ background: 'radial-gradient(circle, #6366F1 0%, #3B82F6 50%, transparent 80%)' }}
      />

      <div className="container relative z-10">
        <div className="section-title text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Core Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
            Product Principles
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            The fundamental engineering disciplines and zero-trust principles powering VerifyMe's verification pipeline.
          </p>
        </div>

        <div className="why-premium-grid">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={idx} className="why-premium-card group relative">
                {/* Number Watermark */}
                <span className="absolute top-6 right-6 font-mono text-3xl font-black text-slate-800/60 select-none group-hover:text-indigo-500/20 transition-colors">
                  {p.num}
                </span>

                {/* Icon Box */}
                <div className="why-icon-large">
                  <Icon className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-indigo-200 transition-colors m-0">
                    {p.title}
                  </h3>
                </div>

                <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed mb-5 flex-1">
                  {p.description}
                </p>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400/90 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    {p.tag}
                  </span>
                  <span className="text-xs font-mono text-slate-500 group-hover:text-slate-400 transition-colors">
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
