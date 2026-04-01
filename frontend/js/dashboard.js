/**
 * JCS-Processos - Dashboard Module
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!protectPage()) return;
    loadUserInfo();
    loadDashboard();
});

/**
 * Load user information in sidebar
 */
function loadUserInfo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.nome || 'Usuário';
        document.getElementById('userRole').textContent = user.perfil || 'Sem perfil';
        document.getElementById('userAvatar').textContent = getInitials(user.nome);
    }
}

/**
 * Load dashboard statistics
 */
async function loadDashboard() {
    try {
        // Load all data in parallel
        const [tarefas, usuarios, equipes, areas, unidades] = await Promise.all([
            loadTarefas(),
            loadUsuarios(),
            loadEquipes(),
            loadAreas(),
            loadUnidades()
        ]);

        // Calculate statistics
        const tarefasStats = calculateTarefaStats(tarefas);
        
        // Update statistics cards - Tarefas
        document.getElementById('totalTarefas').textContent = tarefasStats.total;
        document.getElementById('tarefasPendentes').textContent = tarefasStats.pendentes;
        document.getElementById('tarefasEmAndamento').textContent = tarefasStats.emAndamento;
        document.getElementById('tarefasConcluidas').textContent = tarefasStats.concluidas;

        // Update statistics cards - Sistema
        document.getElementById('totalUsuarios').textContent = usuarios.length;
        document.getElementById('totalEquipes').textContent = equipes.length;
        document.getElementById('totalAreas').textContent = areas.length;
        document.getElementById('totalUnidades').textContent = unidades.length;

        // Load recent activity
        loadRecentActivity(tarefas);

    } catch (error) {
        showToast('Erro ao carregar dados: ' + error.message, 'error');
        console.error('Dashboard load error:', error);
    }
}

/**
 * Calculate tarefa statistics
 */
function calculateTarefaStats(tarefas) {
    const stats = {
        total: tarefas.length,
        pendentes: 0,
        emAndamento: 0,
        concluidas: 0,
        canceladas: 0
    };

    tarefas.forEach(tarefa => {
        const status = (tarefa.status || '').toLowerCase();
        if (status === 'pendente') {
            stats.pendentes++;
        } else if (status === 'em_andamento' || status === 'em-andamento') {
            stats.emAndamento++;
        } else if (status === 'concluida' || status === 'concluído' || status === 'concluido') {
            stats.concluidas++;
        } else if (status === 'cancelada' || status === 'cancelado') {
            stats.canceladas++;
        } else {
            stats.pendentes++; // Default to pending
        }
    });

    return stats;
}

/**
 * Load tarefas
 */
async function loadTarefas() {
    try {
        const data = await api.get('/tarefas');
        return Array.isArray(data) ? data : (data.tarefas || []);
    } catch (error) {
        console.warn('Tarefas API error:', error.message);
        return [];
    }
}

/**
 * Load usuarios
 */
async function loadUsuarios() {
    try {
        const data = await api.get('/usuarios');
        return Array.isArray(data) ? data : (data.usuarios || []);
    } catch (error) {
        console.warn('Usuarios API error:', error.message);
        return [];
    }
}

/**
 * Load equipes
 */
async function loadEquipes() {
    try {
        const data = await api.get('/equipes');
        return Array.isArray(data) ? data : (data.equipes || []);
    } catch (error) {
        console.warn('Equipes API error:', error.message);
        return [];
    }
}

/**
 * Load areas
 */
async function loadAreas() {
    try {
        const data = await api.get('/areas');
        return Array.isArray(data) ? data : (data.areas || []);
    } catch (error) {
        console.warn('Areas API error:', error.message);
        return [];
    }
}

/**
 * Load unidades
 */
async function loadUnidades() {
    try {
        const data = await api.get('/unidades');
        return Array.isArray(data) ? data : (data.unidades || []);
    } catch (error) {
        console.warn('Unidades API error:', error.message);
        return [];
    }
}

/**
 * Load recent activity in table
 */
function loadRecentActivity(tarefas) {
    const tbody = document.getElementById('recentActivity');
    
    if (!tarefas || tarefas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="empty-state">
                    <p>Nenhuma tarefa encontrada.</p>
                </td>
            </tr>
        `;
        return;
    }

    // Show last 8 tarefas
    const recentTarefas = tarefas.slice(0, 8);

    tbody.innerHTML = recentTarefas.map(tarefa => {
        const statusBadge = getStatusBadge(tarefa.status);
        const titulo = tarefa.titulo || 'Sem título';
        const responsavel = tarefa.responsavel_nome || tarefa.responsavel || 'Não atribuído';
        
        return `
            <tr>
                <td>
                    <strong style="color: #16375f;">${truncateText(titulo, 35)}</strong>
                    <br>
                    <small style="color: #64748b;">
                        ${formatDate(tarefa.data_programada)}
                        ${tarefa.hora_programada ? ' às ' + tarefa.hora_programada.substring(0, 5) : ''}
                    </small>
                </td>
                <td>${responsavel}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    if (!status) return '<span class="badge badge-info">--</span>';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'pendente') {
        return '<span class="badge badge-warning">Pendente</span>';
    } else if (statusLower === 'em_andamento' || statusLower === 'em-andamento') {
        return '<span class="badge badge-blue">Em Andamento</span>';
    } else if (statusLower.includes('concluid') || statusLower.includes('finalizad') || statusLower.includes('completo')) {
        return '<span class="badge badge-success">Concluída</span>';
    } else if (statusLower.includes('cancelad') || statusLower.includes('inativo')) {
        return '<span class="badge badge-gray">Cancelada</span>';
    }
    
    return `<span class="badge badge-info">${status}</span>`;
}
