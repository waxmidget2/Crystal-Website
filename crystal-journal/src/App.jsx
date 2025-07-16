import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CrystalPage from './pages/CrystalPage';
import Loader from './components/Loader';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <Loader />;
  }
  
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/crystal/:crystalId" element={<CrystalPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;