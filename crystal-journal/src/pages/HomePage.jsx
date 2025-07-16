import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import Loader from '../components/Loader';
import AddCrystalForm from '../components/AddCrystalForm';

export default function HomePage() {
  const [user] = useAuthState(auth);
  const [crystals, setCrystals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const fetchCrystals = async () => {
      try {
        const q = query(collection(db, "crystals"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const crystalsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCrystals(crystalsData);
      } catch (err) {
        console.error("Error fetching crystals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCrystals();
  }, []);

  const handleCrystalAdded = (newCrystal) => {
    setCrystals(prevCrystals => [newCrystal, ...prevCrystals]);
    setShowAddForm(false);
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="homepage-header">
        <h1>Your Crystal Collection</h1>
        {user && (
          <button className="action-button secondary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '＋ Add Crystal'}
          </button>
        )}
      </div>

      {showAddForm && <AddCrystalForm onCrystalAdded={handleCrystalAdded} />}

      <div className="home-grid">
        {crystals.map(crystal => (
          <Link to={`/crystal/${crystal.id}`} key={crystal.id} className="crystal-button">
            <img src={crystal.image} alt={crystal.name} onError={(e) => { e.target.src='https://placehold.co/400x600/1a1a2e/f0f0f0?text=Crystal'; }} />
            <div className="crystal-button-label">{crystal.name}</div>
          </Link>
        ))}
      </div>
    </>
  );
}