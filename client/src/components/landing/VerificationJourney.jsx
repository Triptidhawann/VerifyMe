import InteractiveDemo from './InteractiveDemo';

const VerificationJourney = () => {
  return (
    <section id="how-it-works" className="section-padding">
      <div className="container">
        <div className="section-title">
          <h2>How VerifyMe Works</h2>
          <p>From raw input to confident decision.</p>
        </div>
        
        {/* PART A - CONCEPTUAL FLOW */}
        <div className="journey-container">
          <div className="journey-line"></div>
          
          <div className="journey-step">
            <div className="journey-node">01</div>
            <h4>Enter</h4>
            <p>Provide an unknown entity.</p>
          </div>
          
          <div className="journey-step">
            <div className="journey-node">02</div>
            <h4>Collect</h4>
            <p>Gather available signals.</p>
          </div>
          
          <div className="journey-step">
            <div className="journey-node">03</div>
            <h4>Analyze</h4>
            <p>Process relationships.</p>
          </div>
          
          <div className="journey-step">
            <div className="journey-node">04</div>
            <h4>Explain</h4>
            <p>Generate readable risk.</p>
          </div>
          
          <div className="journey-step">
            <div className="journey-node">05</div>
            <h4>Decide</h4>
            <p>Act with confidence.</p>
          </div>
        </div>

        {/* PART B - INTERACTIVE DEMO */}
        <div className="demo-section">
          <div className="section-title" style={{ marginTop: '6rem', marginBottom: '3rem' }}>
            <h2>See VerifyMe in Action</h2>
            <p>Watch an unknown entity move from raw input to an explainable trust assessment.</p>
          </div>
          <InteractiveDemo />
        </div>
      </div>
    </section>
  );
};

export default VerificationJourney;
