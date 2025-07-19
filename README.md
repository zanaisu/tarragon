# Boat Battle FPS - 100 Player Online Game

A real-time multiplayer FPS game where up to 100 players battle in boats on the high seas with islands and weapons.

## Features

- **100 Player Support**: Real-time multiplayer for up to 100 concurrent players
- **FPS Boat Combat**: First-person shooting from boats with realistic physics
- **Dynamic Islands**: Procedurally generated islands with trees for cover
- **Real-time Networking**: Low-latency multiplayer using Socket.IO
- **Cross-platform**: Web-based game accessible from any modern browser
- **Mac Hosting**: Optimized for hosting on macOS

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm

### Installation

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or run in development mode with auto-restart
npm run dev
```

### Playing the Game

1. Open your browser to `http://localhost:3000`
2. Click to lock your mouse pointer
3. Use WASD to move your boat
4. Move mouse to look around
5. Click to shoot
6. Battle other players for the highest score!

### Controls

- **WASD** - Move boat
- **Mouse** - Look around / Aim
- **Click** - Shoot
- **R** - Reload (coming soon)

## Hosting on Mac

### For Local Network Play:
```bash
# Find your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Start server
npm start

# Players connect to: http://YOUR_LOCAL_IP:3000
```

### For Internet Play:
1. Port forward port 3000 on your router
2. Share your public IP with players
3. Players connect to: `http://YOUR_PUBLIC_IP:3000`

### Using ngrok (Easiest):
```bash
# Install ngrok
brew install ngrok

# Start the game server
npm start

# In another terminal, expose it
ngrok http 3000

# Share the ngrok URL with players
```

## Game Mechanics

- **Health System**: Players and boats have separate health pools
- **Respawning**: Players respawn at random locations when killed
- **Scoring**: Earn points for eliminating other players
- **Island Cover**: Use islands for tactical advantage
- **Boat Physics**: Realistic boat movement with momentum

## Technical Details

- **Frontend**: Three.js for 3D graphics, HTML5 Canvas
- **Backend**: Node.js with Express and Socket.IO
- **Real-time Communication**: WebSocket connections
- **Performance**: Optimized for 100 concurrent connections
- **Cross-platform**: Works on desktop and mobile browsers

## Development

```bash
# Install development dependencies
npm install

# Run server with auto-restart
npm run dev

# Serve client files separately (optional)
npm run client
```

## Performance Optimization

The game is optimized for 100 players with:
- Efficient collision detection
- Optimized network updates (60 FPS)
- Client-side prediction
- Server-side validation
- Memory management for bullets and entities

## Contributing

This is a Terragon Labs project. Feel free to submit issues and feature requests.

## License

MIT License