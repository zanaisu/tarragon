const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 100;

const gameState = {
  players: new Map(),
  boats: new Map(),
  bullets: new Map(),
  islands: generateIslands(),
  weapons: new Map()
};

function generateIslands() {
  const islands = [];
  for (let i = 0; i < 20; i++) {
    islands.push({
      id: uuidv4(),
      x: (Math.random() - 0.5) * 2000,
      z: (Math.random() - 0.5) * 2000,
      radius: 50 + Math.random() * 100,
      height: 20 + Math.random() * 40
    });
  }
  return islands;
}

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  if (gameState.players.size >= MAX_PLAYERS) {
    socket.emit('serverFull');
    socket.disconnect();
    return;
  }

  const player = {
    id: socket.id,
    username: `Player${gameState.players.size + 1}`,
    x: (Math.random() - 0.5) * 1000,
    y: 0,
    z: (Math.random() - 0.5) * 1000,
    rotation: 0,
    health: 100,
    score: 0,
    weapon: 'rifle'
  };

  const boat = {
    id: socket.id,
    x: player.x,
    z: player.z,
    rotation: 0,
    velocity: { x: 0, z: 0 },
    health: 100
  };

  gameState.players.set(socket.id, player);
  gameState.boats.set(socket.id, boat);

  socket.emit('gameInit', {
    playerId: socket.id,
    gameState: {
      players: Array.from(gameState.players.values()),
      boats: Array.from(gameState.boats.values()),
      islands: gameState.islands
    }
  });

  socket.broadcast.emit('playerJoined', { player, boat });

  socket.on('playerMove', (data) => {
    const player = gameState.players.get(socket.id);
    const boat = gameState.boats.get(socket.id);
    
    if (player && boat) {
      boat.x = data.x;
      boat.z = data.z;
      boat.rotation = data.rotation;
      boat.velocity = data.velocity;
      
      player.x = data.x;
      player.z = data.z;
      player.rotation = data.playerRotation;

      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        x: data.x,
        z: data.z,
        rotation: data.rotation,
        playerRotation: data.playerRotation,
        velocity: data.velocity
      });
    }
  });

  socket.on('playerShoot', (data) => {
    const bullet = {
      id: uuidv4(),
      playerId: socket.id,
      x: data.x,
      y: data.y,
      z: data.z,
      direction: data.direction,
      speed: 200,
      damage: 25,
      timestamp: Date.now()
    };

    gameState.bullets.set(bullet.id, bullet);
    io.emit('bulletFired', bullet);

    setTimeout(() => {
      gameState.bullets.delete(bullet.id);
      io.emit('bulletExpired', bullet.id);
    }, 3000);
  });

  socket.on('playerHit', (data) => {
    const targetPlayer = gameState.players.get(data.targetId);
    const targetBoat = gameState.boats.get(data.targetId);
    
    if (targetPlayer && targetBoat) {
      targetPlayer.health -= data.damage;
      targetBoat.health -= data.damage;

      if (targetPlayer.health <= 0) {
        const shooter = gameState.players.get(socket.id);
        if (shooter) {
          shooter.score += 1;
        }

        targetPlayer.health = 100;
        targetBoat.health = 100;
        targetPlayer.x = (Math.random() - 0.5) * 1000;
        targetPlayer.z = (Math.random() - 0.5) * 1000;
        targetBoat.x = targetPlayer.x;
        targetBoat.z = targetPlayer.z;

        io.emit('playerKilled', {
          victim: data.targetId,
          killer: socket.id,
          newPosition: { x: targetPlayer.x, z: targetPlayer.z }
        });
      } else {
        io.emit('playerDamaged', {
          playerId: data.targetId,
          health: targetPlayer.health,
          boatHealth: targetBoat.health
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    gameState.players.delete(socket.id);
    gameState.boats.delete(socket.id);
    socket.broadcast.emit('playerLeft', socket.id);
  });
});

setInterval(() => {
  const bullets = Array.from(gameState.bullets.values());
  bullets.forEach(bullet => {
    bullet.x += bullet.direction.x * bullet.speed * 0.016;
    bullet.y += bullet.direction.y * bullet.speed * 0.016;
    bullet.z += bullet.direction.z * bullet.speed * 0.016;
  });
  
  if (bullets.length > 0) {
    io.emit('bulletsUpdate', bullets);
  }
}, 16);

server.listen(PORT, () => {
  console.log(`Boat Battle FPS Server running on port ${PORT}`);
  console.log(`Max players: ${MAX_PLAYERS}`);
});