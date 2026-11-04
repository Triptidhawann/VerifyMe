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
    <footer className="saas-footer relative overflow-hidden">
      {/* Top Border Subtle Gradient Line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.3) 30%, rgba(6, 182, 212, 0.3) 70%, transparent 100%)'
        }}
      />

      <div className="container relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main 4-Column Balanced Grid */}
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-col brand-col">
            <Link to="/" className="inline-flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white mb-3.5 hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span>Verify<span className="text-indigo-400">Me</span></span>
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-sm font-normal">
              The autonomous digital trust platform. Authenticate unknown phone numbers, sender email domains, and website destinations using empirical signal intelligence before you engage.
            </p>

            {/* Live Operational Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Zero-Trust Systems Active • &lt; 0.18s</span>
            </div>

            <div className="flex items-center gap-3">
              <a 
                href="https://github.com/Triptidhawann/VerifyMe" 
                target="_blank" 
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                title="GitHub Repository"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5 pl-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>256-Bit TLS Verified</span>
              </div>
            </div>
          </div>

          {/* Column 1: Verification Engine */}
          <div className="footer-col">
            <h4>Verification Engine</h4>
            <ul className="footer-links">
              <li>
                <a href="#how-it-works">Phone Carrier Match</a>
              </li>
              <li>
                <a href="#how-it-works">Authoritative MX & SPF</a>
              </li>
              <li>
                <a href="#how-it-works">URL Phishing Defense</a>
              </li>
              <li>
                <a href="#how-it-works">Groq Threat Synthesis</a>
              </li>
              <li>
                <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
                  <span>Start Live Scan</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Security & Trust */}
          <div className="footer-col">
            <h4>Security & Trust</h4>
            <ul className="footer-links">
              <li>
                <a href="#why">Zero-Knowledge Model</a>
              </li>
              <li>
                <a href="#why">Deterministic Pipeline</a>
              </li>
              <li>
                <a href="#why">Cryptographic Hashing</a>
              </li>
              <li>
                <a href="#why">Zero Search Logging</a>
              </li>
              <li>
                <a href="#why">SOC-2 Compliance</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform Access */}
          <div className="footer-col">
            <h4>Platform Access</h4>
            <ul className="footer-links">
              <li>
                <Link to="/login">Investigator Sign In</Link>
              </li>
              <li>
                <Link to="/signup">Create Workspace</Link>
              </li>
              <li>
                <a href="#problem">Threat Vectors</a>
              </li>
              <li>
                <a href="#how-it-works">Interactive Demo</a>
              </li>
              <li>
                <a href="#why">Product Principles</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} VerifyMe Platform Inc. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <span className="hover:text-slate-200 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="text-slate-700">•</span>
            <span className="hover:text-slate-200 cursor-pointer transition-colors">Terms of Service</span>
            <span className="text-slate-700">•</span>
            <span className="hover:text-slate-200 cursor-pointer transition-colors">Security Disclosures</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
