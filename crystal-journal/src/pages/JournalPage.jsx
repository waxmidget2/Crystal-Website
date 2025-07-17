// src/pages/JournalPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import Loader from '../components/Loader';
import AddItemForm from '../components/AddItemForm'; // Renamed for clarity

export default function JournalPage({ user }) {
  const { journalId } = useParams();
  const [items, setItems] = useState([]);
  const [journalName, setJournalName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (user && journalId) {
      const fetchJournalData = async () => {
        // Fetch journal name
        const journalRef = doc(db, 'users', user.uid, 'journals', journalId);
        const journalSnap = await getDoc(journalRef);
        if (journalSnap.exists()) {
          setJournalName(journalSnap.data().name);
        }

        // Fetch items in the journal
        const itemsRef = collection(db, 'users', user.uid, 'journals', journalId, 'items');
        const q = query(itemsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const journalItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(journalItems);
        setLoading(false);
      };
      fetchJournalData();
    }
  }, [user, journalId]);

  const handleItemAdded = (newItem) => {
    setItems(prev => [newItem, ...prev]);
    setShowAddForm(false);
  };

  const handleDelete = async (itemId, imageUrl) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      // Delete image from Storage
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      // Delete item doc from Firestore
      await deleteDoc(doc(db, 'users', user.uid, 'journals', journalId, 'items', itemId));
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error("Error deleting item: ", error);
      alert("Failed to delete item.");
    }
  };

  if (loading) return <Loader text={`Loading ${journalName || 'Journal'}...`} />;

  return (
    <>
      <div className="homepage-header">
        <h1>{journalName}</h1>
        <button className="action-button secondary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '＋ Add Item'}
        </button>
      </div>
      
      <Link to="/" className="back-to-journals-link">← Back to All Journals</Link>

      {showAddForm && <AddItemForm journalId={journalId} onItemAdded={handleItemAdded} user={user} />}

      <div className="home-grid">
        {items.map(item => {
          // --- NEW: Secret item easter egg ---
          const isSecretItem = item.name.toLowerCase() === 'the tom-foolery';
          const displayName = isSecretItem ? 'A Mysterious Item' : item.name;
          const displayImage = isSecretItem ? 'https://placehold.co/400x600/2c2a4a/ff79c6?text=???' : item.image;

          return (
            <div key={item.id} className="crystal-button glass-ui">
              <button
                className="delete-button"
                onClick={(e) => { e.preventDefault(); handleDelete(item.id, item.image); }}
                title="Delete Item"
              >&times;</button>
              <Link to={`/journal/${journalId}/item/${item.id}`} className="crystal-link">
                <img src={displayImage} alt={displayName} onError={(e) => { e.target.src='https://placehold.co/400x600/1a1a2e/f0f0f0?text=Item'; }} />
                <div className="crystal-button-label">{displayName}</div>
              </Link>
            </div>
          );
        })}
        {items.length === 0 && !showAddForm && <p>This journal is empty. Add your first item!</p>}
      </div>
    </>
  );
}