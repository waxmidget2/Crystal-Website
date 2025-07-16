// src/App.jsx

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

import Navbar from './components/Navbar';
import Loader from './components/Loader';
import JournalListPage from './pages/JournalListPage';
import JournalPage from './pages/JournalPage';
import ItemPage from './pages/ItemPage';

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

  // Get the current effect's class name from the array
  const currentBgClass = `bg-${backgroundEffects[bgEffectIndex]}`;

  if (loading) {
    return <Loader text="Waking up the ponies..." />;
  }

  return (
    <Router>
      {/* This div renders the selected background effect */}
      <div className={`background-container ${currentBgClass}`}></div>

      {/* This div applies the Rainbow Dash color theme when active */}
      <div className={`App ${isRainbowMode ? 'rainbow-dash-mode' : ''}`}>
        <Navbar 
          user={user}
          isRainbowMode={isRainbowMode} 
          toggleRainbowMode={toggleRainbowMode}
          cycleBackgroundEffect={cycleBackgroundEffect}
        />
        <Routes>
          <Route path="/" element={<JournalListPage user={user} />} />
          <Route path="/journal/:journalId" element={<JournalPage user={user} />} />
          <Route path="/journal/:journalId/item/:itemId" element={<ItemPage user={user} />} />
        </Routes>
        <footer className="footer">
          I Love you Cam Cam
        </footer>
      </div>
    </Router>
  );
}

export default App;