# Captive Portal Backend

Real-time backend server for shared state across all connected devices.

## What It Does

This Node.js server enables **true multi-device interaction** on the captive portal:

- **Real-time Chat**: Messages appear instantly on all connected devices
- **Shared Audio**: Record sounds that everyone can hear
- **Collaborative Canvas**: Draw together on a shared canvas

## Architecture

```
Device 1 ─────┐
              │
Device 2 ─────┼──> Node.js Backend (Port 3000) ──> Shared State
              │       Socket.io WebSockets            (in-memory)
Device 3 ─────┘
```

### How It Works

1. **WebSocket Connection**: Each device connects via Socket.io
2. **Event Broadcasting**: When one device sends data, server broadcasts to all others
3. **State Synchronization**: New devices get current state on connection
4. **In-Memory Storage**: Data stored in RAM (resets on server restart)

## Technology Stack

- **Express**: HTTP server for API endpoints
- **Socket.io**: Real-time bidirectional communication
- **Node.js**: Runtime environment

## API Endpoints

### HTTP (REST)
- `GET /health` - Server status and stats
- `GET /api/messages` - Get last 50 chat messages
- `GET /api/sounds` - Get last 20 audio recordings
- `GET /api/canvas` - Get current canvas state

### WebSocket (Socket.io)

**Client → Server:**
- `chat:message` - Send a chat message
- `noise:add` - Upload audio recording
- `canvas:update` - Broadcast canvas changes
- `canvas:clear` - Clear the canvas

**Server → Client:**
- `init` - Initial state on connection
- `chat:message` - New message broadcast
- `noise:add` - New sound broadcast
- `canvas:update` - Canvas update broadcast
- `canvas:clear` - Canvas cleared broadcast

## Installation

```bash
sudo bash setup-backend.sh
```

## Management

```bash
# Start
sudo systemctl start captive-backend

# Stop
sudo systemctl stop captive-backend

# Restart
sudo systemctl restart captive-backend

# View logs
sudo journalctl -u captive-backend -f

# Check status
sudo systemctl status captive-backend
```

## Development

```bash
cd backend
npm install
npm start
```

## Storage Limits

- **Chat**: Last 100 messages
- **Sounds**: Last 30 recordings (max 1MB each)
- **Canvas**: Single shared canvas state

Data is stored in RAM and will be lost on server restart.

## Security Notes

- No authentication required
- Anyone on the WiFi can post content
- Audio recordings are base64-encoded and stored in memory
- No persistent database (intentional for privacy)

## Port

Backend runs on **port 3000** by default.

Frontend connects to same host on port 3000 via:
```javascript
io(':3000')
```

