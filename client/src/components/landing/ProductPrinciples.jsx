const ProductPrinciples = () => {
  return (
    <section id="why" className="section-padding" style={{ background: 'var(--bg-light)' }}>
      <div className="container">
        <div className="section-title">
          <h2>Product Principles</h2>
        </div>

        <div className="why-premium-grid">
          <div className="why-premium-card">
            <div className="why-icon-large">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            </div>
            <h3>Evidence-Based</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.6 }}>
              Results are derived directly from available evidence rather than unsupported assumptions or static blocklists.
            </p>
          </div>
          
          <div className="why-premium-card">
            <div className="why-icon-large">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h3>Explainable</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.6 }}>
              Users should understand exactly why an entity received its specific trust assessment without technical confusion.
            </p>
          </div>
          
          <div className="why-premium-card">
            <div className="why-icon-large">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            </div>
            <h3>Unified</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.6 }}>
              One cohesive platform to investigate phone numbers, email addresses, and website links simultaneously.
            </p>
          </div>
          
          <div className="why-premium-card">
            <div className="why-icon-large">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h3>Privacy-First</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.6 }}>
              We minimize unnecessary exposure and treat your verification queries with strict data responsibility.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductPrinciples;
