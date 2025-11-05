/**
 * Captive Portal - Retro Hacking Interface
 * Features: Chat, Noise Recording, Shared Drawing Canvas
 */

// Storage keys
const STORAGE_KEYS = {
    chat: 'portal_chat_messages',
    noise: 'portal_noise_sounds',
    canvas: 'portal_canvas_data'
};

// State management
const state = {
    connectionTime: new Date(),
    particleCount: 15,
    lastMessageCount: 0,
    lastNoiseCount: 0,
    recording: false,
    mediaRecorder: null,
    audioChunks: [],
    drawing: false,
    canvas: null,
    ctx: null,
    lastCanvasData: null
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
    startPolling();
    
    console.log('%c[PORTAL] Ready', 'color: #00ff00; font-weight: bold');
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
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
}

/**
 * CHAT SYSTEM - Fixed to prevent refresh flicker
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
    
    loadChat();
}

function sendMessage() {
    const nameInput = document.getElementById('nameInput');
    const messageInput = document.getElementById('messageInput');
    
    if (!messageInput || !messageInput.value.trim()) return;
    
    const message = {
        id: Date.now(),
        name: nameInput ? nameInput.value.trim() || 'anonymous' : 'anonymous',
        text: messageInput.value.trim(),
        timestamp: new Date().toISOString()
    };
    
    // Get existing messages
    let messages = [];
    try {
        messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.chat) || '[]');
    } catch (e) {
        console.error('Error loading messages:', e);
    }
    
    messages.push(message);
    
    // Keep last 50 messages
    if (messages.length > 50) {
        messages = messages.slice(-50);
    }
    
    // Save
    try {
        localStorage.setItem(STORAGE_KEYS.chat, JSON.stringify(messages));
    } catch (e) {
        console.error('Error saving message:', e);
    }
    
    // Update display - append only the new message
    appendChatMessage(message);
    
    // Update state
    state.lastMessageCount = messages.length;
    
    // Clear input
    if (messageInput) messageInput.value = '';
}

function loadChat() {
    try {
        const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.chat) || '[]');
        state.lastMessageCount = messages.length;
        renderAllChatMessages(messages);
    } catch (e) {
        console.error('Error loading chat:', e);
    }
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
    
    // Remove placeholder if present
    const placeholder = container.querySelector('.chat-placeholder');
    if (placeholder) placeholder.remove();
    
    // Add new message
    const el = createChatMessageElement(message);
    container.appendChild(el);
    
    // Keep only last 20 visible
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
    
    loadNoise();
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
        showNotification('Microphone access denied');
    }
}

function stopRecording() {
    if (state.mediaRecorder && state.recording) {
        state.mediaRecorder.stop();
        state.recording = false;
        
        // Stop all tracks
        state.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        document.getElementById('recordBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('recordingStatus').textContent = '';
    }
}

function saveRecording() {
    const blob = new Blob(state.audioChunks, { type: 'audio/webm' });
    const reader = new FileReader();
    
    reader.onloadend = () => {
        const base64 = reader.result;
        
        const sound = {
            id: Date.now(),
            name: 'anonymous',
            data: base64,
            timestamp: new Date().toISOString()
        };
        
        // Load existing
        let sounds = [];
        try {
            sounds = JSON.parse(localStorage.getItem(STORAGE_KEYS.noise) || '[]');
        } catch (e) {
            console.error('Error loading sounds:', e);
        }
        
        sounds.push(sound);
        
        // Keep last 20
        if (sounds.length > 20) {
            sounds = sounds.slice(-20);
        }
        
        // Save
        try {
            localStorage.setItem(STORAGE_KEYS.noise, JSON.stringify(sounds));
            state.lastNoiseCount = sounds.length;
            renderNoise(sounds);
            showNotification('sound saved');
        } catch (e) {
            console.error('Error saving sound:', e);
            showNotification('error: storage full');
        }
    };
    
    reader.readAsDataURL(blob);
}

function loadNoise() {
    try {
        const sounds = JSON.parse(localStorage.getItem(STORAGE_KEYS.noise) || '[]');
        state.lastNoiseCount = sounds.length;
        renderNoise(sounds);
    } catch (e) {
        console.error('Error loading noise:', e);
    }
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
    
    // Set actual canvas size
    state.canvas.width = 600;
    state.canvas.height = 400;
    
    // Load saved canvas
    loadCanvas();
    
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
        saveCanvas();
    }
}

function clearCanvas() {
    if (state.ctx) {
        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
        saveCanvas();
    }
}

function saveCanvas() {
    if (!state.canvas) return;
    try {
        const data = state.canvas.toDataURL();
        localStorage.setItem(STORAGE_KEYS.canvas, data);
    } catch (e) {
        console.error('Error saving canvas:', e);
    }
}

function loadCanvas() {
    if (!state.canvas || !state.ctx) return;
    try {
        const data = localStorage.getItem(STORAGE_KEYS.canvas);
        if (data) {
            const img = new Image();
            img.onload = () => {
                state.ctx.drawImage(img, 0, 0);
                state.lastCanvasData = data;
            };
            img.src = data;
        }
    } catch (e) {
        console.error('Error loading canvas:', e);
    }
}

/**
 * POLLING - Check for updates from other users
 */
function startPolling() {
    setInterval(() => {
        try {
            // Check for new chat messages
            const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.chat) || '[]');
            if (messages.length > state.lastMessageCount) {
                const newMessages = messages.slice(state.lastMessageCount);
                newMessages.forEach(msg => appendChatMessage(msg));
                state.lastMessageCount = messages.length;
            }
            
            // Check for new noise
            const sounds = JSON.parse(localStorage.getItem(STORAGE_KEYS.noise) || '[]');
            if (sounds.length !== state.lastNoiseCount) {
                state.lastNoiseCount = sounds.length;
                renderNoise(sounds);
            }
            
            // Check for canvas updates
            const canvasData = localStorage.getItem(STORAGE_KEYS.canvas);
            if (canvasData && canvasData !== state.lastCanvasData) {
                state.lastCanvasData = canvasData;
                const img = new Image();
                img.onload = () => {
                    if (state.ctx && !state.drawing) {
                        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
                        state.ctx.drawImage(img, 0, 0);
                    }
                };
                img.src = canvasData;
            }
        } catch (e) {
            console.error('Polling error:', e);
        }
    }, 2000);
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
