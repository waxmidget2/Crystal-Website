// src/components/ThemeDesigner.jsx

import React from 'react';

const themeOptions = [
  { name: 'Background', variable: '--bg-color', key: 'bgColor' },
  { name: 'Primary Accent', variable: '--primary-accent', key: 'primaryAccent' },
  { name: 'Secondary Accent', variable: '--secondary-accent', key: 'secondaryAccent' },
  { name: 'Text Color', variable: '--font-color', key: 'fontColor' },
  { name: 'Muted Text', variable: '--font-color-muted', key: 'fontColorMuted' },
];

export default function ThemeDesigner({ theme, setTheme, onSave, onClose }) {
  const handleColorChange = (key, value) => {
    setTheme(prevTheme => ({ ...prevTheme, [key]: value }));
  };

  return (
    <div className="theme-designer-overlay" onClick={onClose}>
      <div className="theme-designer-panel glass-ui" onClick={(e) => e.stopPropagation()}>
        <h2>Theme Designer</h2>
        {themeOptions.map(option => (
          <div key={option.key} className="theme-color-picker">
            <label htmlFor={option.key}>{option.name}</label>
            <input
              type="color"
              id={option.key}
              value={theme[option.key]}
              onChange={(e) => handleColorChange(option.key, e.target.value)}
            />
          </div>
        ))}
        <div className="theme-designer-buttons">
            <button className="action-button secondary" onClick={onSave}>Save Theme</button>
            <button className="action-button primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}