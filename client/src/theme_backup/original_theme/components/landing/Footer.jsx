import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="saas-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <Link to="/" className="logo" style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Verify<span style={{ color: 'var(--accent-primary)' }}>Me</span>
            </Link>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '250px' }}>
              The digital trust interface. Investigate digital identities, messages, and links before you trust them.
            </p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul className="footer-links">
              <li><a href="#">Phone Verification</a></li>
              <li><a href="#">Email Intelligence</a></li>
              <li><a href="#">Link Inspection</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul className="footer-links">
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#why">Why VerifyMe</a></li>
              <li><a href="#">Security</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul className="footer-links">
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} VerifyMe. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
