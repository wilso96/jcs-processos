/**
 * JCS-Processos - Tarefas Module
 * Complete CRUD with filters, modals, statistics and pagination
 */

let currentTarefaId = null;
let tarefasData = [];
let currentPage = 1;
const itemsPerPage = 20;
let totalTarefas = 0;

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    if (!protectPage()) return;
    loadUserInfo();
    loadTarefas();
    loadResponsaveis();
    loadEquipes();
    
    // Form submit handler
    document.getElementById('tarefaForm').addEventListener('submit', saveTarefa);
    
    // Set today's date as default
    var today = new Date().toISOString().split('T')[0];
    document.getElementById('tarefaData').value = today;
});

// ============================================
// Load Functions
// ============================================
function loadUserInfo() {
    var user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.nome || 'Usuario';
        document.getElementById('userRole').textContent = user.perfil || 'Sem perfil';
        document.getElementById('userAvatar').textContent = getInitials(user.nome);
    }
}

async function loadTarefas() {
    var tbody = document.getElementById('tarefasTable');
    
    // Show loading
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;"><div class="spinner" style="margin:0 auto;"></div> Carregando...</td></tr>';
    
    try {
        // Build query params from filters
        var params = new URLSearchParams();
        
        var status = document.getElementById('filterStatus').value;
        var prioridade = document.getElementById('filterPrioridade').value;
        var dataDe = document.getElementById('filterDataDe').value;
        var dataAte = document.getElementById('filterDataAte').value;
        
        if (status) params.append('status', status);
        if (prioridade) params.append('prioridade', prioridade);
        if (dataDe) params.append('data_de', dataDe);
        if (dataAte) params.append('data_ate', dataAte);
        
        // Pagination params
        params.append('page', currentPage);
        params.append('limit', itemsPerPage);
        
        var queryString = params.toString();
        var endpoint = '/tarefas' + (queryString ? '?' + queryString : '');
        
        console.log('Loading tarefas:', endpoint);
        var data = await api.get(endpoint);
        
        // Handle response - API returns array directly
        if (Array.isArray(data)) {
            tarefasData = data;
            // Try to get total from headers or estimate
            totalTarefas = data.length;
        } else if (data && Array.isArray(data.tarefas)) {
            tarefasData = data.tarefas;
            totalTarefas = data.total || data.tarefas.length;
        } else {
            tarefasData = [];
            totalTarefas = 0;
        }
        
        console.log('Tarefas carregadas:', tarefasData.length);
        
        // Update statistics (we need to fetch all for accurate stats, or calculate from current page)
        // For now, just update the current page info
        updatePaginationInfo();
        
        // Update count display
        var startItem = (currentPage - 1) * itemsPerPage + 1;
        var endItem = Math.min(currentPage * itemsPerPage, totalTarefas);
        document.getElementById('totalCount').textContent = 
            totalTarefas > 0 
                ? startItem + '-' + endItem + ' de ' + totalTarefas + ' tarefa(s)'
                : '0 tarefa(s)';
        
        // Clear table
        tbody.innerHTML = '';
        
        if (tarefasData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">Nenhuma tarefa encontrada.</td></tr>';
            renderPagination();
            return;
        }
        
        // Render each task
        tarefasData.forEach(function(tarefa) {
            var tr = document.createElement('tr');
            tr.innerHTML = 
                '<td><strong>' + escapeHtml(tarefa.titulo || '-') + '</strong></td>' +
                '<td>' + getPrioridadeBadge(tarefa.prioridade) + '</td>' +
                '<td>' + escapeHtml(tarefa.responsavel_nome || '-') + '</td>' +
                '<td>' + escapeHtml(tarefa.equipe_nome || '-') + '</td>' +
                '<td>' + formatDate(tarefa.data_programada) + '</td>' +
                '<td>' + getStatusBadge(tarefa.status) + '</td>' +
                '<td>' +
                    '<button onclick="viewTarefa(' + tarefa.id + ')" style="padding:6px 10px;margin-right:4px;">Ver</button>' +
                    '<button onclick="editarTarefa(' + tarefa.id + ')" style="padding:6px 10px;margin-right:4px;">Editar</button>' +
                    '<button onclick="confirmarExcluirTarefa(' + tarefa.id + ')" style="padding:6px 10px;">Excluir</button>' +
                '</td>';
            tbody.appendChild(tr);
        });
        
        // Render pagination
        renderPagination();
        
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;padding:20px;">Erro ao carregar tarefas: ' + escapeHtml(error.message) + '</td></tr>';
    }
}

// ============================================
// Pagination
// ============================================
function updatePaginationInfo() {
    var startItem = (currentPage - 1) * itemsPerPage + 1;
    var endItem = Math.min(currentPage * itemsPerPage, totalTarefas);
    
    document.getElementById('totalCount').textContent = 
        totalTarefas > 0 
            ? startItem + '-' + endItem + ' de ' + totalTarefas + ' tarefa(s)'
            : '0 tarefa(s)';
}

function renderPagination() {
    var paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;
    
    var totalPages = Math.ceil(totalTarefas / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    var html = '<div class="pagination">';
    
    // Previous button
    html += '<button class="pagination-btn" onclick="goToPage(' + (currentPage - 1) + ')" ' + (currentPage === 1 ? 'disabled' : '') + '>';
    html += '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>';
    html += '</button>';
    
    // Page numbers
    var maxVisiblePages = 5;
    var startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    var endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        html += '<button class="pagination-btn" onclick="goToPage(1)">1</button>';
        if (startPage > 2) {
            html += '<span class="pagination-ellipsis">...</span>';
        }
    }
    
    for (var i = startPage; i <= endPage; i++) {
        html += '<button class="pagination-btn ' + (i === currentPage ? 'active' : '') + '" onclick="goToPage(' + i + ')">' + i + '</button>';
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += '<span class="pagination-ellipsis">...</span>';
        }
        html += '<button class="pagination-btn" onclick="goToPage(' + totalPages + ')">' + totalPages + '</button>';
    }
    
    // Next button
    html += '<button class="pagination-btn" onclick="goToPage(' + (currentPage + 1) + ')" ' + (currentPage === totalPages ? 'disabled' : '') + '>';
    html += '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>';
    html += '</button>';
    
    html += '</div>';
    
    paginationContainer.innerHTML = html;
}

function goToPage(page) {
    var totalPages = Math.ceil(totalTarefas / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadTarefas();
}

// ============================================
// Load Related Data
// ============================================
async function loadResponsaveis() {
    try {
        var data = await api.get('/usuarios');
        var usuarios = Array.isArray(data) ? data : (data.usuarios || []);
        
        var select = document.getElementById('tarefaResponsavel');
        select.innerHTML = '<option value="">Selecione...</option>';
        
        usuarios.forEach(function(usuario) {
            select.innerHTML += '<option value="' + usuario.id + '">' + escapeHtml(usuario.nome) + '</option>';
        });
    } catch (error) {
        console.error('Erro ao carregar responsaveis:', error);
    }
}

async function loadEquipes() {
    try {
        var data = await api.get('/equipes');
        var equipes = Array.isArray(data) ? data : (data.equipes || []);
        
        var select = document.getElementById('tarefaEquipe');
        select.innerHTML = '<option value="">Selecione...</option>';
        
        equipes.forEach(function(equipe) {
            select.innerHTML += '<option value="' + equipe.id + '">' + escapeHtml(equipe.nome) + '</option>';
        });
    } catch (error) {
        console.error('Erro ao carregar equipes:', error);
    }
}

// ============================================
// Statistics
// ============================================
function updateStatistics(tarefas) {
    var total = tarefas.length;
    var pendentes = tarefas.filter(function(t) { return t.status === 'pendente'; }).length;
    var emAndamento = tarefas.filter(function(t) { return t.status === 'em_andamento'; }).length;
    var concluidas = tarefas.filter(function(t) { return t.status === 'concluida'; }).length;
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPendentes').textContent = pendentes;
    document.getElementById('statEmAndamento').textContent = emAndamento;
    document.getElementById('statConcluidas').textContent = concluidas;
}

// ============================================
// Modal Functions
// ============================================
function openTarefaModal(tarefa) {
    currentTarefaId = tarefa ? tarefa.id : null;
    var modal = document.getElementById('tarefaModal');
    var title = document.getElementById('modalTitle');
    
    document.getElementById('tarefaForm').reset();
    
    // Reset recurrence fields
    document.getElementById('tarefaDiaria').checked = false;
    document.getElementById('diasSemanaContainer').style.display = 'none';
    var dayCheckboxes = document.querySelectorAll('input[name="diasSemana"]');
    dayCheckboxes.forEach(function(cb) { cb.checked = false; });
    
    var today = new Date().toISOString().split('T')[0];
    document.getElementById('tarefaData').value = today;
    
    if (tarefa) {
        title.textContent = 'Editar Tarefa';
        document.getElementById('tarefaId').value = tarefa.id;
        document.getElementById('tarefaTitulo').value = tarefa.titulo || '';
        document.getElementById('tarefaDescricao').value = tarefa.descricao || '';
        document.getElementById('tarefaPrioridade').value = tarefa.prioridade || 'media';
        document.getElementById('tarefaStatus').value = tarefa.status || 'pendente';
        document.getElementById('tarefaData').value = tarefa.data_programada ? tarefa.data_programada.split('T')[0] : today;
        document.getElementById('tarefaHora').value = tarefa.hora_programada ? tarefa.hora_programada.substring(0, 5) : '';
        document.getElementById('tarefaResponsavel').value = tarefa.id_responsavel || '';
        document.getElementById('tarefaEquipe').value = tarefa.id_equipe || '';
        document.getElementById('tarefaObservacao').value = tarefa.observacao_geral || '';
        
        // Recurrence fields
        document.getElementById('tarefaOrdemExecucao').value = tarefa.ordem_execucao || 0;
        document.getElementById('tarefaDiaria').checked = tarefa.tarefa_diaria || false;
        
        // Handle days of week
        if (tarefa.tarefa_diaria) {
            document.getElementById('diasSemanaContainer').style.display = 'none';
        } else if (tarefa.dias_semana && tarefa.dias_semana.length > 0) {
            document.getElementById('diasSemanaContainer').style.display = 'block';
            var dayCheckboxes = document.querySelectorAll('input[name="diasSemana"]');
            dayCheckboxes.forEach(function(cb) {
                cb.checked = tarefa.dias_semana.includes(parseInt(cb.value));
            });
        }
    } else {
        title.textContent = 'Nova Tarefa';
    }
    
    modal.style.display = 'flex';
}

function closeTarefaModal() {
    document.getElementById('tarefaModal').style.display = 'none';
    currentTarefaId = null;
}

async function saveTarefa(event) {
    event.preventDefault();
    
    // Collect days of week if not daily
    var diasSemana = [];
    if (!document.getElementById('tarefaDiaria').checked) {
        var dayCheckboxes = document.querySelectorAll('input[name="diasSemana"]:checked');
        dayCheckboxes.forEach(function(cb) {
            diasSemana.push(parseInt(cb.value));
        });
    }
    
    var tarefaData = {
        titulo: document.getElementById('tarefaTitulo').value,
        descricao: document.getElementById('tarefaDescricao').value,
        prioridade: document.getElementById('tarefaPrioridade').value,
        status: document.getElementById('tarefaStatus').value,
        data_programada: document.getElementById('tarefaData').value,
        hora_programada: document.getElementById('tarefaHora').value || null,
        id_responsavel: document.getElementById('tarefaResponsavel').value || null,
        id_equipe: document.getElementById('tarefaEquipe').value || null,
        observacao_geral: document.getElementById('tarefaObservacao').value,
        // New recurrence fields
        ordem_execucao: parseInt(document.getElementById('tarefaOrdemExecucao').value) || 0,
        tarefa_diaria: document.getElementById('tarefaDiaria').checked,
        dias_semana: diasSemana.length > 0 ? diasSemana : null
    };
    
    try {
        if (currentTarefaId) {
            await api.put('/tarefas/' + currentTarefaId, tarefaData);
            alert('Tarefa atualizada com sucesso!');
        } else {
            await api.post('/tarefas', tarefaData);
            alert('Tarefa criada com sucesso!');
        }
        
        closeTarefaModal();
        loadTarefas();
        
    } catch (error) {
        console.error('Erro ao salvar tarefa:', error);
        alert('Erro ao salvar tarefa: ' + error.message);
    }
}

// ============================================
// View, Edit, Delete Functions
// ============================================
async function viewTarefa(id) {
    try {
        var tarefa = await api.get('/tarefas/' + id);
        currentTarefaId = id;
        
        var content = document.getElementById('viewTarefaContent');
        content.innerHTML = 
            '<p><strong>Titulo:</strong> ' + escapeHtml(tarefa.titulo || '-') + '</p>' +
            '<p><strong>Descricao:</strong> ' + escapeHtml(tarefa.descricao || '-') + '</p>' +
            '<p><strong>Status:</strong> ' + getStatusBadge(tarefa.status) + '</p>' +
            '<p><strong>Prioridade:</strong> ' + getPrioridadeBadge(tarefa.prioridade) + '</p>' +
            '<p><strong>Data:</strong> ' + formatDate(tarefa.data_programada) + '</p>' +
            '<p><strong>Responsavel:</strong> ' + escapeHtml(tarefa.responsavel_nome || '-') + '</p>' +
            '<p><strong>Equipe:</strong> ' + escapeHtml(tarefa.equipe_nome || '-') + '</p>' +
            '<p><strong>Observacao:</strong> ' + escapeHtml(tarefa.observacao_geral || '-') + '</p>' +
            '<div style="margin-top:15px;">' +
                '<button onclick="editarTarefa(' + id + ')" class="btn btn-primary" style="margin-right:10px;">Editar</button>' +
                '<button onclick="closeViewTarefaModal()" class="btn btn-soft">Fechar</button>' +
            '</div>';
        
        document.getElementById('viewTarefaModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Erro ao carregar tarefa:', error);
        alert('Erro ao carregar tarefa: ' + error.message);
    }
}

function closeViewTarefaModal() {
    document.getElementById('viewTarefaModal').style.display = 'none';
    currentTarefaId = null;
}

function editarTarefa(id) {
    closeViewTarefaModal();
    var tarefa = tarefasData.find(function(t) { return t.id === id; });
    if (tarefa) {
        openTarefaModal(tarefa);
    }
}

function confirmarExcluirTarefa(id) {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        excluirTarefa(id);
    }
}

async function excluirTarefa(id) {
    try {
        await api.delete('/tarefas/' + id);
        alert('Tarefa excluida com sucesso!');
        closeViewTarefaModal();
        loadTarefas();
    } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        alert('Erro ao excluir tarefa: ' + error.message);
    }
}

// ============================================
// Badge Functions
// ============================================
function getStatusBadge(status) {
    var badges = {
        'pendente': '<span class="badge badge-warning">Pendente</span>',
        'em_andamento': '<span class="badge badge-blue">Em Andamento</span>',
        'concluida': '<span class="badge badge-success">Concluida</span>',
        'cancelada': '<span class="badge badge-gray">Cancelada</span>'
    };
    return badges[status] || '<span class="badge badge-info">' + (status || '-') + '</span>';
}

function getPrioridadeBadge(prioridade) {
    var badges = {
        'baixa': '<span class="badge badge-gray">Baixa</span>',
        'media': '<span class="badge badge-blue">Media</span>',
        'alta': '<span class="badge badge-orange">Alta</span>',
        'urgente': '<span class="badge badge-red">Urgente</span>'
    };
    return badges[prioridade] || '<span class="badge badge-info">' + (prioridade || '-') + '</span>';
}

// ============================================
// Helper Functions
// ============================================
function formatDate(dateString) {
    if (!dateString) return '-';
    var date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function getInitials(name) {
    if (!name) return '--';
    var parts = name.split(' ');
    return parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0] + parts[0][1];
}

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
