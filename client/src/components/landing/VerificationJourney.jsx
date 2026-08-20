const VerificationJourney = () => {
  return (
    <section id="how-it-works" className="section-padding">
      <div className="container">
        <div className="section-title">
          <h2>From Uncertainty to Decision</h2>
          <p>A unified verification pipeline.</p>
        </div>
        
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
      </div>
    </section>
  );
};

export default VerificationJourney;
