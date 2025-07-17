// src/components/Navbar.jsx

import React, { useState } from 'react';
import { signInWithGoogle, logout } from '../firebase';

export default function Navbar({ user, isRainbowMode, toggleRainbowMode, cycleBackgroundEffect }) {
  const [titleClickCount, setTitleClickCount] = useState(0);

  // --- NEW: Sound effect easter egg ---
  const handleTitleClick = () => {
    const newCount = titleClickCount + 1;
    setTitleClickCount(newCount);
    if (newCount === 10) {
      // Play a sound using Tone.js if it's available
      if (window.Tone) {
        const synth = new window.Tone.Synth().toDestination();
        synth.triggerAttackRelease("C4", "8n");
      }
      setTitleClickCount(0); // Reset count
    }
  };

  return (
    <nav className="navbar glass-ui">
      <div className="nav-left-group">
        <h1 className="navbar-title" onClick={handleTitleClick} style={{cursor: 'pointer'}} title="What happens if you click me 10 times?">
          🔮 The Cam Files 🔮
        </h1>
        <button className="nav-button" onClick={toggleRainbowMode} title="Toggle Rainbow Mode">🌈</button>
        <button className="nav-button" onClick={cycleBackgroundEffect} title="Change Background Effect">🌠</button>
      </div>
      <button className="action-button primary" onClick={user ? logout : signInWithGoogle}>
        {user ? 'Sign Out' : 'Sign In'}
      </button>
    </nav>
  );
}