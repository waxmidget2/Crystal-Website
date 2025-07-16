// src/hooks/useKonamiCode.js

import { useState, useEffect, useCallback } from 'react';

// The famous Konami Code sequence
const konamiCode = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a'
];

export const useKonamiCode = (callback) => {
  const [keys, setKeys] = useState([]);

  const onKeyDown = useCallback((event) => {
    setKeys((currentKeys) => [...currentKeys, event.key]);
  }, []);

  useEffect(() => {
    if (keys.slice(-konamiCode.length).join('') === konamiCode.join('')) {
      // If the sequence matches, run the callback and reset the keys
      callback();
      setKeys([]);
    }
    // If the sequence is getting long but doesn't match, trim it
    if (keys.length > konamiCode.length) {
        setKeys(keys.slice(1));
    }
  }, [keys, callback]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);
};