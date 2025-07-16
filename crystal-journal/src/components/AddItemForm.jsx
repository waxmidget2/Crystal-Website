// src/components/AddItemForm.jsx

import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import Loader from './Loader';
export default function AddItemForm({ journalId, onItemAdded, user }) {
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !summary || !imageFile) {
      setError('Please fill out all fields and select an image.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      // 1. Upload image to the correct user/journal folder
      const imageName = `${Date.now()}-${imageFile.name}`;
      const storageRef = ref(storage, `users/${user.uid}/${journalId}/${imageName}`);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      // 2. Create new item document in the correct sub-collection
      const itemsRef = collection(db, 'users', user.uid, 'journals', journalId, 'items');
      const newItemRef = doc(itemsRef); // Auto-generate ID
      
      const newItemData = {
        id: newItemRef.id,
        name,
        summary,
        color,
        image: imageUrl,
        createdAt: serverTimestamp()
      };
      
      await setDoc(newItemRef, newItemData);
      
      on-item-added(newItemData);

    } catch (err) {
      console.error("Error adding item:", err);
      setError('Failed to add item. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader text="Uploading your item..." />;

  return (
    <form onSubmit={handleSubmit} className="add-crystal-form glass-ui">
      <h2 className="form-title">Add a New Item</h2>
      <div className="form-group">
        <label htmlFor="item-name">Item Name</label>
        <input id="item-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="item-summary">Summary</label>
        <textarea id="item-summary" value={summary} onChange={e => setSummary(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="item-color">Theme Color</label>
        <input id="item-color" type="color" value={color} onChange={e => setColor(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="item-image">Image</label>
        <input id="item-image" type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} required />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="action-button secondary" disabled={isLoading}>Add Item</button>
    </form>
  );
}