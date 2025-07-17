// src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { themes } from './themes';

import Navbar from './components/Navbar';
import Loader from './components/Loader';
import JournalListPage from './pages/JournalListPage';
import JournalPage from './pages/JournalPage';
import ItemPage from './pages/ItemPage';
import SnakeGamePage from './pages/SnakeGamePage'; // <-- IMPORT THE NEW SNAKE GAME

function App() {
  const [user, loading] = useAuthState(auth);
  const [isRainbowMode, setIsRainbowMode] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);

  const toggleRainbowMode = () => {
    setIsRainbowMode(prevMode => !prevMode);
  };

  const cycleTheme = () => {
    setThemeIndex(prevIndex => (prevIndex + 1) % themes.length);
  };

  useEffect(() => {
    const currentTheme = themes[themeIndex];
    const root = document.documentElement;
    for (const [key, value] of Object.entries(currentTheme.colors)) {
      root.style.setProperty(key, value);
    }
  }, [themeIndex]);

  if (loading) return <Loader text="Loading your universe..." />;

  const currentTheme = themes[themeIndex];

  return (
    <Router>
      <div className={`background-container ${currentTheme.bgClass}`}></div>
      <div className={`App ${isRainbowMode ? 'rainbow-dash-mode' : ''}`}>
        <Navbar 
          user={user} 
          onThemeClick={cycleTheme}
          toggleRainbowMode={toggleRainbowMode}
        />
        <Routes>
          <Route path="/" element={<JournalListPage user={user} />} />
          <Route path="/journal/:journalId" element={<JournalPage user={user} />} />
          <Route path="/journal/:journalId/item/:itemId" element={<ItemPage user={user} />} />
          {/* Route now points to the new Snake Game */}
          <Route path="/snake-game" element={<SnakeGamePage user={user} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;