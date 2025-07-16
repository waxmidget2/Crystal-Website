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

function App() {
  const [user, loading] = useAuthState(auth);
  
  if (loading) {
    return <Loader text="Waking up the ponies..." />;
  }

  return (
    <Router>
      <div className="App">
        <Navbar />
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