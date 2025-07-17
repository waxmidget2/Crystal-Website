// src/components/Navbar.jsx

import React from 'react';
import { Link } from 'react-router-dom'; // <-- IMPORT LINK
import { signInWithGoogle, logout } from '../firebase';

export default function Navbar({ user, onThemeClick }) {
  return (
    <nav className="navbar glass-ui">
      <div className="nav-left-group">
        {/* Link back to the main journal list */}
        <Link to="/" style={{textDecoration: 'none', color: 'inherit'}}>
            <h1 className="navbar-title">🔮 Multi-Journal</h1>
        </Link>
        
        {/* Link to the Tank Game */}
        <Link to="/tank-game" className="nav-button" title="Tank Game">
            🛡️ Tank Game
        </Link>

        {user && (
          <button
            className="nav-button"
            onClick={onThemeClick}
            title="Design Your Theme"
          >
            🎨
          </button>
        )}
      </div>
      <button className="action-button primary" onClick={user ? logout : signInWithGoogle}>
        {user ? 'Sign Out' : 'Sign In'}
      </button>
    </nav>
  );
}