// src/App.jsx

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CrystalPage from './pages/CrystalPage';
import Loader from './components/Loader';

// Define our available background effects
const backgroundEffects = ['sparkle', 'aurora', 'constellation', 'none'];

function App() {
  const [user, loading] = useAuthState(auth);
  const [isRainbowMode, setIsRainbowMode] = useState(false);
  const [bgEffectIndex, setBgEffectIndex] = useState(0); // Start with 'sparkle'

  const toggleRainbowMode = () => {
    setIsRainbowMode(prevMode => !prevMode);
  };

  // Function to cycle to the next background effect
  const cycleBackgroundEffect = () => {
    setBgEffectIndex(prevIndex => (prevIndex + 1) % backgroundEffects.length);
  };

  // Get the current effect's class name
  const currentBgClass = `bg-${backgroundEffects[bgEffectIndex]}`;

  if (loading) {
    return <Loader />;
  }
  
  return (
    <Router>
      {/* The background container now gets a dynamic class */}
      <div className={`background-container ${currentBgClass}`}></div>

      <div className={`App ${isRainbowMode ? 'rainbow-dash-mode' : ''}`}>
        <Navbar 
          isRainbowMode={isRainbowMode} 
          toggleRainbowMode={toggleRainbowMode}
          cycleBackgroundEffect={cycleBackgroundEffect} // Pass the new function
        />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/crystal/:crystalId" element={<CrystalPage />} />
        </Routes>
        <footer className="footer">
          "Friendship is Magic"
           I Love You CAMY
        </footer>
      </div>
    </Router>
  );
}

export default App;