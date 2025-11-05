/**
 * Captive Portal Backend - Shared State Server
 * Simple Express + Socket.io server for real-time chat, canvas, and noise sharing
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// In-memory storage
const state = {
    messages: [],
    sounds: [],
    canvasData: null
};

// Middleware
app.use(express.json({ limit: '10mb' }));

// API endpoints
app.get('/api/messages', (req, res) => {
    res.json(state.messages.slice(-50)); // Last 50 messages
});

app.get('/api/sounds', (req, res) => {
    res.json(state.sounds.slice(-20)); // Last 20 sounds
});

app.get('/api/canvas', (req, res) => {
    res.json({ data: state.canvasData });
});

// Socket.io real-time events
io.on('connection', (socket) => {
    console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);
    
    // Send current state to new client
    socket.emit('init', {
        messages: state.messages.slice(-50),
        sounds: state.sounds.slice(-20),
        canvasData: state.canvasData
    });
    
    // Chat message
    socket.on('chat:message', (message) => {
        console.log(`[CHAT] ${message.name}: ${message.text}`);
        state.messages.push(message);
        
        // Keep last 100 messages
        if (state.messages.length > 100) {
            state.messages = state.messages.slice(-100);
        }
        
        // Broadcast to all clients
        io.emit('chat:message', message);
    });
    
    // Noise/sound recording
    socket.on('noise:add', (sound) => {
        console.log(`[NOISE] New recording from ${sound.name}`);
        state.sounds.push(sound);
        
        // Keep last 30 sounds
        if (state.sounds.length > 30) {
            state.sounds = state.sounds.slice(-30);
        }
        
        // Broadcast to all clients
        io.emit('noise:add', sound);
    });
    
    // Canvas drawing
    socket.on('canvas:update', (data) => {
        state.canvasData = data;
        // Broadcast to all other clients (not sender)
        socket.broadcast.emit('canvas:update', data);
    });
    
    // Canvas clear
    socket.on('canvas:clear', () => {
        console.log('[CANVAS] Cleared by user');
        state.canvasData = null;
        io.emit('canvas:clear');
    });
    
    socket.on('disconnect', () => {
        console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}`);
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        clients: io.engine.clientsCount,
        messages: state.messages.length,
        sounds: state.sounds.length,
        hasCanvas: !!state.canvasData
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════╗
║  Captive Portal Backend Server       ║
╚══════════════════════════════════════╝

🚀 Server running on port ${PORT}
🌐 Listening on all interfaces (0.0.0.0)
📡 WebSocket ready for connections

Features:
  • Real-time chat
  • Shared audio recordings
  • Collaborative drawing canvas

Press Ctrl+C to stop
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

