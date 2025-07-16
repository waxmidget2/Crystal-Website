import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import Loader from './Loader';

export default function AddCrystalForm({ onCrystalAdded }) {
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
      // 1. Upload image to Firebase Storage
      const imageName = `${Date.now()}-${imageFile.name}`;
      const storageRef = ref(storage, `crystal-images/${imageName}`);
      await uploadBytes(storageRef, imageFile);
      
      // 2. Get the public URL of the uploaded image
      const imageUrl = await getDownloadURL(storageRef);

      // 3. Create a new document in Firestore
      const crystalId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const crystalRef = doc(db, 'crystals', crystalId);
      
      const newCrystalData = {
        name,
        summary,
        color,
        image: imageUrl,
        createdAt: serverTimestamp()
      };
      
      await setDoc(crystalRef, newCrystalData);
      
      // 4. Reset form and notify parent component
      onCrystalAdded({ id: crystalId, ...newCrystalData });

    } catch (err) {
      console.error("Error adding crystal:", err);
      setError('Failed to add crystal. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader text="Uploading your crystal..." />;
  }

  return (
    <form onSubmit={handleSubmit} className="add-crystal-form glass-ui">
      <h2 className="form-title">Add a New Crystal</h2>
      <div className="form-group">
        <label htmlFor="crystal-name">Crystal Name</label>
        <input id="crystal-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="crystal-summary">Summary</label>
        <textarea id="crystal-summary" value={summary} onChange={e => setSummary(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="crystal-color">Theme Color</label>
        <input id="crystal-color" type="color" value={color} onChange={e => setColor(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="crystal-image">Image</label>
        <input id="crystal-image" type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} required />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="action-button secondary" disabled={isLoading}>
        Add Crystal
      </button>
    </form>
  );
}