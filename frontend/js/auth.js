/**
 * JCS-Processos - Authentication Module
 */

// ============================================
// Login Form Handler
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        // Check if already logged in
        if (api.isAuthenticated()) {
            redirectBasedOnRole();
            return;
        }

        loginForm.addEventListener('submit', handleLogin);
    }
});

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const errorDiv = document.getElementById('loginError');
    const btn = e.target.querySelector('button');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');

    // Clear previous errors
    errorDiv.style.display = 'none';
    
    // Show loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';

    try {
        const response = await api.post('/auth/login', { 
            email, 
            senha 
        });
        
        // Store token and user data
        api.setToken(response.token);
        api.setUser(response.usuario);
        
        // Redirect based on role
        redirectBasedOnRole();
        
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

/**
 * Redirect user based on their role
 */
function redirectBasedOnRole() {
    const user = api.getUser();
    
    // COLABORADOR vai direto para Minhas Tarefas
    if (user.perfil === 'colaborador') {
        window.location.href = 'minhas-tarefas.html';
        return;
    }
    
    // Admin e Supervisor vão para o Dashboard
    window.location.href = 'dashboard.html';
}

/**
 * Logout function (to be called from any page)
 */
function logout() {
    api.clearToken();
    window.location.href = 'index.html';
}

/**
 * Get current user data
 */
function getCurrentUser() {
    return api.getUser();
}

/**
 * Check if user has specific role
 */
function hasRole(role) {
    const user = api.getUser();
    return user && user.perfil === role;
}

/**
 * Check if user is supervisor or admin
 */
function isSupervisorOrAdmin() {
    const user = api.getUser();
    return user && ['supervisor', 'admin'].includes(user.perfil?.toLowerCase());
}

/**
 * Check if user is a COLABORADOR
 */
function isColaborador() {
    const user = api.getUser();
    return user && user.perfil === 'colaborador';
}

/**
 * Protect page - redirect if not authenticated
 */
function protectPage() {
    if (!api.isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}
