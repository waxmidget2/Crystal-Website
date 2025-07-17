// src/components/Navbar.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { signInWithGoogle, logout } from '../firebase';

export default function Navbar({ user, onThemeClick, toggleRainbowMode }) {
  return (
    <nav className="navbar glass-ui">
      <div className="nav-left-group">
        <Link to="/" style={{textDecoration: 'none', color: 'inherit'}}>
            <h1 className="navbar-title">🔮 Multi-Journal</h1>
        </Link>
        <Link to="/tank-game" className="nav-button" title="Tank Game">
          🛡️ Tank Game
        </Link>
        {/* The Rainbow Dash button is back! */}
        <button 
          className="nav-button" 
          onClick={toggleRainbowMode}
          title="Toggle Rainbow Mode"
        >
          🌈
        </button>
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