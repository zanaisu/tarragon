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
const TICK_RATE = 60; // Server update rate
const MS_PER_TICK = 1000 / TICK_RATE;

// Advanced game state
const gameState = {
  players: new Map(),
  boats: new Map(),
  projectiles: new Map(),
  powerUps: new Map(),
  islands: [],
  gameStats: {
    totalKills: 0,
    totalDeaths: 0,
    gameStartTime: Date.now(),
    playersJoined: 0
  },
  weather: {
    type: 'clear', // clear, rain, storm, fog
    intensity: 0,
    windDirection: { x: 1, y: 0, z: 0.5 },
    windStrength: 0.3
  },
  timeOfDay: 0.5 // 0 = midnight, 0.5 = noon
};

// Anti-cheat system
const antiCheat = {
  playerPositions: new Map(),
  shotCooldowns: new Map(),
  speedChecks: new Map(),
  damageValidation: new Map()
};

// Rate limiting
const rateLimits = {
  movement: new Map(),
  shooting: new Map(),
  chat: new Map()
};

function generateAdvancedIslands() {
  const islands = [];
  const islandCount = 25;
  
  for (let i = 0; i < islandCount; i++) {
    const island = {
      id: uuidv4(),
      x: (Math.random() - 0.5) * 4000,
      z: (Math.random() - 0.5) * 4000,
      radius: 40 + Math.random() * 120,
      height: 15 + Math.random() * 50,
      type: Math.random() > 0.7 ? 'rocky' : 'tropical',
      powerUps: []
    };
    
    // Add power-ups to larger islands
    if (island.radius > 80) {
      const powerUpCount = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < powerUpCount; j++) {
        const powerUp = {
          id: uuidv4(),
          type: ['health', 'armor', 'ammo', 'weapon'][Math.floor(Math.random() * 4)],
          x: island.x + (Math.random() - 0.5) * (island.radius - 10),
          z: island.z + (Math.random() - 0.5) * (island.radius - 10),
          y: island.height + 2,
          respawnTime: 30000, // 30 seconds
          lastTaken: 0
        };
        island.powerUps.push(powerUp);
        gameState.powerUps.set(powerUp.id, powerUp);
      }
    }
    
    islands.push(island);
  }
  
  return islands;
}

function validatePlayerPosition(playerId, newPosition, oldPosition, deltaTime) {
  if (!oldPosition) return true;
  
  const distance = Math.sqrt(
    Math.pow(newPosition.x - oldPosition.x, 2) +
    Math.pow(newPosition.z - oldPosition.z, 2)
  );
  
  const maxSpeed = 35; // m/s (generous for boats)
  const maxDistance = maxSpeed * deltaTime;
  
  if (distance > maxDistance) {
    console.log(`[ANTI-CHEAT] Player ${playerId} moved too fast: ${distance}m in ${deltaTime}s`);
    return false;
  }
  
  return true;
}

function validateShot(playerId, weaponType) {
  const now = Date.now();
  const lastShot = antiCheat.shotCooldowns.get(playerId) || 0;
  
  // Weapon fire rates (shots per minute)
  const fireRates = {
    'rifle': 600,
    'pistol': 300,
    'shotgun': 120,
    'sniper': 40,
    'smg': 800,
    'lmg': 500
  };
  
  const fireRate = fireRates[weaponType] || 600;
  const minInterval = (60 / fireRate) * 1000; // Convert to milliseconds
  
  if (now - lastShot < minInterval * 0.8) { // Allow 20% tolerance
    console.log(`[ANTI-CHEAT] Player ${playerId} firing too fast with ${weaponType}`);
    return false;
  }
  
  antiCheat.shotCooldowns.set(playerId, now);
  return true;
}

function checkRateLimit(type, playerId, limit = 10, window = 1000) {
  const now = Date.now();
  
  if (!rateLimits[type].has(playerId)) {
    rateLimits[type].set(playerId, []);
  }
  
  const timestamps = rateLimits[type].get(playerId);
  
  // Remove old timestamps
  while (timestamps.length > 0 && now - timestamps[0] > window) {
    timestamps.shift();
  }
  
  if (timestamps.length >= limit) {
    return false;
  }
  
  timestamps.push(now);
  return true;
}

function calculateDamage(weapon, distance, targetArmor) {
  const weapons = {
    'rifle': { damage: 35, range: 800, falloff: 0.3 },
    'pistol': { damage: 65, range: 400, falloff: 0.4 },
    'shotgun': { damage: 25, range: 200, falloff: 0.6, pellets: 8 },
    'sniper': { damage: 150, range: 2000, falloff: 0.1 },
    'smg': { damage: 28, range: 300, falloff: 0.5 },
    'lmg': { damage: 45, range: 1000, falloff: 0.2 }
  };
  
  const weaponData = weapons[weapon] || weapons['rifle'];
  let damage = weaponData.damage;
  
  // Apply distance falloff
  if (distance > weaponData.range * 0.3) {
    const falloffFactor = 1 - ((distance - weaponData.range * 0.3) / (weaponData.range * 0.7));
    damage *= Math.max(0.2, falloffFactor);
  }
  
  // Apply armor reduction
  if (targetArmor > 0) {
    const armorReduction = Math.min(targetArmor, damage * 0.7);
    damage -= armorReduction;
  }
  
  return Math.round(damage);
}

function updateGameWorld() {
  // Update time of day
  gameState.timeOfDay += 0.001; // Slow progression
  if (gameState.timeOfDay > 1) gameState.timeOfDay = 0;
  
  // Update weather
  if (Math.random() < 0.001) { // 0.1% chance per tick to change weather
    const weatherTypes = ['clear', 'rain', 'storm', 'fog'];
    gameState.weather.type = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    gameState.weather.intensity = Math.random();
  }
  
  // Update projectiles
  const now = Date.now();
  for (const [id, projectile] of gameState.projectiles) {
    projectile.age += MS_PER_TICK;
    
    // Update position
    projectile.x += projectile.vx * (MS_PER_TICK / 1000);
    projectile.y += projectile.vy * (MS_PER_TICK / 1000);
    projectile.z += projectile.vz * (MS_PER_TICK / 1000);
    
    // Apply gravity
    projectile.vy -= 9.81 * (MS_PER_TICK / 1000);
    
    // Check for collisions or expiry
    if (projectile.age > 5000 || projectile.y < 0) {
      gameState.projectiles.delete(id);
      io.emit('projectileExpired', id);
    }
  }
  
  // Respawn power-ups
  for (const [id, powerUp] of gameState.powerUps) {
    if (powerUp.taken && now - powerUp.lastTaken > powerUp.respawnTime) {
      powerUp.taken = false;
      io.emit('powerUpRespawned', { id: id, type: powerUp.type, position: { x: powerUp.x, y: powerUp.y, z: powerUp.z } });
    }
  }
}

// Initialize islands after gameState is defined
gameState.islands = generateAdvancedIslands();

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Player connected: ${socket.id}`);
  
  // Check server capacity
  if (gameState.players.size >= MAX_PLAYERS) {
    socket.emit('serverFull', { message: 'Server is full. Please try again later.' });
    socket.disconnect();
    return;
  }
  
  // Initialize player
  const player = {
    id: socket.id,
    username: `Player${gameState.players.size + 1}`,
    x: (Math.random() - 0.5) * 1000,
    y: 2,
    z: (Math.random() - 0.5) * 1000,
    rotation: 0,
    health: 100,
    maxHealth: 100,
    armor: 0,
    maxArmor: 100,
    score: 0,
    kills: 0,
    deaths: 0,
    weapon: 'rifle',
    onFoot: false,
    lastUpdate: Date.now(),
    joinTime: Date.now()
  };
  
  const boat = {
    id: socket.id,
    x: player.x,
    z: player.z,
    rotation: 0,
    velocity: { x: 0, z: 0 },
    health: 100,
    maxHealth: 100
  };
  
  gameState.players.set(socket.id, player);
  gameState.boats.set(socket.id, boat);
  gameState.gameStats.playersJoined++;
  
  // Initialize anti-cheat tracking
  antiCheat.playerPositions.set(socket.id, { x: player.x, z: player.z, timestamp: Date.now() });
  antiCheat.shotCooldowns.set(socket.id, 0);
  
  // Send initial game state
  socket.emit('gameInit', {
    playerId: socket.id,
    gameState: {
      players: Array.from(gameState.players.values()),
      boats: Array.from(gameState.boats.values()),
      islands: gameState.islands,
      powerUps: Array.from(gameState.powerUps.values()).filter(p => !p.taken),
      weather: gameState.weather,
      timeOfDay: gameState.timeOfDay
    }
  });
  
  // Notify other players
  socket.broadcast.emit('playerJoined', { 
    player: player, 
    boat: boat 
  });
  
  // Player movement
  socket.on('playerMove', (data) => {
    if (!checkRateLimit('movement', socket.id, 30, 1000)) {
      return; // Rate limited
    }
    
    const player = gameState.players.get(socket.id);
    const boat = gameState.boats.get(socket.id);
    
    if (!player || !boat) return;
    
    const now = Date.now();
    const deltaTime = (now - player.lastUpdate) / 1000;
    
    // Validate position change
    const oldPosition = antiCheat.playerPositions.get(socket.id);
    const newPosition = { x: data.x, z: data.z };
    
    if (!validatePlayerPosition(socket.id, newPosition, oldPosition, deltaTime)) {
      // Reject the movement
      socket.emit('positionCorrection', { x: oldPosition.x, z: oldPosition.z });
      return;
    }
    
    // Update positions
    boat.x = data.x;
    boat.z = data.z;
    boat.rotation = data.rotation;
    boat.velocity = data.velocity || { x: 0, z: 0 };
    
    player.x = data.x;
    player.z = data.z;
    player.rotation = data.playerRotation || data.rotation;
    player.lastUpdate = now;
    
    antiCheat.playerPositions.set(socket.id, {
      x: data.x,
      z: data.z,
      timestamp: now
    });
    
    // Broadcast to other players
    socket.broadcast.emit('playerMoved', {
      id: socket.id,
      x: data.x,
      z: data.z,
      rotation: data.rotation,
      playerRotation: data.playerRotation,
      velocity: data.velocity
    });
  });
  
  // Player shooting
  socket.on('playerShoot', (data) => {
    if (!checkRateLimit('shooting', socket.id, 20, 1000)) {
      return; // Rate limited
    }
    
    const player = gameState.players.get(socket.id);
    if (!player) return;
    
    const weaponType = data.weapon || player.weapon;
    
    // Validate shot timing
    if (!validateShot(socket.id, weaponType)) {
      return;
    }
    
    // Create projectiles
    if (data.projectiles && Array.isArray(data.projectiles)) {
      data.projectiles.forEach((projData, index) => {
        const projectile = {
          id: uuidv4(),
          playerId: socket.id,
          weapon: weaponType,
          x: projData.origin[0],
          y: projData.origin[1],
          z: projData.origin[2],
          vx: projData.direction[0] * 800, // Base projectile speed
          vy: projData.direction[1] * 800,
          vz: projData.direction[2] * 800,
          damage: projData.damage,
          age: 0,
          timestamp: Date.now()
        };
        
        gameState.projectiles.set(projectile.id, projectile);
      });
    }
    
    // Broadcast shot to other players
    socket.broadcast.emit('playerShot', {
      playerId: socket.id,
      weapon: weaponType,
      position: data.projectiles ? data.projectiles[0].origin : [player.x, player.y, player.z],
      direction: data.projectiles ? data.projectiles[0].direction : [0, 0, -1]
    });
  });
  
  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] Player disconnected: ${socket.id}`);
    
    gameState.players.delete(socket.id);
    gameState.boats.delete(socket.id);
    antiCheat.playerPositions.delete(socket.id);
    antiCheat.shotCooldowns.delete(socket.id);
    
    // Clean up rate limits
    Object.values(rateLimits).forEach(map => map.delete(socket.id));
    
    socket.broadcast.emit('playerLeft', socket.id);
  });
});

// Game loop
setInterval(() => {
  updateGameWorld();
  
  // Send periodic updates
  const gameUpdate = {
    projectiles: Array.from(gameState.projectiles.values()),
    weather: gameState.weather,
    timeOfDay: gameState.timeOfDay,
    playerCount: gameState.players.size,
    serverTime: Date.now()
  };
  
  io.emit('gameUpdate', gameUpdate);
}, MS_PER_TICK);

// Send leaderboard updates every 5 seconds
setInterval(() => {
  const leaderboard = Array.from(gameState.players.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(player => ({
      id: player.id,
      username: player.username,
      score: player.score,
      kills: player.kills,
      deaths: player.deaths
    }));
  
  io.emit('leaderboardUpdate', leaderboard);
}, 5000);

// Server statistics
setInterval(() => {
  const stats = {
    players: gameState.players.size,
    uptime: Date.now() - gameState.gameStats.gameStartTime,
    totalKills: gameState.gameStats.totalKills,
    totalPlayers: gameState.gameStats.playersJoined,
    projectiles: gameState.projectiles.size,
    powerUps: gameState.powerUps.size
  };
  
  console.log(`[STATS] Players: ${stats.players}/${MAX_PLAYERS}, Uptime: ${Math.floor(stats.uptime/1000)}s, Kills: ${stats.totalKills}`);
}, 30000);

server.listen(PORT, () => {
  console.log(`=== Advanced Boat Battle FPS Server ===`);
  console.log(`Port: ${PORT}`);
  console.log(`Max Players: ${MAX_PLAYERS}`);
  console.log(`Tick Rate: ${TICK_RATE}Hz`);
  console.log(`Anti-cheat: Enabled`);
  console.log(`Islands: ${gameState.islands.length}`);
  console.log(`Power-ups: ${gameState.powerUps.size}`);
  console.log(`=======================================`);
});