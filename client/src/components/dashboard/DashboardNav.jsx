import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './DashboardNav.css';

const DashboardNav = () => {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="dashboard-nav">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <Link to="/" className="logo">Verify<span>Me</span></Link>
        
        <div className="dash-nav-links">
          <Link to="/dashboard" className={`dash-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Workspace</Link>
          <Link to="/history" className={`dash-link ${location.pathname === '/history' ? 'active' : ''}`}>History</Link>
          <Link to="/profile" className={`dash-link ${location.pathname === '/profile' ? 'active' : ''}`}>Settings</Link>
        </div>

        <div>
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNav;
