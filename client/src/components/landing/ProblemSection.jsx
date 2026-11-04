import React from 'react';
import { PhoneCall, Mail, Link as LinkIcon, AlertTriangle, ShieldAlert } from 'lucide-react';

const ProblemSection = () => {
  return (
    <section id="problem" className="section-padding relative overflow-hidden">
      {/* Background ambient lighting */}
      <div 
        className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] opacity-15 blur-[140px] rounded-full"
        style={{ background: 'radial-gradient(circle, #EF4444 0%, #6366F1 50%, transparent 80%)' }}
      />

      <div className="container relative z-10">
        <div className="section-title text-center max-w-3xl mx-auto mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-mono uppercase tracking-wider mb-4 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>The Asymmetry of Digital Trust</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
            Unknown doesn't mean safe.
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Every day you encounter digital entities with zero trust context. VerifyMe transforms uncertainty into explainable evidence.
          </p>
        </div>
        
        <div className="problem-grid">
          {/* Card 1: Unknown Call */}
          <div className="problem-card group">
            <div className="problem-icon-wrapper group-hover:scale-110 transition-transform duration-300">
              <PhoneCall className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mb-2.5 group-hover:text-indigo-200 transition-colors">
              Unknown Call
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Is this a legitimate organization calling, or a recognized threat actor executing a voice phishing or social engineering attempt?
            </p>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-indigo-400 font-medium">
              E.164 Invariance Analysis
            </div>
          </div>
          
          {/* Card 2: Suspicious Email */}
          <div className="problem-card group">
            <div className="problem-icon-wrapper group-hover:scale-110 transition-transform duration-300">
              <Mail className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mb-2.5 group-hover:text-indigo-200 transition-colors">
              Suspicious Email
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Does the sender domain legitimately match the organization, and are the cryptographic SPF, DKIM, and DMARC configurations valid?
            </p>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-indigo-400 font-medium">
              DNS Protocol Verification
            </div>
          </div>
          
          {/* Card 3: Unexpected Link */}
          <div className="problem-card group">
            <div className="problem-icon-wrapper group-hover:scale-110 transition-transform duration-300">
              <LinkIcon className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mb-2.5 group-hover:text-indigo-200 transition-colors">
              Unexpected Link
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Where does this URL actually route to? Is it a homograph spoofing attempt, known phishing infrastructure, or secure destination?
            </p>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-indigo-400 font-medium">
              Real-Time URL Dissection
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
