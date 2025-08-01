// Octopus Server JavaScript - Enhanced Interactivity
document.addEventListener('DOMContentLoaded', function() {
    // Sidebar functionality
    const sidebar = document.getElementById('octopus-sidebar');
    const nav = document.getElementById('octopus-sidebar-nav');
    const menuToggle = document.getElementById('octopus-menu-toggle');
    const closeBtn = document.getElementById('octopus-sidebar-close-btn');
    const overlay = document.getElementById('octopus-sidebar-overlay');

    const openSidebar = () => {
        if (sidebar && overlay) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
            document.body.classList.add('overflow-hidden'); 
        }
    };

    const closeSidebar = () => {
        if (sidebar && overlay) {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    };

    if (menuToggle) menuToggle.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    
    // Event Delegation for sidebar items
    if (nav) {
        nav.addEventListener('click', (e) => {
            const clickedItem = e.target.closest('.server-sidebar-item');
            if (clickedItem) {
                nav.querySelectorAll('.server-sidebar-item').forEach(item => {
                    item.classList.remove('active');
                });
                clickedItem.classList.add('active');

                // Ripple effect
                const ripple = document.createElement('div');
                ripple.className = 'server-ripple';
                clickedItem.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);

                if (window.innerWidth < 1024) {
                    closeSidebar();
                }
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && !sidebar.classList.contains('-translate-x-full')) {
            closeSidebar();
        }
    });
    
    // Server card hover effects
    const cards = document.querySelectorAll('.server-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
            this.style.boxShadow = '0 25px 50px rgba(99, 102, 241, 0.3)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '';
        });
    });

    // Console auto-scroll functionality
    const consoleContainer = document.querySelector('.server-console-container');
    if (consoleContainer) {
        const observer = new MutationObserver(() => {
            consoleContainer.scrollTop = consoleContainer.scrollHeight;
        });
        observer.observe(consoleContainer, { childList: true, subtree: true });
    }

    // Progress ring animations
    const progressRings = document.querySelectorAll('.server-progress-ring circle:last-child');
    progressRings.forEach(ring => {
        const circumference = 2 * Math.PI * 48;
        ring.style.strokeDasharray = circumference;
        
        // Animate on load
        setTimeout(() => {
            ring.style.transition = 'stroke-dashoffset 1s ease-in-out';
        }, 100);
    });

    // Floating particles animation enhancement
    const particles = document.querySelectorAll('.server-particle');
    particles.forEach((particle, index) => {
        particle.style.animationDelay = `${index * 2}s`;
        particle.style.left = `${Math.random() * 100}%`;
    });

    // Dynamic shooting stars
    function createShootingStar() {
        const star = document.createElement('div');
        star.className = 'server-shooting-star';
        star.style.top = `${Math.random() * 80 + 10}%`;
        star.style.left = '-10%';
        star.style.animationDelay = '0s';
        document.body.appendChild(star);
        
        setTimeout(() => {
            star.remove();
        }, 3000);
    }

    // Create shooting stars periodically
    setInterval(createShootingStar, 8000);

    // Console command history (if console input exists)
    const consoleInput = document.querySelector('.server-console-input');
    if (consoleInput) {
        let commandHistory = JSON.parse(localStorage.getItem('octopus-command-history') || '[]');
        let historyIndex = -1;

        consoleInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    consoleInput.value = commandHistory[historyIndex] || '';
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex > -1) {
                    historyIndex--;
                    consoleInput.value = commandHistory[historyIndex] || '';
                }
            } else if (e.key === 'Enter') {
                const command = consoleInput.value.trim();
                if (command) {
                    commandHistory.unshift(command);
                    commandHistory = commandHistory.slice(0, 50); // Keep last 50 commands
                    localStorage.setItem('octopus-command-history', JSON.stringify(commandHistory));
                    historyIndex = -1;
                }
            }
        });
    }

    // Power button loading states
    const powerButtons = document.querySelectorAll('[data-power-action]');
    powerButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.add('opacity-75');
            this.disabled = true;
            
            // Re-enable after 3 seconds (adjust based on actual server response)
            setTimeout(() => {
                this.classList.remove('opacity-75');
                this.disabled = false;
            }, 3000);
        });
    });

    // Smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Copy to clipboard functionality
    const copyButtons = document.querySelectorAll('[data-copy]');
    copyButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const text = this.getAttribute('data-copy');
            try {
                await navigator.clipboard.writeText(text);
                
                // Visual feedback
                const originalText = this.textContent;
                this.textContent = 'Copied!';
                this.classList.add('server-glow-effect');
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.classList.remove('server-glow-effect');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });
    });

    // Real-time clock for uptime display
    function updateClock() {
        const clockElements = document.querySelectorAll('.server-uptime-clock');
        clockElements.forEach(element => {
            const startTime = parseInt(element.getAttribute('data-start-time'));
            if (startTime) {
                const now = Date.now();
                const uptime = Math.floor((now - startTime) / 1000);
                element.textContent = formatUptime(uptime);
            }
        });
    }

    function formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    // Update clock every minute
    setInterval(updateClock, 60000);
    updateClock(); // Initial call

    // Lazy loading for images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));

    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('Octopus Server Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
            }, 0);
        });
    }

    // Error handling for failed requests
    window.addEventListener('unhandledrejection', event => {
        console.error('Unhandled promise rejection:', event.reason);
        // You could show a user-friendly error message here
    });

    // Initialize tooltips if any exist
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'server-tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        });
        
        element.addEventListener('mouseleave', function() {
            const tooltip = document.querySelector('.server-tooltip');
            if (tooltip) tooltip.remove();
        });
    });
});

// CSS for dynamic tooltip
const tooltipStyle = document.createElement('style');
tooltipStyle.textContent = `
    .server-tooltip {
        position: absolute;
        background: rgba(15, 23, 42, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
`;
document.head.appendChild(tooltipStyle);
