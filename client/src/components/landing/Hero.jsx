import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="container hero-grid">
        <div className="hero-content animate-fade-up">
          <h1>Know Before<br />You Trust.</h1>
          <p>
            VerifyMe is a digital trust intelligence platform that helps you investigate unknown digital entities before you respond, share information, or click.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/signup" className="btn">Start Verifying</Link>
            <a href="#how-it-works" className="btn btn-secondary">See How It Works</a>
          </div>
        </div>
        
        {/* Eye-Scan Security Visualization */}
        <div className="eye-scan-container animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="scan-ring-outer"></div>
          <div className="scan-ring-inner"></div>
          <div className="scan-beam"></div>
          <div className="scan-core">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M12 8v4"></path>
              <path d="M12 16h.01"></path>
            </svg>
          </div>
          
          <div className="scan-status-panel">
            <div className="status-label">Engine Status</div>
            <div className="status-value">
              <div className="status-indicator"></div>
              ANALYZING SIGNALS
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
