// src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import Loader from '../components/Loader';
import AddCrystalForm from '../components/AddCrystalForm';

export default function HomePage() {
  const [user] = useAuthState(auth);
  const [crystals, setCrystals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Function to fetch all crystals from Firestore
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

  useEffect(() => {
    fetchCrystals();
  }, []);

  // This function is called from the AddCrystalForm after a successful upload
  const handleCrystalAdded = (newCrystal) => {
    setCrystals(prevCrystals => [newCrystal, ...prevCrystals]);
    setShowAddForm(false);
  };

  // --- NEW DELETE FUNCTION ---
  const handleDelete = async (crystalId, imageUrl) => {
    // Confirm before deleting
    if (!window.confirm("Are you sure you want to delete this crystal? This action cannot be undone.")) {
      return;
    }

    try {
      // 1. Delete the image from Firebase Storage
      // Create a reference to the file to delete
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);

      // 2. Delete the document from Firestore
      await deleteDoc(doc(db, "crystals", crystalId));

      // 3. Update the UI state to remove the crystal instantly
      setCrystals(prevCrystals => prevCrystals.filter(crystal => crystal.id !== crystalId));

    } catch (error) {
      console.error("Error deleting crystal: ", error);
      alert("Failed to delete crystal. You may not have the required permissions.");
    }
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
          <div key={crystal.id} className="crystal-button">
            {/* The delete button only shows for logged-in users */}
            {user && (
              <button
                className="delete-button"
                onClick={(e) => {
                  e.preventDefault(); // Prevent navigating to the crystal page
                  handleDelete(crystal.id, crystal.image);
                }}
                title="Delete Crystal"
              >
                &times;
              </button>
            )}
            <Link to={`/crystal/${crystal.id}`} className="crystal-link">
              <img src={crystal.image} alt={crystal.name} onError={(e) => { e.target.src='https://placehold.co/400x600/1a1a2e/f0f0f0?text=Crystal'; }} />
              <div className="crystal-button-label">{crystal.name}</div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}