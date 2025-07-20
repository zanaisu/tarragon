# Advanced Boat Battle FPS - AAA Quality 100 Player Game

A cutting-edge real-time multiplayer FPS where up to 100 players engage in epic boat battles across a dynamic oceanic world with advanced graphics, realistic physics, and sophisticated gameplay systems.

## 🚀 Advanced Features

### **Core Gameplay**
- **100 Player Support**: Optimized real-time multiplayer with anti-cheat protection
- **Dual Mode Combat**: Seamless boat-to-foot gameplay with F key switching
- **Advanced Weapon System**: 6 unique weapons (AK-47, Desert Eagle, Shotgun, AWP, MP5, M249) with realistic ballistics
- **Realistic Physics**: Advanced boat dynamics with wave simulation and buoyancy

### **Graphics & Effects** 
- **Dynamic Water System**: Procedural waves with realistic reflections and foam
- **Particle Effects**: Muzzle flashes, explosions, water splashes, and bullet tracers
- **Day/Night Cycle**: Real-time lighting changes with dynamic skybox
- **Weather System**: Rain, storms, fog with visual and gameplay effects
- **Advanced Materials**: Procedural textures and realistic lighting

### **Audio Engine**
- **High-Quality Sound**: Procedural audio generation for realistic weapon sounds
- **3D Audio**: Positional audio with weapon-specific acoustics
- **Environmental Audio**: Wind, water, and ambient soundscapes
- **Dynamic Music**: Contextual audio mixing system

### **UI & User Experience**
- **Professional HUD**: Health/armor bars, ammo counter, weapon stats, minimap
- **Real-time Minimap**: Shows players, islands, and tactical information  
- **Kill Feed**: Live combat updates with weapon information
- **Chat System**: In-game communication with rate limiting
- **Leaderboard**: Live scoring and statistics tracking
- **Settings Panel**: Comprehensive audio/visual/control options

### **Game Systems**
- **Power-up System**: Health packs, armor, ammo, and weapon upgrades on islands
- **Advanced Islands**: 25+ procedurally generated islands with vegetation and details
- **Collision Detection**: Precise physics with island boundaries and object interaction
- **Anti-Cheat**: Server-side validation for movement, shooting, and damage
- **Performance Optimization**: 60Hz server tick rate with client prediction

## 🎮 Controls

### **Basic Controls**
- **WASD** - Move boat/walk on islands
- **Mouse** - Look around and aim
- **Click** - Shoot weapon
- **F** - Exit/Enter boat (when near)
- **R** - Reload current weapon

### **Weapon Switching**
- **1** - Assault Rifle (AK-47)
- **2** - Pistol (Desert Eagle)  
- **3** - Shotgun (Remington 870)
- **4** - Sniper Rifle (AWP)
- **5** - SMG (MP5)

### **Interface**
- **Tab** - Toggle leaderboard
- **Esc** - Open settings menu
- **Enter** - Open chat

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm

### Installation

```bash
# Install dependencies
npm install

# Start the advanced server
npm start

# Or run in development mode with auto-restart
npm run dev
```

### Playing the Game

1. Open your browser to `http://localhost:3000`
2. Click to lock your mouse pointer
3. Use WASD to move your boat
4. Move mouse to look around and aim
5. Click to shoot enemies
6. Press F near islands to exit boat and explore
7. Collect power-ups for health, armor, and weapons
8. Battle other players for the highest score!

## 🌐 Hosting Options

### **Local Network Play**
```bash
# Find your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Start server
npm start

# Players connect to: http://YOUR_LOCAL_IP:3000
```

### **Internet Hosting**
1. Port forward port 3000 on your router
2. Share your public IP with players
3. Players connect to: `http://YOUR_PUBLIC_IP:3000`

### **Using ngrok (Easiest)**
```bash
# Install ngrok
brew install ngrok

# Start the game server
npm start

# In another terminal, expose it
ngrok http 3000

# Share the ngrok URL with players
```

## ⚔️ Weapon System

| Weapon | Damage | Fire Rate | Range | Special |
|--------|--------|-----------|-------|---------|
| **AK-47** | 35 | 600 RPM | 800m | High penetration |
| **Desert Eagle** | 65 | 300 RPM | 400m | High damage |
| **Shotgun** | 25×8 | 120 RPM | 200m | Spread shot |
| **AWP** | 150 | 40 RPM | 2000m | One-shot potential |
| **MP5** | 28 | 800 RPM | 300m | High fire rate |
| **M249** | 45 | 500 RPM | 1000m | Heavy damage |

## 🏝️ Game Mechanics

### **Health & Armor System**
- **Health**: 100 HP, regenerates with health packs
- **Armor**: 100 points, absorbs 70% of damage
- **Power-ups**: Spawn on islands every 30 seconds

### **Physics & Movement**
- **Realistic Boat Physics**: Momentum, wave interaction, buoyancy
- **Water Effects**: Dynamic waves, splashes, ripples
- **Collision System**: Islands block movement and bullets
- **Weather Impact**: Rain affects visibility, wind affects projectiles

### **Scoring System**
- **Kill**: +100 points
- **Assist**: +25 points  
- **Survival Time**: +1 point per 10 seconds
- **Power-up Collection**: +10 points

## 🛠️ Technical Details

### **Frontend Technologies**
- **Three.js**: Advanced 3D graphics and rendering
- **WebGL Shaders**: Custom water, lighting, and particle effects
- **Canvas API**: UI elements and procedural textures
- **Web Audio API**: High-quality procedural sound generation

### **Backend Technologies**
- **Node.js**: High-performance server runtime
- **Socket.IO**: Real-time WebSocket communication
- **Express**: Web server and static file serving
- **Anti-cheat**: Server-side validation and rate limiting

### **Performance Features**
- **60Hz Server Tick Rate**: Smooth gameplay for 100 players
- **Client-side Prediction**: Reduced perceived latency
- **Optimized Networking**: Delta compression and priority updates
- **LOD System**: Distance-based detail optimization
- **Memory Management**: Automatic cleanup of particles and effects

### **Anti-Cheat Systems**
- **Movement Validation**: Speed and position checks
- **Shot Validation**: Fire rate and damage verification  
- **Rate Limiting**: Prevents spam and DoS attacks
- **Server Authority**: All game state managed server-side

## 🎯 Game Modes

### **Battle Royale** (Default)
- 100 players fight until one remains
- Shrinking play area forces encounters
- Power-ups and weapons scattered across islands

### **Team Deathmatch** (Coming Soon)
- Red vs Blue team combat
- Respawn system with base camps
- Capture points on major islands

### **Free-for-All** (Current)
- No teams, everyone fights everyone
- Immediate respawn system
- Continuous action and scoring

## 🔧 Development

### **Project Structure**
```
boat-battle-fps/
├── public/              # Client-side files
│   ├── audio.js        # Advanced audio engine
│   ├── effects.js      # Particle and visual effects
│   ├── weapons.js      # Weapon system and ballistics
│   ├── physics.js      # Boat and water physics
│   ├── ui.js          # Advanced UI system
│   ├── game-advanced.js # Main game client
│   └── index.html     # Game interface
├── server-advanced.js  # Enhanced server with anti-cheat
├── server.js          # Basic server (legacy)
└── package.json       # Dependencies and scripts
```

### **Development Commands**
```bash
# Advanced server (recommended)
npm run dev              # Auto-restart on changes
npm start               # Production mode

# Basic server (simple version)
npm run dev-basic       # Basic functionality
npm run start-basic     # Legacy server

# Client development
npm run client          # Serve files with live-server
```

## 🎨 Customization

### **Weapon Modding**
Modify weapon stats in `weapons.js`:
```javascript
weapons.set('custom_rifle', {
    name: 'Custom AK',
    damage: 40,
    fireRate: 650,
    accuracy: 0.9,
    // ... other properties
});
```

### **Graphics Settings**
Adjust quality in `effects.js`:
```javascript
// Particle density
const PARTICLE_COUNT = 1000; // Lower for performance

// Shadow quality  
shadowMapSize: 2048; // 4096 for higher quality
```

### **Audio Customization**
Create custom sounds in `audio.js`:
```javascript
sounds.set('custom_shot', () => this.createCustomShot());
```

## 📊 Server Statistics

The server provides real-time statistics:
- **Player Count**: Current/maximum players
- **Server Uptime**: Time since start
- **Total Kills**: Cumulative combat statistics
- **Performance Metrics**: Tick rate, memory usage
- **Anti-cheat Logs**: Security event monitoring

## 🐛 Troubleshooting

### **Common Issues**

**Game won't load:**
- Check console for JavaScript errors
- Ensure all script files are loaded correctly
- Verify WebGL support in your browser

**Poor performance:**
- Lower particle count in `effects.js`
- Reduce shadow map resolution
- Close other browser tabs

**Connection issues:**
- Check firewall settings for port 3000
- Verify server is running with `npm start`
- Test local connection first

**Audio not working:**
- Browser may require user interaction to enable audio
- Check browser audio permissions
- Verify Web Audio API support

### **Performance Optimization**

For servers hosting 100 players:
- **Minimum**: 4GB RAM, 2-core CPU
- **Recommended**: 8GB RAM, 4-core CPU
- **Network**: 10Mbps upload minimum
- **OS**: Linux recommended for production

## 📄 License

MIT License - Feel free to modify and distribute

## 👥 Contributing

This is a Terragon Labs project showcasing advanced web game development techniques. 

### **Key Technologies Demonstrated**
- Advanced WebGL rendering and shaders
- Real-time multiplayer networking at scale
- Procedural audio and visual effects
- Anti-cheat and security systems
- Performance optimization for 100+ users

---

**Built with ❤️ by Terragon Labs**

*Pushing the boundaries of browser-based gaming*