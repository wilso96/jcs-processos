/**
 * JCS-Processos - API Integration Module
 */

const API_BASE_URL = window.location.origin;

// ============================================
// API Client Class
// ============================================
class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    /**
     * Get stored auth token
     */
    getToken() {
        return localStorage.getItem('token');
    }

    /**
     * Set auth token
     */
    setToken(token) {
        localStorage.setItem('token', token);
    }

    /**
     * Clear auth token
     */
    clearToken() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    /**
     * Get stored user data
     */
    getUser() {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Set user data
     */
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Make authenticated request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle unauthorized
            if (response.status === 401) {
                this.clearToken();
                window.location.href = 'index.html';
                throw new Error('Sessão expirada. Faça login novamente.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.erro || data.message || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Não foi possível conectar ao servidor');
            }
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// ============================================
// Create global API instance
// ============================================
const api = new APIClient(API_BASE_URL);

// ============================================
// Utility Functions
// ============================================

/**
 * Show loading overlay
 */
function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = '<div class="spinner-large"></div>';
    document.body.appendChild(overlay);
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Format date to Brazilian format
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

/**
 * Format date with time
 */
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get initials from name
 */
function getInitials(name) {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

/**
 * Truncate text
 */
function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existing = document.querySelector('.toast-container');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#2563eb'};
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => toast.remove(), 5000);
}

// Add animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    .toast button {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0.8;
    }
    .toast button:hover { opacity: 1; }
`;
document.head.appendChild(style);
