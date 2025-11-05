/**
 * Captive Portal - Retro Hacking Interface
 * Features: Real-time Chat, Noise Recording, Shared Drawing Canvas
 * Backend: Socket.io for shared state across all connected devices
 */

// State management
const state = {
    connectionTime: new Date(),
    particleCount: 15,
    recording: false,
    mediaRecorder: null,
    audioChunks: [],
    drawing: false,
    canvas: null,
    ctx: null,
    socket: null,
    connected: false
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    console.log('%c[PORTAL] Initializing...', 'color: #00ff00; font-weight: bold');
    
    displayConnectionTime();
    createParticles();
    setupTabs();
    setupChat();
    setupNoise();
    setupCanvas();
    connectToBackend();
    
    console.log('%c[PORTAL] Ready', 'color: #00ff00; font-weight: bold');
}

/**
 * BACKEND CONNECTION - Socket.io
 */
function connectToBackend() {
    // Connect to backend server on same host, port 3000
    state.socket = io(':3000', {
        transports: ['websocket', 'polling']
    });
    
    state.socket.on('connect', () => {
        console.log('%c[SOCKET] Connected to backend', 'color: #00ff00');
        state.connected = true;
        showNotification('connected to server');
    });
    
    state.socket.on('disconnect', () => {
        console.log('%c[SOCKET] Disconnected from backend', 'color: #ff0000');
        state.connected = false;
        showNotification('disconnected from server');
    });
    
    // Initialize with current state
    state.socket.on('init', (data) => {
        console.log('[SOCKET] Received initial state:', data);
        renderAllChatMessages(data.messages || []);
        renderNoise(data.sounds || []);
        if (data.canvasData) {
            loadCanvasData(data.canvasData);
        }
    });
    
    // Real-time chat messages
    state.socket.on('chat:message', (message) => {
        appendChatMessage(message);
    });
    
    // Real-time noise updates
    state.socket.on('noise:add', (sound) => {
        appendNoiseItem(sound);
    });
    
    // Real-time canvas updates
    state.socket.on('canvas:update', (data) => {
        if (!state.drawing && data) {
            loadCanvasData(data);
        }
    });
    
    state.socket.on('canvas:clear', () => {
        if (state.ctx) {
            state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
        }
    });
    
    state.socket.on('connect_error', (error) => {
        console.error('[SOCKET] Connection error:', error);
    });
}

/**
 * CONNECTION TIME
 */
function displayConnectionTime() {
    const el = document.getElementById('connectionTime');
    if (!el) return;
    
    const time = state.connectionTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    el.textContent = time;
}

/**
 * PARTICLES
 */
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < state.particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 8 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 20}s`;
        particle.style.animationDuration = `${15 + Math.random() * 10}s`;
        
        container.appendChild(particle);
    }
}

/**
 * TAB SYSTEM
 */
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
}

/**
 * CHAT SYSTEM - Real-time with Socket.io
 */
function setupChat() {
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
}

function sendMessage() {
    if (!state.connected) {
        showNotification('not connected to server');
        return;
    }
    
    const nameInput = document.getElementById('nameInput');
    const messageInput = document.getElementById('messageInput');
    
    if (!messageInput || !messageInput.value.trim()) return;
    
    const message = {
        id: Date.now(),
        name: nameInput ? nameInput.value.trim() || 'anonymous' : 'anonymous',
        text: messageInput.value.trim(),
        timestamp: new Date().toISOString()
    };
    
    // Send to backend
    state.socket.emit('chat:message', message);
    
    // Clear input
    if (messageInput) messageInput.value = '';
}

function renderAllChatMessages(messages) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="chat-placeholder">No messages yet. Be the first to say hello!</div>';
        return;
    }
    
    container.innerHTML = '';
    messages.slice(-20).forEach(msg => {
        const el = createChatMessageElement(msg);
        container.appendChild(el);
    });
    
    container.scrollTop = container.scrollHeight;
}

function appendChatMessage(message) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    const placeholder = container.querySelector('.chat-placeholder');
    if (placeholder) placeholder.remove();
    
    const el = createChatMessageElement(message);
    container.appendChild(el);
    
    while (container.children.length > 20) {
        container.removeChild(container.firstChild);
    }
    
    container.scrollTop = container.scrollHeight;
}

function createChatMessageElement(message) {
    const div = document.createElement('div');
    div.className = 'chat-message';
    
    const time = new Date(message.timestamp);
    const timeStr = time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    div.innerHTML = `
        <div class="chat-message-header">
            <span class="chat-message-name">${escapeHtml(message.name)}</span>
            <span class="chat-message-time">${timeStr}</span>
        </div>
        <div class="chat-message-text">${escapeHtml(message.text)}</div>
    `;
    
    return div;
}

/**
 * NOISE RECORDING SYSTEM
 */
function setupNoise() {
    const recordBtn = document.getElementById('recordBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (recordBtn) recordBtn.addEventListener('click', startRecording);
    if (stopBtn) stopBtn.addEventListener('click', stopRecording);
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.mediaRecorder = new MediaRecorder(stream);
        state.audioChunks = [];
        
        state.mediaRecorder.addEventListener('dataavailable', (e) => {
            state.audioChunks.push(e.data);
        });
        
        state.mediaRecorder.addEventListener('stop', saveRecording);
        
        state.mediaRecorder.start();
        state.recording = true;
        
        document.getElementById('recordBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('recordingStatus').textContent = 'recording...';
    } catch (e) {
        console.error('Error starting recording:', e);
        showNotification('microphone access denied');
    }
}

function stopRecording() {
    if (state.mediaRecorder && state.recording) {
        state.mediaRecorder.stop();
        state.recording = false;
        
        state.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        document.getElementById('recordBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('recordingStatus').textContent = '';
    }
}

function saveRecording() {
    if (!state.connected) {
        showNotification('not connected to server');
        return;
    }
    
    const blob = new Blob(state.audioChunks, { type: 'audio/webm' });
    const reader = new FileReader();
    
    reader.onloadend = () => {
        const base64 = reader.result;
        
        // Check size (limit to 1MB)
        if (base64.length > 1000000) {
            showNotification('recording too large');
            return;
        }
        
        const sound = {
            id: Date.now(),
            name: 'anonymous',
            data: base64,
            timestamp: new Date().toISOString()
        };
        
        // Send to backend
        state.socket.emit('noise:add', sound);
        showNotification('sound saved');
    };
    
    reader.readAsDataURL(blob);
}

function renderNoise(sounds) {
    const container = document.getElementById('noiseList');
    if (!container) return;
    
    if (sounds.length === 0) {
        container.innerHTML = '<div class="noise-placeholder">No sounds yet. Record something!</div>';
        return;
    }
    
    container.innerHTML = '';
    sounds.forEach(sound => {
        const el = createNoiseElement(sound);
        container.appendChild(el);
    });
}

function appendNoiseItem(sound) {
    const container = document.getElementById('noiseList');
    if (!container) return;
    
    const placeholder = container.querySelector('.noise-placeholder');
    if (placeholder) placeholder.remove();
    
    const el = createNoiseElement(sound);
    container.appendChild(el);
}

function createNoiseElement(sound) {
    const div = document.createElement('div');
    div.className = 'noise-item';
    
    const time = new Date(sound.timestamp);
    const timeStr = time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    div.innerHTML = `
        <div class="noise-item-info">
            <div class="noise-item-name">${escapeHtml(sound.name)}</div>
            <div class="noise-item-time">${timeStr}</div>
        </div>
        <div class="noise-item-controls">
            <button class="btn play-btn" data-id="${sound.id}">▶ play</button>
        </div>
    `;
    
    const playBtn = div.querySelector('.play-btn');
    playBtn.addEventListener('click', () => playSound(sound));
    
    return div;
}

function playSound(sound) {
    const audio = new Audio(sound.data);
    audio.play().catch(e => console.error('Error playing sound:', e));
}

/**
 * DRAWING CANVAS SYSTEM
 */
function setupCanvas() {
    state.canvas = document.getElementById('drawCanvas');
    if (!state.canvas) return;
    
    state.ctx = state.canvas.getContext('2d');
    
    state.canvas.width = 600;
    state.canvas.height = 400;
    
    // Drawing events
    state.canvas.addEventListener('mousedown', startDrawing);
    state.canvas.addEventListener('mousemove', draw);
    state.canvas.addEventListener('mouseup', stopDrawing);
    state.canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    state.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        state.canvas.dispatchEvent(mouseEvent);
    });
    
    state.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        state.canvas.dispatchEvent(mouseEvent);
    });
    
    state.canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        state.canvas.dispatchEvent(mouseEvent);
    });
    
    // Clear button
    const clearBtn = document.getElementById('clearCanvas');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCanvas);
    }
}

function startDrawing(e) {
    state.drawing = true;
    const rect = state.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    state.ctx.beginPath();
    state.ctx.moveTo(x, y);
}

function draw(e) {
    if (!state.drawing) return;
    
    const rect = state.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const color = document.getElementById('colorPicker')?.value || '#00ff00';
    const size = document.getElementById('brushSize')?.value || 3;
    
    state.ctx.lineTo(x, y);
    state.ctx.strokeStyle = color;
    state.ctx.lineWidth = size;
    state.ctx.lineCap = 'round';
    state.ctx.stroke();
}

function stopDrawing() {
    if (state.drawing) {
        state.drawing = false;
        broadcastCanvas();
    }
}

function clearCanvas() {
    if (!state.connected) {
        showNotification('not connected to server');
        return;
    }
    
    if (state.ctx) {
        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
        state.socket.emit('canvas:clear');
    }
}

function broadcastCanvas() {
    if (!state.canvas || !state.connected) return;
    
    try {
        const data = state.canvas.toDataURL();
        state.socket.emit('canvas:update', data);
    } catch (e) {
        console.error('Error broadcasting canvas:', e);
    }
}

function loadCanvasData(data) {
    if (!state.canvas || !state.ctx) return;
    
    try {
        const img = new Image();
        img.onload = () => {
            state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
            state.ctx.drawImage(img, 0, 0);
        };
        img.src = data;
    } catch (e) {
        console.error('Error loading canvas:', e);
    }
}

/**
 * UTILITIES
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 255, 0, 0.2);
        border: 1px solid var(--primary-color);
        color: var(--primary-color);
        padding: 15px 20px;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        font-family: inherit;
        font-size: 0.85rem;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Add dynamic styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

export { init };
