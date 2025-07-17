// src/pages/JournalPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import Loader from '../components/Loader';
import AddItemForm from '../components/AddItemForm';

export default function JournalPage({ user }) {
  const { journalId } = useParams();
  const [items, setItems] = useState([]);
  const [journalName, setJournalName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false); // This now controls the modal

  useEffect(() => {
    if (user && journalId) {
      const fetchJournalData = async () => {
        setLoading(true);
        const journalRef = doc(db, 'users', user.uid, 'journals', journalId);
        const journalSnap = await getDoc(journalRef);
        if (journalSnap.exists()) {
          setJournalName(journalSnap.data().name);
        }

        const itemsRef = collection(db, 'users', user.uid, 'journals', journalId, 'items');
        const q = query(itemsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const journalItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(journalItems);
        setLoading(false);
      };
      fetchJournalData();
    } else {
      setLoading(false);
    }
  }, [user, journalId]);

  const handleItemAdded = (newItem) => {
    setItems(prev => [newItem, ...prev]);
    setShowAddForm(false); // Close the modal after adding an item
  };

  const handleDelete = async (itemId, imageUrl) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      await deleteDoc(doc(db, 'users', user.uid, 'journals', journalId, 'items', itemId));
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error("Error deleting item: ", error);
      alert("Failed to delete item.");
    }
  };

  if (loading && !journalName) return <Loader text={`Loading Journal...`} />;
  if (!user) return <div className="login-prompt"><h2>Please sign in to view this journal.</h2></div>;

  return (
    <div className="page-content-container">
      <div className="journal-page-header">
        <div className="journal-title-section">
          <h1>{journalName}</h1>
          <Link to="/" className="back-to-journals-link">← Back to All Journals</Link>
        </div>
        <button className="action-button secondary" onClick={() => setShowAddForm(true)}>
          ＋ Add Item
        </button>
      </div>

      {/* The AddItemForm is now wrapped in a modal overlay */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <AddItemForm 
                    journalId={journalId} 
                    onItemAdded={handleItemAdded} 
                    user={user} 
                />
                 <button className="action-button primary" onClick={() => setShowAddForm(false)} style={{marginTop: '10px'}}>
                    Cancel
                </button>
            </div>
        </div>
      )}

      <div className="home-grid">
        {items.map(item => (
          <div key={item.id} className="crystal-button glass-ui">
            <button
              className="delete-button"
              onClick={(e) => { e.preventDefault(); handleDelete(item.id, item.image); }}
              title="Delete Item"
            >&times;</button>
            <Link to={`/journal/${journalId}/item/${item.id}`} className="crystal-link">
              <img src={item.image} alt={item.name} onError={(e) => { e.target.src='https://placehold.co/400x600/1a1a2e/f0f0f0?text=Item'; }} />
              <div className="crystal-button-label">{item.name}</div>
            </Link>
          </div>
        ))}
      </div>
      {items.length === 0 && !showAddForm && <p style={{width: '100%', textAlign: 'center'}}>This journal is empty. Add your first item!</p>}
    </div>
  );
}