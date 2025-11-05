/**
 * Captive Portal Web Application - Chat Feature
 * Simple chat demonstration with localStorage
 */

// State management
const state = {
    connectionTime: new Date(),
    particleCount: 20,
    messages: [],
    pollInterval: null
};

// Storage key for messages
const STORAGE_KEY = 'captive_portal_messages';

// Initialize app when DOM is ready
function init() {
    displayConnectionTime();
    createParticles();
    attachEventListeners();
    loadMessages();
    startMessagePolling();
    logInitialization();
}

/**
 * Display the connection time
 */
function displayConnectionTime() {
    const timeElement = document.getElementById('connectionTime');
    if (!timeElement) return;

    const formatted = state.connectionTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    timeElement.textContent = formatted;
}

/**
 * Create animated particle elements in the background
 */
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < state.particleCount; i++) {
        createParticle(container, i);
    }
}

/**
 * Create a single particle with random properties
 */
function createParticle(container, index) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 12 + 3;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.bottom = '0';
    particle.style.animationDelay = `${Math.random() * 20}s`;
    particle.style.animationDuration = `${15 + Math.random() * 10}s`;
    
    container.appendChild(particle);
}

/**
 * Attach event listeners to interactive elements
 */
function attachEventListeners() {
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');

    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
    }

    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        });
    }
}

/**
 * Handle sending a new message
 */
function handleSendMessage() {
    const nameInput = document.getElementById('nameInput');
    const messageInput = document.getElementById('messageInput');
    
    if (!messageInput || !messageInput.value.trim()) {
        showNotification('Please enter a message');
        return;
    }

    const message = {
        id: Date.now(),
        name: nameInput ? nameInput.value.trim() || 'Anonymous' : 'Anonymous',
        text: messageInput.value.trim(),
        timestamp: new Date().toISOString()
    };

    // Add to messages
    state.messages.push(message);
    
    // Save to localStorage
    saveMessages();
    
    // Update display
    renderMessages();
    
    // Clear input
    if (messageInput) {
        messageInput.value = '';
    }
    
    // Show confirmation
    showNotification('Message sent!');
}

/**
 * Load messages from localStorage
 */
function loadMessages() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            state.messages = JSON.parse(stored);
            // Keep only last 50 messages
            if (state.messages.length > 50) {
                state.messages = state.messages.slice(-50);
                saveMessages();
            }
        }
        renderMessages();
    } catch (e) {
        console.error('Error loading messages:', e);
        state.messages = [];
    }
}

/**
 * Save messages to localStorage
 */
function saveMessages() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages));
    } catch (e) {
        console.error('Error saving messages:', e);
    }
}

/**
 * Render all messages to the chat area
 */
function renderMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    if (state.messages.length === 0) {
        container.innerHTML = '<div class="chat-placeholder">No messages yet. Be the first to say hello!</div>';
        return;
    }

    container.innerHTML = '';
    
    // Show last 20 messages
    const recentMessages = state.messages.slice(-20);
    
    recentMessages.forEach((msg, index) => {
        const messageEl = createMessageElement(msg, index);
        container.appendChild(messageEl);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

/**
 * Create a message element
 */
function createMessageElement(message, index) {
    const div = document.createElement('div');
    div.className = 'chat-message';
    div.style.animationDelay = `${index * 0.05}s`;
    
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
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Poll for new messages from other users
 */
function startMessagePolling() {
    // Check for new messages every 2 seconds
    state.pollInterval = setInterval(() => {
        const currentCount = state.messages.length;
        loadMessages();
        
        // If new messages appeared, scroll to bottom
        if (state.messages.length > currentCount) {
            const container = document.getElementById('chatMessages');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, 2000);
}

/**
 * Show a temporary notification
 */
function showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideInRight 0.4s ease-out;
        font-weight: 600;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

/**
 * Log initialization for diagnostics
 */
function logInitialization() {
    console.log('%c[CAPTIVE PORTAL] Chat Initialized', 'font-size: 18px; font-weight: bold; color: #4f46e5;');
    console.log('%cConnection Details:', 'font-size: 14px; font-weight: bold; color: #06b6d4;');
    console.log('  Time:', state.connectionTime.toLocaleString());
    console.log('  Messages:', state.messages.length);
    console.log('%cFeatures:', 'font-size: 14px; font-weight: bold; color: #10b981;');
    console.log('  [+] Real-time chat');
    console.log('  [+] Animated particles');
    console.log('  [+] LocalStorage persistence');
}

/**
 * Add CSS animations dynamically
 */
function addDynamicStyles() {
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
        
        @keyframes messageSlideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize dynamic styles
addDynamicStyles();

// Initialize app when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (state.pollInterval) {
        clearInterval(state.pollInterval);
    }
});

// Export functions for potential external use
export { init, handleSendMessage };
