import { useState, useEffect } from 'react';

const EngineSection = () => {
  const [status, setStatus] = useState('analyzing'); // analyzing, collected, complete
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(prev => {
        if (prev === 'analyzing') return 'collected';
        if (prev === 'collected') return 'complete';
        return 'analyzing';
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="section-padding" style={{ background: 'var(--bg-light)', overflow: 'hidden' }}>
      <div className="container">
        <div className="section-title">
          <h2>Inside the VerifyMe Engine</h2>
          <p>Signals are collected, analyzed, and connected to build an explainable trust assessment.</p>
        </div>
        
        <div className="engine-visual-container">
          {/* Orbital System */}
          <div className="orbital-system">
            
            {/* Orbits */}
            <div className="orbit orbit-1">
              <div className="signal-node identity-node">
                <span className="node-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </span>
                <span className="node-label">Identity</span>
              </div>
            </div>
            
            <div className="orbit orbit-2">
              <div className="signal-node domain-node">
                <span className="node-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                </span>
                <span className="node-label">Domain</span>
              </div>
            </div>
            
            <div className="orbit orbit-3">
              <div className="signal-node reputation-node">
                <span className="node-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </span>
                <span className="node-label">Reputation</span>
              </div>
            </div>
            
            <div className="orbit orbit-4">
              <div className="signal-node security-node">
                <span className="node-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </span>
                <span className="node-label">Security</span>
              </div>
            </div>
            
            {/* Scanning Beam */}
            <div className="engine-scanner"></div>

            {/* Central Core */}
            <div className="engine-core">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="M9 12l2 2 4-4"></path>
              </svg>
            </div>

          </div>
          
          {/* Status Panel */}
          <div className="engine-status-panel">
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              ENGINE STATUS
            </div>
            
            <div className="status-header">
              {status === 'analyzing' && <><div className="status-indicator blinking"></div> <span style={{ color: 'var(--accent-secondary)' }}>ANALYZING SIGNALS</span></>}
              {status === 'collected' && <><div className="status-indicator static cyan"></div> <span style={{ color: 'var(--accent-secondary)' }}>SIGNALS COLLECTED</span></>}
              {status === 'complete' && <><div className="status-indicator static green"></div> <span style={{ color: 'var(--success-color)' }}>ANALYSIS COMPLETE</span></>}
            </div>
            
            <div className="status-list">
              <div className="status-item">
                <span>Identity</span>
                {status === 'analyzing' ? <span className="status-dot blink-slow"></span> : <span className="status-check">✓</span>}
              </div>
              <div className="status-item">
                <span>Domain</span>
                {status === 'analyzing' ? <span className="status-dot blink-slow" style={{animationDelay: '0.2s'}}></span> : <span className="status-check">✓</span>}
              </div>
              <div className="status-item">
                <span>Reputation</span>
                {status === 'complete' ? <span className="status-check">✓</span> : <span className="status-dot blink-slow" style={{animationDelay: '0.4s'}}></span>}
              </div>
              <div className="status-item">
                <span>Security</span>
                {status === 'complete' ? <span className="status-check">✓</span> : <span className="status-dot blink-slow" style={{animationDelay: '0.6s'}}></span>}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default EngineSection;
