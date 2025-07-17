// src/components/ThemeDesigner.jsx

import React from 'react';

const patternOptions = [
  { id: 'cosmic-noise', name: 'Cosmic Noise' },
  { id: 'electric-marble', name: 'Electric Marble' },
  { id: 'crystal-caverns', name: 'Crystal Caverns' },
];

export default function ThemeDesigner({ themeParams, setThemeParams, onSave, onClose, onRandomize }) {
  const handleParamChange = (key, value) => {
    setThemeParams(prev => ({ ...prev, [key]: value }));
  };

  const handleColorChange = (key, value) => {
    setThemeParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="theme-designer-overlay" onClick={onClose}>
      <div className="theme-designer-panel glass-ui" onClick={(e) => e.stopPropagation()}>
        <h2>Pattern Engine</h2>

        <div className="form-group">
          <label>Pattern Style</label>
          <select 
            value={themeParams.pattern} 
            onChange={(e) => handleParamChange('pattern', e.target.value)}
            className="theme-select"
          >
            {patternOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Color Palette</label>
          <div className="theme-color-palette">
            <input type="color" value={themeParams.color1} onChange={(e) => handleColorChange('color1', e.target.value)} />
            <input type="color" value={themeParams.color2} onChange={(e) => handleColorChange('color2', e.target.value)} />
            <input type="color" value={themeParams.color3} onChange={(e) => handleColorChange('color3', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Complexity (Zoom): {themeParams.complexity.toFixed(2)}</label>
          <input type="range" min="1" max="20" step="0.1" value={themeParams.complexity} onChange={(e) => handleParamChange('complexity', parseFloat(e.target.value))} />
        </div>

        <div className="form-group">
          <label>Animation Speed: {themeParams.speed.toFixed(2)}</label>
          <input type="range" min="0" max="10" step="0.1" value={themeParams.speed} onChange={(e) => handleParamChange('speed', parseFloat(e.target.value))} />
        </div>

        <div className="form-group">
          <label>Distortion: {themeParams.distortion.toFixed(2)}</label>
          <input type="range" min="0" max="10" step="0.1" value={themeParams.distortion} onChange={(e) => handleParamChange('distortion', parseFloat(e.target.value))} />
        </div>

        <div className="theme-designer-buttons">
            <button className="action-button secondary" onClick={onSave}>Save</button>
            <button className="action-button" onClick={onRandomize} style={{backgroundColor: 'var(--tertiary-accent)'}}>Randomize</button>
            <button className="action-button primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}