import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowUpRight } from 'lucide-react';

const GithubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-[#FAFCFA] border-t border-[#E7EEE9] pt-20 pb-10">
      {/* Top Border Subtle Gradient Line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(73, 185, 154, 0.4) 30%, rgba(46, 125, 91, 0.4) 70%, transparent 100%)'
        }}
      />

      <div className="container relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main 4-Column Balanced Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-14">
          {/* Brand Column */}
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-2.5 text-2xl font-bold tracking-tight text-[#202923] mb-3.5 hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2E7D5B] to-[#49B99A] flex items-center justify-center text-white shadow-md shadow-[#49B99A]/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span>Verify<span className="text-[#49B99A]">Me</span></span>
            </Link>

            <p className="text-[#737D76] text-sm leading-relaxed mb-5 max-w-sm font-normal">
              The autonomous digital trust platform. Authenticate unknown phone numbers, sender email domains, website destinations, job offers, and credentials using empirical signal intelligence before you engage.
            </p>

            {/* Live Operational Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFF8F3] border border-[#D2E8DB] text-[#2E7D5B] text-xs font-mono mb-5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#49B99A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#49B99A]"></span>
              </span>
              <span>Zero-Trust Systems Active • &lt; 0.18s</span>
            </div>

            <div className="flex items-center gap-3">
              <a 
                href="https://github.com/Triptidhawann/VerifyMe" 
                target="_blank" 
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white border border-[#E7EEE9] hover:border-[#49B99A] text-[#737D76] hover:text-[#2E7D5B] flex items-center justify-center transition-all shadow-sm"
                title="GitHub Repository"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
              <div className="text-xs font-mono text-[#737D76] flex items-center gap-1.5 pl-1">
                <Lock className="w-3.5 h-3.5 text-[#2E7D5B]" />
                <span>256-Bit TLS Verified</span>
              </div>
            </div>
          </div>

          {/* Column 1: Verification Engine */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-bold text-[#202923] mb-4 uppercase tracking-wider font-mono">Verification Engine</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/jobshield" className="text-[#737D76] hover:text-[#2E7D5B] flex items-center gap-1.5 transition-colors">
                  <span>JobShield (Offer Scams)</span>
                  <span className="text-[10px] bg-[#EFF8F3] text-[#2E7D5B] font-mono px-1.5 py-0.5 rounded border border-[#D2E8DB]">NEW</span>
                </Link>
              </li>
              <li>
                <Link to="/credential-check" className="text-[#737D76] hover:text-[#2E7D5B] flex items-center gap-1.5 transition-colors">
                  <span>CredentialCheck (Degrees & Marksheets)</span>
                  <span className="text-[10px] bg-[#EFF8F3] text-[#2E7D5B] font-mono px-1.5 py-0.5 rounded border border-[#D2E8DB]">NEW</span>
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="text-[#737D76] hover:text-[#2E7D5B] transition-colors">Phone Carrier Invariance</a>
              </li>
              <li>
                <a href="#how-it-works" className="text-[#737D76] hover:text-[#2E7D5B] transition-colors">Authoritative MX & SPF Checks</a>
              </li>
              <li>
                <a href="#how-it-works" className="text-[#737D76] hover:text-[#2E7D5B] transition-colors">URL Homoglyph Phishing Defense</a>
              </li>
              <li>
                <Link to="/signup" className="text-[#2E7D5B] hover:text-[#174C3C] flex items-center gap-1 font-semibold pt-1">
                  <span>Start Live Scan</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Security & Trust */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold text-[#202923] mb-4 uppercase tracking-wider font-mono">Security & Trust</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#why" className="text-[#737D76] hover:text-[#2E7D5B] transition-colors">Evidence Ledger</a>
              </li>
              <li>
                <a href="#why" className="text-[#737D76] hover:text-[#2E7D5B] transition-colors">Deterministic Pipeline</a>
              </li>
              <li>
                <a href="#why" className="text-[#737D76] hover:text-[#2E7D5B] transition-colors">PKCS#7 Verification</a>
              </li>
              <li>
                <a href="#why" className="text-[#737D76] hover:text-[#2E7D5B] transition-colors">Zero Search Logging</a>
              </li>
              <li>
                <a href="#why" className="text-[#737D76] hover:text-[#2E7D5B] transition-colors">Privacy by Design</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform Access */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold text-[#202923] mb-4 uppercase tracking-wider font-mono">Platform Access</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/login" className="text-[#737D76] hover:text-[#2E7D5B] transition-colors">Investigator Sign In</Link>
              </li>
              <li>
                <Link to="/signup" className="text-[#737D76] hover:text-[#2E7D5B] transition-colors">Create Workspace</Link>
              </li>
              <li>
                <a href="#problem" className="text-[#737D76] hover:text-[#2E7D5B] transition-colors">Threat Vectors</a>
              </li>
              <li>
                <a href="#how-it-works" className="text-[#737D76] hover:text-[#2E7D5B] transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#why" className="text-[#737D76] hover:text-[#2E7D5B] transition-colors">Product Principles</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-[#E7EEE9] pt-6 text-xs text-[#737D76] flex flex-wrap justify-between items-center gap-4">
          <div>
            &copy; {new Date().getFullYear()} VerifyMe Platform Inc. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <span className="hover:text-[#202923] cursor-pointer transition-colors">Privacy Policy</span>
            <span className="text-[#D2E8DB]">•</span>
            <span className="hover:text-[#202923] cursor-pointer transition-colors">Terms of Service</span>
            <span className="text-[#D2E8DB]">•</span>
            <span className="hover:text-[#202923] cursor-pointer transition-colors">Security Disclosures</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
