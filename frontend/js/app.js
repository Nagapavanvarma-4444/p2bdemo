/**
 * PLAN 2 BUILD — Global Application JavaScript
 * Handles: Auth state, theme toggle, navigation, toast notifications, API calls
 */

const API_BASE = window.location.origin + '/api';

// ===========================
// Auth State Management
// ===========================
const Auth = {
    getToken() {
        return localStorage.getItem('p2b_token');
    },
    getUser() {
        const user = localStorage.getItem('p2b_user');
        return user ? JSON.parse(user) : null;
    },
    setAuth(token, user) {
        localStorage.setItem('p2b_token', token);
        localStorage.setItem('p2b_user', JSON.stringify(user));
    },
    logout() {
        localStorage.removeItem('p2b_token');
        localStorage.removeItem('p2b_user');
        window.location.href = '/login.html';
    },
    isLoggedIn() {
        return !!this.getToken();
    },
    isEngineer() {
        const user = this.getUser();
        return user && user.role === 'engineer';
    },
    isCustomer() {
        const user = this.getUser();
        return user && user.role === 'customer';
    },
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    }
};

// ===========================
// API Helper
// ===========================
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const token = Auth.getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Remove Content-Type if FormData (let browser set it)
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            body: options.body instanceof FormData ? options.body : 
                  options.body ? JSON.stringify(options.body) : undefined
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        if (error.message.includes('Token has expired') || error.message.includes('Invalid token')) {
            Auth.logout();
        }
        throw error;
    }
}

// ===========================
// Theme Management
// ===========================
const Theme = {
    init() {
        const saved = localStorage.getItem('p2b_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        this.updateIcon(saved);
    },
    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('p2b_theme', next);
        this.updateIcon(next);
    },
    updateIcon(theme) {
        const toggleBtn = document.querySelector('.theme-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        }
    }
};

// ===========================
// Toast Notifications
// ===========================
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ===========================
// Navigation Builder
// ===========================
function buildNavbar() {
    const user = Auth.getUser();
    const isLoggedIn = Auth.isLoggedIn();

    let navLinks = `
        <a href="/">Home</a>
        <a href="/engineers.html">Find Engineers</a>
        <a href="/subscription.html">Pricing</a>
        <a href="/contact.html">Contact</a>
    `;

    if (isLoggedIn) {
        if (user.role === 'customer') {
            navLinks += `
                <a href="/post-project.html">Post Project</a>
                <a href="/customer-dashboard.html">Dashboard</a>
            `;
        } else if (user.role === 'engineer') {
            navLinks += `
                <a href="/engineer-dashboard.html">Dashboard</a>
            `;
        } else if (user.role === 'admin') {
            navLinks += `
                <a href="/admin.html">Admin</a>
            `;
        }
    }

    let navActions = `
        <button class="theme-toggle" onclick="Theme.toggle()">🌙</button>
    `;

    if (isLoggedIn) {
        navActions += `
            <a href="/messages.html" class="notification-bell" title="Messages">💬</a>
            <div class="notification-bell" onclick="toggleNotifications()" title="Notifications">
                🔔
                <span class="notification-badge" id="notif-badge" style="display:none">0</span>
            </div>
            <div class="avatar" onclick="toggleUserMenu()" style="cursor:pointer" title="${user.name}">
                ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}">` : user.name.charAt(0).toUpperCase()}
            </div>
            <div id="user-menu" class="user-dropdown" style="display:none">
                <div class="user-dropdown-header">
                    <strong>${user.name}</strong>
                    <span>${user.role}</span>
                </div>
                <a href="/${user.role === 'engineer' ? 'engineer' : 'customer'}-dashboard.html">Dashboard</a>
                <a href="/messages.html">Messages</a>
                <button onclick="Auth.logout()">Logout</button>
            </div>
        `;
    } else {
        navActions += `
            <a href="/login.html" class="btn btn-secondary btn-sm">Login</a>
            <a href="/register.html" class="btn btn-primary btn-sm">Get Started</a>
        `;
    }

    return `
    <nav class="navbar">
        <div class="container">
            <a href="/" class="nav-logo">
                <div class="logo-icon">P2B</div>
                <span>PLAN 2 BUILD</span>
            </a>
            <div class="nav-links" id="nav-links">
                ${navLinks}
            </div>
            <div class="nav-actions">
                ${navActions}
            </div>
            <button class="hamburger" onclick="toggleMobileMenu()">
                <span></span><span></span><span></span>
            </button>
        </div>
    </nav>
    `;
}

// ===========================
// Footer Builder
// ===========================
function buildFooter() {
    return `
    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <a href="/" class="nav-logo" style="margin-bottom:8px;display:inline-flex">
                        <div class="logo-icon">P2B</div>
                        <span>PLAN 2 BUILD</span>
                    </a>
                    <p>The premier marketplace connecting customers with verified engineers and construction professionals. Build your dream project with confidence.</p>
                </div>
                <div class="footer-col">
                    <h4>Platform</h4>
                    <a href="/engineers.html">Find Engineers</a>
                    <a href="/post-project.html">Post a Project</a>
                    <a href="/subscription.html">Pricing Plans</a>
                    <a href="/contact.html">Contact Us</a>
                </div>
                <div class="footer-col">
                    <h4>Categories</h4>
                    <a href="/engineers.html?category=Civil Engineer">Civil Engineers</a>
                    <a href="/engineers.html?category=Architect">Architects</a>
                    <a href="/engineers.html?category=Interior Designer">Interior Designers</a>
                    <a href="/engineers.html?category=Contractor">Contractors</a>
                </div>
                <div class="footer-col">
                    <h4>Company</h4>
                    <a href="#">About Us</a>
                    <a href="#">Careers</a>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>© ${new Date().getFullYear()} PLAN 2 BUILD. All rights reserved.</p>
                <div class="social-links">
                    <a href="#" title="Twitter">𝕏</a>
                    <a href="#" title="LinkedIn">in</a>
                    <a href="#" title="Instagram">📷</a>
                    <a href="#" title="YouTube">▶</a>
                </div>
            </div>
        </div>
    </footer>
    `;
}

// ===========================
// Mobile Menu Toggle
// ===========================
function toggleMobileMenu() {
    const links = document.getElementById('nav-links');
    links.classList.toggle('open');
}

// ===========================
// User Dropdown
// ===========================
function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// ===========================
// Notification Bell
// ===========================
async function loadNotificationCount() {
    if (!Auth.isLoggedIn()) return;
    try {
        const data = await apiCall('/notifications/unread-count');
        const badge = document.getElementById('notif-badge');
        if (badge && data.unread_count > 0) {
            badge.textContent = data.unread_count > 9 ? '9+' : data.unread_count;
            badge.style.display = 'flex';
        }
    } catch (e) { /* silent */ }
}

function toggleNotifications() {
    // Simple redirect to a notifications view; could be expanded to dropdown
    window.location.href = '/customer-dashboard.html?tab=notifications';
}

// ===========================
// Star Rating HTML Helper
// ===========================
function starsHTML(rating, max = 5) {
    let html = '<div class="stars">';
    for (let i = 1; i <= max; i++) {
        html += i <= Math.round(rating) ? '⭐' : '<span class="star-empty">☆</span>';
    }
    html += '</div>';
    return html;
}

// ===========================
// Time Formatting
// ===========================
function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount);
}

// ===========================
// Page Initialization
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    Theme.init();

    // Inject navbar
    const navPlaceholder = document.getElementById('navbar-placeholder');
    if (navPlaceholder) {
        navPlaceholder.innerHTML = buildNavbar();
        Theme.init(); // Re-init icon after navbar injection
    }

    // Inject footer
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = buildFooter();
    }

    // Highlight active nav link
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // Load notification count
    loadNotificationCount();

    // Close user menu on outside click
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('user-menu');
        if (menu && !e.target.closest('.avatar') && !e.target.closest('#user-menu')) {
            menu.style.display = 'none';
        }
    });

    // Intersection Observer for scroll animations
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeInUp');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
});

// User dropdown styles (injected dynamically)
const dropdownStyles = document.createElement('style');
dropdownStyles.textContent = `
.user-dropdown {
    position: absolute;
    top: calc(var(--nav-height) - 4px);
    right: 20px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--space-sm);
    min-width: 200px;
    box-shadow: var(--shadow-xl);
    z-index: 1001;
}
.user-dropdown-header {
    padding: var(--space-md);
    border-bottom: 1px solid var(--border-color);
    margin-bottom: var(--space-sm);
}
.user-dropdown-header strong { display: block; font-size: 0.95rem; }
.user-dropdown-header span { font-size: 0.8rem; color: var(--text-muted); text-transform: capitalize; }
.user-dropdown a, .user-dropdown button {
    display: block;
    width: 100%;
    padding: 10px var(--space-md);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: 0.9rem;
    text-decoration: none;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    transition: background var(--transition-fast);
    font-family: var(--font-body);
}
.user-dropdown a:hover, .user-dropdown button:hover {
    background: var(--hover-bg);
    color: var(--gold);
}
`;
document.head.appendChild(dropdownStyles);
