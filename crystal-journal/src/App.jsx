// src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { themes } from './themes'; // Import our new themes

import Navbar from './components/Navbar';
import Loader from './components/Loader';
import JournalListPage from './pages/JournalListPage';
import JournalPage from './pages/JournalPage';
import ItemPage from './pages/ItemPage';
import TankGamePage from './pages/TankGamePage';

function App() {
  const [user, loading] = useAuthState(auth);
  const [isRainbowMode, setIsRainbowMode] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0); // Index for the current theme

  const toggleRainbowMode = () => {
    setIsRainbowMode(prevMode => !prevMode);
  };

  // Function to cycle to the next theme in the array
  const cycleTheme = () => {
    setThemeIndex(prevIndex => (prevIndex + 1) % themes.length);
  };

  // This effect applies the selected theme's colors and classes
  useEffect(() => {
    const currentTheme = themes[themeIndex];
    const root = document.documentElement;

    // Apply all color variables from the theme object
    for (const [key, value] of Object.entries(currentTheme.colors)) {
      root.style.setProperty(key, value);
    }
  }, [themeIndex]);

  if (loading) return <Loader text="Loading your universe..." />;

  const currentTheme = themes[themeIndex];

  return (
    <Router>
      {/* This div renders the selected background effect */}
      <div className={`background-container ${currentTheme.bgClass}`}></div>

      <div className={`App ${isRainbowMode ? 'rainbow-dash-mode' : ''}`}>
        <Navbar 
          user={user} 
          onThemeClick={cycleTheme} // The theme button now calls cycleTheme
          toggleRainbowMode={toggleRainbowMode}
        />
        <Routes>
          <Route path="/" element={<JournalListPage user={user} />} />
          <Route path="/journal/:journalId" element={<JournalPage user={user} />} />
          <Route path="/journal/:journalId/item/:itemId" element={<ItemPage user={user} />} />
          <Route path="/tank-game" element={<TankGamePage user={user} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;