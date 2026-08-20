const TrustIntelligence = () => {
  return (
    <section className="section-padding">
      <div className="container">
        <div className="section-title">
          <h2>See the signals. Understand the risk.</h2>
          <p>VerifyMe doesn't just return a black-box score. We show you exactly how we arrived at our conclusion.</p>
        </div>
        
        <div className="trust-intel-card">
          <div style={{ textAlign: 'center', marginBottom: '3rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.875rem', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>TRUST INTELLIGENCE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>entity.example.com</div>
          </div>
          
          <div className="intel-grid">
            <div className="intel-box">
              <h4>Signals Analyzed</h4>
              <div className="intel-row">
                <span>Identity consistency</span>
                <span style={{ color: 'var(--accent-secondary)' }}>●</span>
              </div>
              <div className="intel-row">
                <span>Security posture</span>
                <span style={{ color: 'var(--accent-secondary)' }}>●</span>
              </div>
              <div className="intel-row">
                <span>Domain relationship</span>
                <span style={{ color: 'var(--accent-secondary)' }}>●</span>
              </div>
              <div className="intel-row">
                <span>Reputation</span>
                <span style={{ color: 'var(--accent-secondary)' }}>●</span>
              </div>
              <div className="intel-row">
                <span style={{ color: 'var(--text-secondary)' }}>Threat intelligence</span>
                <span style={{ color: 'var(--text-secondary)' }}>○</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="intel-box">
                <h4>Interpretation</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Multiple signals are evaluated concurrently before a final result is presented to the user.
                </p>
              </div>
              <div className="intel-box">
                <h4>Explanation</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Understand exactly why the entity received its specific trust assessment based on the available evidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustIntelligence;
