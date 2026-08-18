import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="logo">Verify<span>Me</span></Link>
            <p>A digital trust platform for understanding unknown contacts, identities, and links.</p>
          </div>
          
          <div className="footer-column">
            <h4>Product</h4>
            <ul className="footer-links">
              <li><a href="#">Verification</a></li>
              <li><a href="#">Link Lens</a></li>
              <li><a href="#">Trust Profiles</a></li>
              <li><a href="#">History</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4>Company</h4>
            <ul className="footer-links">
              <li><a href="#">About</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Security</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4>Legal</h4>
            <ul className="footer-links">
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
              <li><a href="#">Help</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} VerifyMe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
