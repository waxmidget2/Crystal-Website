// src/pages/SnakeGamePage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, onSnapshot, updateDoc, arrayUnion, deleteDoc, serverTimestamp, setDoc, query, where, Timestamp, writeBatch, getDocs, getDoc } from 'firebase/firestore';
import Loader from '../components/Loader';

// --- Game Constants ---
const GRID_SIZE = 20;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
const TICK_RATE = 120; // ms per game tick

// --- Main Game Component ---
export default function SnakeGamePage({ user }) {
  const [currentGameId, setCurrentGameId] = useState(null);
  const [isSpectator, setIsSpectator] = useState(false);

  const handleExitGame = () => {
    setCurrentGameId(null);
    setIsSpectator(false);
  };

  if (!user) {
    return <div className="login-prompt"><h2>Please sign in to play Competitive Snake!</h2></div>;
  }

  if (!currentGameId) {
    return <GameLobby user={user} onJoinGame={setCurrentGameId} onSpectateGame={(id) => { setCurrentGameId(id); setIsSpectator(true); }} />;
  }

  return <GameCanvas user={user} gameId={currentGameId} isSpectator={isSpectator} onExitGame={handleExitGame} />;
}

// --- Game Lobby Component ---
function GameLobby({ user, onJoinGame, onSpectateGame }) {
  const [waitingGames, setWaitingGames] = useState([]);
  const [activeGames, setActiveGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lobbyRef = collection(db, 'snake-game-lobby');
    const gamesRef = collection(db, 'snake-games');

    const unsubscribeLobby = onSnapshot(lobbyRef, (snapshot) => {
      const availableGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWaitingGames(availableGames);
      setLoading(false);
    });

    const q = query(gamesRef, where("gameState", "in", ["active", "single-player"]));
    const unsubscribeActive = onSnapshot(q, (snapshot) => {
        const spectateGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setActiveGames(spectateGames);
    });

    return () => {
      unsubscribeLobby();
      unsubscribeActive();
    };
  }, []);

  const createGame = async (mode) => {
    setLoading(true);
    const isSinglePlayer = mode === 'single-player';

    const gameData = {
      players: [user.uid],
      playerData: {
        [user.uid]: { name: user.displayName || "Player 1", color: '#8be9fd' }
      },
      gameState: isSinglePlayer ? 'single-player' : 'waiting',
      mode: mode,
      snakes: {
        [user.uid]: {
          body: [{ x: 5, y: 5 }],
          dir: { x: 1, y: 0 },
        }
      },
      food: { x: 15, y: 15 },
      winner: null,
      createdAt: serverTimestamp()
    };

    if (isSinglePlayer) {
      const newGame = await addDoc(collection(db, 'snake-games'), gameData);
      onJoinGame(newGame.id);
    } else {
      const newLobbyGame = await addDoc(collection(db, 'snake-game-lobby'), {
        creatorId: user.uid,
        creatorName: user.displayName || "Player 1",
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, 'snake-games', newLobbyGame.id), gameData);
      onJoinGame(newLobbyGame.id);
    }
  };

  const handleJoinGame = async (game) => {
    const gameRef = doc(db, 'snake-games', game.id);
    await updateDoc(gameRef, {
      players: arrayUnion(user.uid),
      [`playerData.${user.uid}`]: { name: user.displayName || "Player 2", color: '#ff79c6' },
      gameState: 'active',
      [`snakes.${user.uid}`]: { body: [{ x: 24, y: 24 }], dir: { x: -1, y: 0 } }
    });
    await deleteDoc(doc(db, 'snake-game-lobby', game.id));
    onJoinGame(game.id);
  };

  if (loading) return <Loader text="Entering Lobby..." />;

  return (
    <div className="journal-list-container">
      <h1>Competitive Snake</h1>
      <div className="lobby-actions">
        <button onClick={() => createGame('single-player')} className="action-button secondary">Start Single Player</button>
        <button onClick={() => createGame('two-player')} className="action-button primary">Create 2-Player Game</button>
      </div>

      <div className="lobby-section">
        <h2>Join a Game</h2>
        <div className="journal-grid">
          {waitingGames.length > 0 ? waitingGames.map(game => (
            <div key={game.id} className="journal-card glass-ui">
              <h3>{game.creatorName}'s Game</h3>
              <p>Waiting for a challenger...</p>
              <button onClick={() => handleJoinGame(game)} className="action-button primary">Join</button>
            </div>
          )) : <p>No available games to join. Create one!</p>}
        </div>
      </div>

      <div className="lobby-section">
        <h2>Spectate a Game</h2>
        <div className="journal-grid">
          {activeGames.length > 0 ? activeGames.map(game => (
            <div key={game.id} className="journal-card glass-ui">
              <h3>Live Match</h3>
              <p>{Object.values(game.playerData).map(p => p.name).join(' vs ')}</p>
              <button onClick={() => onSpectateGame(game.id)} className="action-button secondary">Watch</button>
            </div>
          )) : <p>No active games to spectate.</p>}
        </div>
      </div>
    </div>
  );
}

// --- Game Canvas and Logic Component ---
function GameCanvas({ user, gameId, isSpectator, onExitGame }) {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);

  // --- INPUT HANDLING (THE FIX) ---
  // This effect now sends the player's direction directly to Firestore.
  useEffect(() => {
    if (isSpectator) return; // Spectators don't send input.

    const handleKeyDown = (e) => {
      const mySnake = gameStateRef.current?.snakes?.[user.uid];
      if (!mySnake) return;

      let newDir = null;
      switch (e.key) {
        case 'ArrowUp': case 'w': if (mySnake.dir.y === 0) newDir = { x: 0, y: -1 }; break;
        case 'ArrowDown': case 's': if (mySnake.dir.y === 0) newDir = { x: 0, y: 1 }; break;
        case 'ArrowLeft': case 'a': if (mySnake.dir.x === 0) newDir = { x: -1, y: 0 }; break;
        case 'ArrowRight': case 'd': if (mySnake.dir.x === 0) newDir = { x: 1, y: 0 }; break;
        default: break;
      }

      // If a valid new direction was chosen, update it in Firestore.
      if (newDir) {
        const gameRef = doc(db, 'snake-games', gameId);
        updateDoc(gameRef, {
          [`snakes.${user.uid}.dir`]: newDir
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user.uid, gameId, isSpectator]);

  // --- GAME LOOP (THE FIX) ---
  // The game loop (which only runs for the host) now reads directions for ALL snakes
  // from the central Firestore state.
  useEffect(() => {
    let gameInterval;
    
    const runGameTick = async () => {
      const gameRef = doc(db, 'snake-games', gameId);
      const gameSnap = await getDoc(gameRef);
      if (!gameSnap.exists()) return;

      const gameState = gameSnap.data();
      const isHost = gameState.players?.[0] === user.uid;

      if ((isHost && gameState.gameState === 'active') || gameState.gameState === 'single-player') {
        if (gameState.winner) return;

        const newSnakes = { ...gameState.snakes };
        let newFood = { ...gameState.food };
        let winner = null;

        const allSnakeSegments = Object.values(newSnakes).flatMap(s => s.body);

        for (const playerId in newSnakes) {
          if (winner) break;
          const snake = newSnakes[playerId];
          const head = { ...snake.body[0] };
          head.x += snake.dir.x;
          head.y += snake.dir.y;

          if (head.x < 0 || head.x >= CANVAS_WIDTH / GRID_SIZE || head.y < 0 || head.y >= CANVAS_HEIGHT / GRID_SIZE) {
            winner = gameState.players.find(p => p !== playerId) || "draw";
          }

          for (const segment of allSnakeSegments) {
            if (head.x === segment.x && head.y === segment.y) {
              winner = gameState.players.find(p => p !== playerId) || "draw";
            }
          }

          snake.body.unshift(head);

          if (head.x === newFood.x && head.y === newFood.y) {
            newFood = { x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)), y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)) };
          } else {
            snake.body.pop();
          }
        }
        
        if (winner) {
          updateDoc(gameRef, { winner, gameState: 'finished' });
        } else {
          updateDoc(gameRef, { snakes: newSnakes, food: newFood });
        }
      }
    };

    gameInterval = setInterval(runGameTick, TICK_RATE);
    return () => clearInterval(gameInterval);
  }, [user.uid, gameId]);


  // --- DRAWING LOOP ---
  // This effect listens for game state changes and draws the canvas for everyone.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const gameRef = doc(db, 'snake-games', gameId);
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (!doc.exists()) {
        alert("Game has ended.");
        onExitGame();
        return;
      }
      
      gameStateRef.current = doc.data();
      const { snakes, food, playerData } = gameStateRef.current;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (food) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      }

      if (snakes) {
        for (const playerId in snakes) {
          const snake = snakes[playerId];
          ctx.fillStyle = playerData[playerId]?.color || '#ffffff';
          snake.body.forEach(segment => {
            ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
          });
        }
      }
    });

    return unsubscribe;
  }, [gameId, onExitGame]);

  const gameData = gameStateRef.current;
  const winnerId = gameData?.winner;
  const winnerData = winnerId && winnerId !== "draw" ? gameData?.playerData[winnerId] : null;

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <h1>Competitive Snake</h1>
      {winnerId ? (
        <h2>{winnerData ? `${winnerData.name} is the WINNER!` : "It's a DRAW!"}</h2>
      ) : (
        <p><strong>{isSpectator ? "You are spectating." : "Controls: WASD or Arrow Keys to Move"}</strong></p>
      )}
      <canvas ref={canvasRef} style={{ borderRadius: '15px', border: '2px solid var(--glass-border)' }} />
      <button onClick={onExitGame} className="action-button primary" style={{marginTop: '20px'}}>Exit Game</button>
    </div>
  );
}
