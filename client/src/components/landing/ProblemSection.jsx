import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PhoneCall, 
  Mail, 
  Globe, 
  Briefcase, 
  Award, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  Lock,
  Search
} from 'lucide-react';

const ProblemSection = () => {
  return (
    <section id="problem" className="py-24 sm:py-32 relative bg-[#FAFCFA] overflow-hidden">
      {/* Ambient background soft glow */}
      <div 
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] opacity-35 blur-[160px] rounded-full"
        style={{ background: 'radial-gradient(circle, #EFF8F3 0%, #49B99A 35%, transparent 75%)' }}
        aria-hidden="true"
      />

      <div className="container relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Centered & Authoritative */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF8F3] border border-[#D2E8DB] text-[#2E7D5B] text-xs font-mono font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-[#49B99A]" />
            <span>Multi-Vector Verification Intelligence</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#202923] tracking-tight mb-4 leading-tight">
            Unknown doesn't mean safe.{' '}
            <span className="bg-gradient-to-r from-[#2E7D5B] via-[#49B99A] to-[#2E7D5B] bg-clip-text text-transparent block sm:inline">
              Verify before you trust.
            </span>
          </h2>
          
          <p className="text-[#556058] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
            Every day you encounter digital entities with zero trust context. VerifyMe transforms uncertainty into explainable evidence across every communication channel.
          </p>
        </div>

        {/* Feature Grid: Balanced Bento Composition */}
        <div className="space-y-6 sm:space-y-8">
          
          {/* ROW 1: Flagship Intelligence Platforms (2 Wide Spotlight Cards) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Spotlight 1: JobShield */}
            <div className="group relative bg-[#FFFFFF] rounded-3xl border border-[#DCE5DF] p-7 sm:p-9 shadow-sm hover:shadow-xl hover:border-[#49B99A]/60 transition-all duration-300 flex flex-col justify-between overflow-hidden">
              {/* Subtle card corner wash */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#EFF8F3] to-transparent rounded-bl-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#EFF8F3] border border-[#D2E8DB] flex items-center justify-center text-[#2E7D5B] group-hover:scale-105 group-hover:bg-[#49B99A] group-hover:text-white transition-all duration-300 shadow-sm">
                    <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 transition-colors" />
                  </div>
                  
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF8F3] border border-[#D2E8DB] text-[#2E7D5B] text-xs font-mono font-bold uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-[#49B99A]" />
                    <span>Opportunity Forensics</span>
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#202923] tracking-tight mb-3 group-hover:text-[#2E7D5B] transition-colors">
                  JobShield Platform
                </h3>
                
                <p className="text-[#556058] text-sm sm:text-base leading-relaxed mb-6 font-normal">
                  Protect yourself from high-confidence employment scams. Cross-examine offer letters, recruiter domains, and interview messages against official ATS company career portals to expose spoofed recruiters and upfront check deposit fraud.
                </p>

                {/* Capability badges */}
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#202923] bg-[#F8FAF9] border border-[#E7EEE9] px-3 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#49B99A]" />
                    <span>ATS Requisition Matching</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#202923] bg-[#F8FAF9] border border-[#E7EEE9] px-3 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#49B99A]" />
                    <span>Recruiter Domain Forensics</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#202923] bg-[#F8FAF9] border border-[#E7EEE9] px-3 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#49B99A]" />
                    <span>Deposit Scam Detection</span>
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="relative z-10 pt-5 border-t border-[#EAEFEA] flex items-center justify-between">
                <Link 
                  to="/jobshield"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#2E7D5B] hover:text-[#174C3C] group-hover:gap-2.5 transition-all"
                >
                  <span>Launch JobShield Investigation</span>
                  <ArrowRight className="w-4 h-4 text-[#49B99A]" />
                </Link>
                <span className="text-xs font-mono text-[#737D76]">Real-Time Cross-Check</span>
              </div>
            </div>

            {/* Spotlight 2: CredentialCheck */}
            <div className="group relative bg-[#FFFFFF] rounded-3xl border border-[#DCE5DF] p-7 sm:p-9 shadow-sm hover:shadow-xl hover:border-[#49B99A]/60 transition-all duration-300 flex flex-col justify-between overflow-hidden">
              {/* Subtle card corner wash */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#EFF8F3] to-transparent rounded-bl-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#EFF8F3] border border-[#D2E8DB] flex items-center justify-center text-[#2E7D5B] group-hover:scale-105 group-hover:bg-[#49B99A] group-hover:text-white transition-all duration-300 shadow-sm">
                    <Award className="w-6 h-6 sm:w-7 sm:h-7 transition-colors" />
                  </div>
                  
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF8F3] border border-[#D2E8DB] text-[#2E7D5B] text-xs font-mono font-bold uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-[#49B99A]" />
                    <span>Document Intelligence</span>
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#202923] tracking-tight mb-3 group-hover:text-[#2E7D5B] transition-colors">
                  CredentialCheck Platform
                </h3>
                
                <p className="text-[#556058] text-sm sm:text-base leading-relaxed mb-6 font-normal">
                  Audit academic marksheets, degree certificates, and professional credentials. Inspect cryptographic PKCS#7 PDF signatures, decode tamper-evident registrar QR codes, and verify grade calculations with statutory registries.
                </p>

                {/* Capability badges */}
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#202923] bg-[#F8FAF9] border border-[#E7EEE9] px-3 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#49B99A]" />
                    <span>PKCS#7 Digital Signatures</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#202923] bg-[#F8FAF9] border border-[#E7EEE9] px-3 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#49B99A]" />
                    <span>QR Registrar Verification</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#202923] bg-[#F8FAF9] border border-[#E7EEE9] px-3 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#49B99A]" />
                    <span>Marks Arithmetic Audit</span>
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="relative z-10 pt-5 border-t border-[#EAEFEA] flex items-center justify-between">
                <Link 
                  to="/credentialcheck"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#2E7D5B] hover:text-[#174C3C] group-hover:gap-2.5 transition-all"
                >
                  <span>Verify Academic Credentials</span>
                  <ArrowRight className="w-4 h-4 text-[#49B99A]" />
                </Link>
                <span className="text-xs font-mono text-[#737D76]">Statutory Ledger Match</span>
              </div>
            </div>

          </div>

          {/* ROW 2: Core Communication Vectors (3 Balanced Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Card 1: Phone Verification */}
            <div className="group bg-[#FFFFFF] rounded-3xl border border-[#DCE5DF] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#49B99A]/60 hover:shadow-lg shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#EFF8F3] border border-[#D2E8DB] flex items-center justify-center text-[#2E7D5B] group-hover:scale-105 group-hover:bg-[#49B99A] group-hover:text-white transition-all duration-300 shadow-sm mb-5">
                  <PhoneCall className="w-5 h-5 transition-colors" />
                </div>

                <h4 className="text-xl font-bold text-[#202923] tracking-tight mb-2.5 group-hover:text-[#2E7D5B] transition-colors">
                  Phone Verification
                </h4>

                <p className="text-[#556058] text-sm leading-relaxed mb-6 font-normal">
                  Detect voice phishing, caller ID spoofing, and VoIP routing anomalies. Validate carrier assignment and number invariance before answering unknown callers.
                </p>
              </div>

              <div className="pt-4 border-t border-[#EAEFEA] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#2E7D5B] font-mono text-[11px]">E.164 Invariance Analysis</span>
                <span className="w-2 h-2 rounded-full bg-[#49B99A]"></span>
              </div>
            </div>

            {/* Card 2: Email Verification */}
            <div className="group bg-[#FFFFFF] rounded-3xl border border-[#DCE5DF] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#49B99A]/60 hover:shadow-lg shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#EFF8F3] border border-[#D2E8DB] flex items-center justify-center text-[#2E7D5B] group-hover:scale-105 group-hover:bg-[#49B99A] group-hover:text-white transition-all duration-300 shadow-sm mb-5">
                  <Mail className="w-5 h-5 transition-colors" />
                </div>

                <h4 className="text-xl font-bold text-[#202923] tracking-tight mb-2.5 group-hover:text-[#2E7D5B] transition-colors">
                  Email Verification
                </h4>

                <p className="text-[#556058] text-sm leading-relaxed mb-6 font-normal">
                  Verify sender domains against authoritative DNS records (SPF, DKIM, DMARC) to block spoofed executive emails and phishing communications.
                </p>
              </div>

              <div className="pt-4 border-t border-[#EAEFEA] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#2E7D5B] font-mono text-[11px]">DNS Protocol Validation</span>
                <span className="w-2 h-2 rounded-full bg-[#49B99A]"></span>
              </div>
            </div>

            {/* Card 3: Website Verification */}
            <div className="group bg-[#FFFFFF] rounded-3xl border border-[#DCE5DF] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#49B99A]/60 hover:shadow-lg shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#EFF8F3] border border-[#D2E8DB] flex items-center justify-center text-[#2E7D5B] group-hover:scale-105 group-hover:bg-[#49B99A] group-hover:text-white transition-all duration-300 shadow-sm mb-5">
                  <Globe className="w-5 h-5 transition-colors" />
                </div>

                <h4 className="text-xl font-bold text-[#202923] tracking-tight mb-2.5 group-hover:text-[#2E7D5B] transition-colors">
                  Website Verification
                </h4>

                <p className="text-[#556058] text-sm leading-relaxed mb-6 font-normal">
                  Dissect destination URLs in real time to uncover homoglyph lookalike characters, newly registered phishing infrastructure, and suspicious redirects.
                </p>
              </div>

              <div className="pt-4 border-t border-[#EAEFEA] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#2E7D5B] font-mono text-[11px]">Real-Time URL Dissection</span>
                <span className="w-2 h-2 rounded-full bg-[#49B99A]"></span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default ProblemSection;
