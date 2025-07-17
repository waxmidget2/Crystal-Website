// src/pages/SnakeGamePage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
// Import Timestamp for time-based queries
import { collection, addDoc, doc, onSnapshot, updateDoc, arrayUnion, deleteDoc, serverTimestamp, setDoc, query, where, Timestamp, writeBatch } from 'firebase/firestore';
import Loader from '../components/Loader';

// --- Game Constants ---
const GRID_SIZE = 20;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
const TICK_RATE = 120; // ms per game tick

// --- Main Game Component ---
export default function SnakeGamePage({ user }) {
  const [currentGameId, setCurrentGameId] = useState(null);

  if (!user) {
    return <div className="login-prompt"><h2>Please sign in to play Competitive Snake!</h2></div>;
  }

  if (!currentGameId) {
    return <GameLobby user={user} onJoinGame={setCurrentGameId} />;
  }

  return <GameCanvas user={user} gameId={currentGameId} onExitGame={() => setCurrentGameId(null)} />;
}

// --- Game Lobby Component ---
function GameLobby({ user, onJoinGame }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lobbyRef = collection(db, 'snake-game-lobby');

    // --- NEW: Function to clean up stale games ---
    const cleanupOldGames = async () => {
      console.log("Checking for stale games...");
      // Calculate the timestamp for 10 minutes ago
      const tenMinutesAgo = Timestamp.fromMillis(Date.now() - 10 * 60 * 1000);
      
      // Create a query for games older than 10 minutes
      const oldGamesQuery = query(lobbyRef, where("createdAt", "<", tenMinutesAgo));
      
      const oldGamesSnapshot = await getDocs(oldGamesQuery);
      if (oldGamesSnapshot.empty) {
        console.log("No stale games found.");
        return;
      }

      // Use a batch to delete all stale games in one operation
      const batch = writeBatch(db);
      oldGamesSnapshot.forEach(doc => {
        console.log(`Deleting stale game: ${doc.id}`);
        batch.delete(doc.ref);
      });
      await batch.commit();
    };
    
    // Run the cleanup when the lobby loads
    cleanupOldGames();

    // Set up the real-time listener for active games
    const unsubscribe = onSnapshot(lobbyRef, (snapshot) => {
      const availableGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGames(availableGames);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleCreateGame = async () => {
    setLoading(true);
    const lobbyRef = collection(db, 'snake-game-lobby');
    const newLobbyGame = await addDoc(lobbyRef, {
      creatorId: user.uid,
      creatorName: user.displayName || "Player 1",
      createdAt: serverTimestamp()
    });
    
    const gameRef = doc(db, 'snake-games', newLobbyGame.id);
    await setDoc(gameRef, {
      players: [user.uid],
      playerData: {
        [user.uid]: { name: user.displayName || "Player 1", color: '#8be9fd' }
      },
      gameState: 'waiting',
      snakes: {
        [user.uid]: {
          body: [{ x: 5, y: 5 }],
          dir: { x: 1, y: 0 },
        }
      },
      food: { x: 15, y: 15 },
      winner: null,
    });
    
    onJoinGame(newLobbyGame.id);
  };

  const handleJoinGame = async (game) => {
    const gameRef = doc(db, 'snake-games', game.id);
    await updateDoc(gameRef, {
      players: arrayUnion(user.uid),
      [`playerData.${user.uid}`]: { name: user.displayName || "Player 2", color: '#ff79c6' },
      gameState: 'active',
      [`snakes.${user.uid}`]: {
        body: [{ x: 24, y: 24 }],
        dir: { x: -1, y: 0 },
      }
    });
    
    await deleteDoc(doc(db, 'snake-game-lobby', game.id));
    onJoinGame(game.id);
  };

  if (loading) return <Loader text="Entering Lobby..." />;

  return (
    <div className="journal-list-container">
      <h1>Competitive Snake</h1>
      <button onClick={handleCreateGame} className="action-button secondary">Create New Game</button>
      <div className="journal-grid" style={{marginTop: '20px'}}>
        {games.length > 0 ? games.map(game => (
          <div key={game.id} className="journal-card glass-ui">
            <h2>{game.creatorName}'s Game</h2>
            <p>Waiting for a challenger...</p>
            <button onClick={() => handleJoinGame(game)} className="action-button primary">Join Game</button>
          </div>
        )) : <p>No available games. Create one!</p>}
      </div>
    </div>
  );
}

// --- Game Canvas and Logic Component (No changes needed here) ---
function GameCanvas({ user, gameId, onExitGame }) {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const playerDirectionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const mySnake = gameStateRef.current?.snakes?.[user.uid];
      if (!mySnake) return;

      let newDir = { ...playerDirectionRef.current };
      switch (e.key) {
        case 'ArrowUp': case 'w': if (mySnake.dir.y === 0) newDir = { x: 0, y: -1 }; break;
        case 'ArrowDown': case 's': if (mySnake.dir.y === 0) newDir = { x: 0, y: 1 }; break;
        case 'ArrowLeft': case 'a': if (mySnake.dir.x === 0) newDir = { x: -1, y: 0 }; break;
        case 'ArrowRight': case 'd': if (mySnake.dir.x === 0) newDir = { x: 1, y: 0 }; break;
        default: break;
      }
      playerDirectionRef.current = newDir;
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user.uid]);

  useEffect(() => {
    let gameInterval;
    const isHost = gameStateRef.current?.players?.[0] === user.uid;

    if (isHost) {
      gameInterval = setInterval(() => {
        const gameState = gameStateRef.current;
        if (!gameState || gameState.gameState !== 'active' || gameState.winner) return;

        const gameRef = doc(db, 'snake-games', gameId);
        const newSnakes = { ...gameState.snakes };
        let newFood = { ...gameState.food };
        let winner = null;

        newSnakes[user.uid].dir = playerDirectionRef.current;
        
        const allSnakeSegments = [];
        Object.values(newSnakes).forEach(s => allSnakeSegments.push(...s.body));

        for (const playerId in newSnakes) {
          const snake = newSnakes[playerId];
          const head = { ...snake.body[0] };
          head.x += snake.dir.x;
          head.y += snake.dir.y;

          if (head.x < 0 || head.x >= CANVAS_WIDTH / GRID_SIZE || head.y < 0 || head.y >= CANVAS_HEIGHT / GRID_SIZE) {
            winner = gameState.players.find(p => p !== playerId);
          }

          for (const segment of allSnakeSegments) {
            if (head.x === segment.x && head.y === segment.y) {
              winner = gameState.players.find(p => p !== playerId);
            }
          }

          snake.body.unshift(head);

          if (head.x === newFood.x && head.y === newFood.y) {
            newFood = {
              x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
              y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
            };
          } else {
            snake.body.pop();
          }
        }
        
        updateDoc(gameRef, { snakes: newSnakes, food: newFood, winner });

      }, TICK_RATE);
    }

    return () => clearInterval(gameInterval);
  }, [user.uid, gameId]);


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
      
      if (snakes?.[user.uid] && playerDirectionRef.current.x === 0 && playerDirectionRef.current.y === 0) {
          playerDirectionRef.current = snakes[user.uid].dir;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'yellow';
      ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

      for (const playerId in snakes) {
        const snake = snakes[playerId];
        ctx.fillStyle = playerData[playerId].color;
        snake.body.forEach(segment => {
          ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
        });
      }
    });

    return unsubscribe;
  }, [gameId, user.uid, onExitGame]);

  const gameData = gameStateRef.current;
  const winnerId = gameData?.winner;
  const winnerData = winnerId ? gameData?.playerData[winnerId] : null;

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <h1>Competitive Snake</h1>
      {winnerData ? (
        <h2>{winnerData.name} is the WINNER!</h2>
      ) : (
        <p><strong>Controls:</strong> WASD or Arrow Keys to Move</p>
      )}
      <canvas ref={canvasRef} style={{ borderRadius: '15px', border: '2px solid var(--glass-border)' }} />
      <button onClick={onExitGame} className="action-button primary" style={{marginTop: '20px'}}>Exit Game</button>
    </div>
  );
}
