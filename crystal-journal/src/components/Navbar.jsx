// src/components/Navbar.jsx

import React from 'react';
import { signInWithGoogle, logout } from '../firebase';

export default function Navbar({ user, isRainbowMode, toggleRainbowMode, cycleBackgroundEffect }) {

  return (
    <nav className="navbar glass-ui">
      <div className="nav-left-group">
        <h1 className="navbar-title">🔮 Multi-Journal</h1>
        <button 
          className="nav-button" 
          onClick={toggleRainbowMode}
          title={isRainbowMode ? "Deactivate Rainbow Mode" : "Activate Rainbow Mode"}
        >
          🌈
        </button>
        <button
          className="nav-button"
          onClick={cycleBackgroundEffect}
          title="Change Background Effect"
        >
          🌠
        </button>
      </div>
      <button className="action-button primary" onClick={user ? logout : signInWithGoogle}>
        {user ? 'Sign Out' : 'Sign In'}
      </button>
    </nav>
  );
}