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
import TankGame from './components/TankGame'; // <-- IMPORT THE GAME

const backgroundEffects = ['sparkle', 'aurora', 'constellation', 'none'];

function App() {
  const [user, loading] = useAuthState(auth);
  const [isRainbowMode, setIsRainbowMode] = useState(false);
  const [bgEffectIndex, setBgEffectIndex] = useState(0);

  const toggleRainbowMode = () => setIsRainbowMode(prev => !prev);
  const cycleBackgroundEffect = () => setBgEffectIndex(prev => (prev + 1) % backgroundEffects.length);
  const currentBgClass = `bg-${backgroundEffects[bgEffectIndex]}`;

  if (loading) return <Loader text="Waking up the ponies..." />;

  return (
    <Router>
      <div className={`background-container ${currentBgClass}`}></div>
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
        <footer className="footer">I love you cam cam</footer>
        
        {/* --- ADD THE TANK GAME COMPONENT --- */}
        <TankGame user={user} />
      </div>
    </Router>
  );
}

export default App;