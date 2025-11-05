/**
 * Captive Portal Web Application
 * Real-time interactive functionality with modern JavaScript
 */

// State management
const state = {
    connectionTime: new Date(),
    colorIndex: 0,
    statsVisible: false,
    particleCount: 20
};

// Color schemes for the color change feature
const colorSchemes = [
    {
        primary: '#4f46e5',
        secondary: '#06b6d4',
        name: 'Ocean Blue'
    },
    {
        primary: '#ec4899',
        secondary: '#f59e0b',
        name: 'Sunset'
    },
    {
        primary: '#10b981',
        secondary: '#8b5cf6',
        name: 'Forest Dream'
    },
    {
        primary: '#ef4444',
        secondary: '#14b8a6',
        name: 'Fire & Ice'
    },
    {
        primary: '#f97316',
        secondary: '#3b82f6',
        name: 'Energy'
    }
];

// Initialize app when DOM is ready
function init() {
    displayConnectionTime();
    createParticles();
    attachEventListeners();
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
    
    // Random size between 3 and 15 pixels
    const size = Math.random() * 12 + 3;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Random horizontal position
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.bottom = '0';
    
    // Random animation delay for staggered effect
    particle.style.animationDelay = `${Math.random() * 20}s`;
    
    // Random animation duration
    particle.style.animationDuration = `${15 + Math.random() * 10}s`;
    
    container.appendChild(particle);
}

/**
 * Attach event listeners to interactive elements
 */
function attachEventListeners() {
    const colorBtn = document.getElementById('colorBtn');
    const statsBtn = document.getElementById('statsBtn');

    if (colorBtn) {
        colorBtn.addEventListener('click', handleColorChange);
    }

    if (statsBtn) {
        statsBtn.addEventListener('click', handleStatsToggle);
    }
}

/**
 * Handle color scheme change
 */
function handleColorChange() {
    state.colorIndex = (state.colorIndex + 1) % colorSchemes.length;
    const scheme = colorSchemes[state.colorIndex];
    
    applyColorScheme(scheme);
    showNotification(`Color scheme changed to: ${scheme.name}`);
}

/**
 * Apply a color scheme to the page
 */
function applyColorScheme(scheme) {
    const root = document.documentElement;
    
    // Animate color transition
    root.style.transition = 'all 0.6s ease';
    root.style.setProperty('--primary-color', scheme.primary);
    root.style.setProperty('--secondary-color', scheme.secondary);
    
    // Update button hover states
    const primaryHover = adjustColorBrightness(scheme.primary, -20);
    root.style.setProperty('--primary-hover', primaryHover);
}

/**
 * Adjust color brightness
 */
function adjustColorBrightness(hex, percent) {
    // Convert hex to RGB
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + percent));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + percent));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + percent));
    
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Handle stats display toggle
 */
function handleStatsToggle() {
    state.statsVisible = !state.statsVisible;
    const statsDisplay = document.getElementById('statsDisplay');
    const statsBtn = document.getElementById('statsBtn');

    if (!statsDisplay || !statsBtn) return;

    if (state.statsVisible) {
        statsDisplay.classList.remove('hidden');
        statsBtn.textContent = 'Hide Stats';
        updateStats();
    } else {
        statsDisplay.classList.add('hidden');
        statsBtn.textContent = 'Show Stats';
    }
}

/**
 * Update connection statistics
 */
function updateStats() {
    const statsList = document.getElementById('statsList');
    if (!statsList) return;

    const stats = gatherStats();
    
    statsList.innerHTML = '';
    
    stats.forEach((stat, index) => {
        const li = document.createElement('li');
        li.style.animationDelay = `${index * 0.1}s`;
        li.innerHTML = `<strong>${stat.label}:</strong> ${stat.value}`;
        statsList.appendChild(li);
    });
}

/**
 * Gather system and connection statistics
 */
function gatherStats() {
    const uptime = Math.floor((Date.now() - state.connectionTime) / 1000);
    const minutes = Math.floor(uptime / 60);
    const seconds = uptime % 60;

    return [
        {
            label: 'Connection Time',
            value: state.connectionTime.toLocaleString()
        },
        {
            label: 'Session Duration',
            value: `${minutes}m ${seconds}s`
        },
        {
            label: 'Browser',
            value: getBrowserInfo()
        },
        {
            label: 'Screen Size',
            value: `${window.innerWidth} × ${window.innerHeight}px`
        },
        {
            label: 'User Agent',
            value: navigator.userAgent.length > 100 
                ? navigator.userAgent.substring(0, 100) + '...'
                : navigator.userAgent
        },
        {
            label: 'Language',
            value: navigator.language
        },
        {
            label: 'Platform',
            value: navigator.platform
        },
        {
            label: 'Online Status',
            value: navigator.onLine ? 'Connected' : 'Offline'
        },
        {
            label: 'Color Scheme',
            value: colorSchemes[state.colorIndex].name
        }
    ];
}

/**
 * Get browser information
 */
function getBrowserInfo() {
    const ua = navigator.userAgent;
    
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    
    return 'Unknown Browser';
}

/**
 * Show a temporary notification
 */
function showNotification(message) {
    // Remove existing notification if present
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

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

/**
 * Log initialization for diagnostics
 */
function logInitialization() {
    console.log('%c[CAPTIVE PORTAL] Initialized', 'font-size: 18px; font-weight: bold; color: #4f46e5;');
    console.log('%cConnection Details:', 'font-size: 14px; font-weight: bold; color: #06b6d4;');
    console.log('  Time:', state.connectionTime.toLocaleString());
    console.log('  Browser:', getBrowserInfo());
    console.log('  Screen:', `${window.innerWidth} × ${window.innerHeight}px`);
    console.log('  Platform:', navigator.platform);
    console.log('%cInteractive Features:', 'font-size: 14px; font-weight: bold; color: #10b981;');
    console.log('  [+] Color scheme switcher');
    console.log('  [+] Connection statistics');
    console.log('  [+] Animated particles');
    console.log('  [+] Responsive design');
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
    `;
    document.head.appendChild(style);
}

/**
 * Handle window resize for responsive behavior
 */
function handleResize() {
    // Update stats if visible
    if (state.statsVisible) {
        updateStats();
    }
}

/**
 * Handle visibility change (when tab becomes active/inactive)
 */
function handleVisibilityChange() {
    if (!document.hidden && state.statsVisible) {
        updateStats();
    }
}

// Add event listeners for system events
window.addEventListener('resize', debounce(handleResize, 250));
document.addEventListener('visibilitychange', handleVisibilityChange);

/**
 * Debounce function to limit function execution frequency
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Update session duration periodically
 */
function startSessionTimer() {
    setInterval(() => {
        if (state.statsVisible) {
            updateStats();
        }
    }, 1000);
}

// Initialize dynamic styles
addDynamicStyles();

// Start session timer
startSessionTimer();

// Initialize app when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM is already loaded
    init();
}

// Export functions for potential external use
export { init, gatherStats, applyColorScheme };

