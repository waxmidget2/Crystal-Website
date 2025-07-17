// src/components/TankGame.jsx

import React, { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const TANK_SIZE = 20;
const BULLET_SPEED = 5;
const TANK_SPEED = 2;
const ROTATION_SPEED = 0.05;

const gameRef = doc(db, 'global', 'tankGame');

export default function TankGame({ user }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [isPlayer, setIsPlayer] = useState(false);
  const [playerNumber, setPlayerNumber] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // This key state reference is used to avoid stale state in the game loop
  const keyStateRef = useRef({});

  // Listen for real-time game state changes from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGameState(data);
        if (user) {
          if (data.player1?.id === user.uid) {
            setIsPlayer(true);
            setPlayerNumber(1);
          } else if (data.player2?.id === user.uid) {
            setIsPlayer(true);
            setPlayerNumber(2);
          } else {
            setIsPlayer(false);
            setPlayerNumber(null);
          }
        }
      } else {
        initializeGame();
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Main game loop for drawing on the canvas
  useEffect(() => {
    if (!gameState || !canvasRef.current || !isOpen) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState.player1) drawTank(ctx, gameState.player1, '#8be9fd');
    if (gameState.player2) drawTank(ctx, gameState.player2, '#ff79c6');
    gameState.bullets?.forEach(bullet => drawBullet(ctx, bullet));
  }, [gameState, isOpen]);

  // Keyboard controls for players
  useEffect(() => {
    if (!isPlayer || !isOpen) return;

    const handleKeyDown = (e) => {
      const control = getControlFromKey(e.key);
      if (control) {
        keyStateRef.current[control] = true;
        // Handle firing immediately on key down
        if (control === 'fire') {
          fireBullet();
          keyStateRef.current.fire = false; // Prevent continuous fire
        }
      }
    };
    const handleKeyUp = (e) => {
      const control = getControlFromKey(e.key);
      if (control) {
        keyStateRef.current[control] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlayer, playerNumber, isOpen]);

  // Game logic update loop
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      // Each player is responsible for updating their own position
      if (isPlayer) {
        updateMyPlayerPosition();
      }
      // Player 1 is designated as the "host" and is responsible for bullet physics
      if (playerNumber === 1 && gameState?.status === 'active') {
        updateBulletPositions();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isPlayer, playerNumber, isOpen, gameState]);

  // --- Helper Functions ---

  const drawTank = (ctx, player, color) => {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = color;
    ctx.fillRect(-TANK_SIZE / 2, -TANK_SIZE / 2, TANK_SIZE, TANK_SIZE);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, -4, 4, -TANK_SIZE / 2);
    ctx.restore();
  };

  const drawBullet = (ctx, bullet) => {
    ctx.fillStyle = '#f1fa8c';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 3, 0, 2 * Math.PI);
    ctx.fill();
  };
  
  const initializeGame = async () => {
    await setDoc(gameRef, {
        status: 'waiting', player1: null, player2: null, bullets: [],
    });
  };

  const joinGame = async () => {
    if (!user) return alert('You must be signed in to play!');
    const docSnap = await getDoc(gameRef);
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    const newPlayer = { id: user.uid, x: 50, y: 150, angle: 0, score: 0 };
    let updatePayload = {};
    if (!data.player1) {
      updatePayload.player1 = newPlayer;
    } else if (!data.player2 && data.player1.id !== user.uid) {
      newPlayer.x = 350;
      updatePayload.player2 = newPlayer;
      updatePayload.status = 'active';
    } else {
      alert("Game is full or you are already in it!");
      return;
    }
    await updateDoc(gameRef, updatePayload);
  };
  
  const resetGame = async () => {
    if (window.confirm("Are you sure you want to reset the game for everyone?")) {
        initializeGame();
    }
  };

  const getControlFromKey = (key) => {
    switch (key) {
      case 'w': case 'ArrowUp': return 'forward';
      case 's': case 'ArrowDown': return 'backward';
      case 'a': case 'ArrowLeft': return 'left';
      case 'd': case 'ArrowRight': return 'right';
      case ' ': return 'fire';
      default: return null;
    }
  };

  // --- REFACTORED GAME LOGIC ---

  const updateMyPlayerPosition = async () => {
    const docSnap = await getDoc(gameRef);
    if (!docSnap.exists() || !docSnap.data()[`player${playerNumber}`]) return;
    
    const me = { ...docSnap.data()[`player${playerNumber}`] };
    let hasChanged = false;

    if (keyStateRef.current.forward) {
        me.x += Math.sin(me.angle) * TANK_SPEED;
        me.y -= Math.cos(me.angle) * TANK_SPEED;
        hasChanged = true;
    }
    if (keyStateRef.current.backward) {
        me.x -= Math.sin(me.angle) * TANK_SPEED;
        me.y += Math.cos(me.angle) * TANK_SPEED;
        hasChanged = true;
    }
    if (keyStateRef.current.left) {
        me.angle -= ROTATION_SPEED;
        hasChanged = true;
    }
    if (keyStateRef.current.right) {
        me.angle += ROTATION_SPEED;
        hasChanged = true;
    }

    if (hasChanged) {
        const update = {};
        update[`player${playerNumber}`] = me;
        await updateDoc(gameRef, update);
    }
  };

  const fireBullet = async () => {
    const docSnap = await getDoc(gameRef);
    if (!docSnap.exists() || !docSnap.data()[`player${playerNumber}`]) return;
    
    const me = docSnap.data()[`player${playerNumber}`];
    const currentBullets = docSnap.data().bullets || [];

    const newBullet = {
      x: me.x,
      y: me.y,
      angle: me.angle,
      owner: playerNumber
    };

    await updateDoc(gameRef, {
      bullets: [...currentBullets, newBullet]
    });
  };

  const updateBulletPositions = async () => {
    const docSnap = await getDoc(gameRef);
    if (!docSnap.exists()) return;

    let bullets = docSnap.data().bullets || [];
    if (bullets.length === 0) return;

    bullets = bullets.map(b => ({
        ...b,
        x: b.x + Math.sin(b.angle) * BULLET_SPEED,
        y: b.y - Math.cos(b.angle) * BULLET_SPEED,
    })).filter(b => b.x > 0 && b.x < 400 && b.y > 0 && b.y < 300);

    await updateDoc(gameRef, { bullets: bullets });
  };


  if (!gameState) {
    return null; 
  }

  return (
    <div className="game-wrapper">
      <div className={`tank-game-container glass-ui ${isOpen ? 'open' : 'closed'}`}>
        <canvas ref={canvasRef} width="400" height="300" className="tank-game-canvas"></canvas>
        <div className="tank-game-controls">
          {gameState.status === 'waiting' && <button className="action-button secondary" onClick={joinGame}>Join Game</button>}
          {gameState.status === 'active' && !isPlayer && <p>Spectating Game</p>}
          {gameState.status === 'active' && isPlayer && <p>You are Player {playerNumber}! (WASD/Arrows + Space)</p>}
          <button className="action-button primary" onClick={resetGame} style={{marginLeft: '10px'}}>Reset</button>
        </div>
      </div>

      <button className="game-opener-button" onClick={() => setIsOpen(!isOpen)} title="Toggle Game">
        {isOpen ? '↘️' : '↖️'}
      </button>
    </div>
  );
}