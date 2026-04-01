// ============================================
// JCS-Processos - Equipes JavaScript
// ============================================

// Estado atual
let equipesData = [];
let unidadeSelect = document.getElementById('equipeUnidade');

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

// Carregar lista de equipes
async function loadEquipes() {
    const table = document.getElementById('equipesTable');
    table.innerHTML = `
        <tr>
            <td colspan="5" class="empty-state">
                <p>Carregando equipes...</p>
            </td>
        </tr>
    `;

    try {
        equipesData = await api.get('/equipes');
        
        if (equipesData.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <p>Nenhuma equipe encontrada.</p>
                        <small>Clique em "Nova Equipe" para criar a primeira.</small>
                    </td>
                </tr>
            `;
            return;
        }

        table.innerHTML = equipesData.map(equipe => `
            <tr>
                <td>
                    <div class="equipe-info">
                        <strong>${escapeHtml(equipe.nome || '')}</strong>
                        ${equipe.descricao ? `<small>${escapeHtml(equipe.descricao)}</small>` : ''}
                    </div>
                </td>
                <td>${escapeHtml(equipe.unidade_nome || '-')}</td>
                <td>
                    <div class="lider-info">
                        ${equipe.lider_nome ? `
                            <div class="user-avatar small">${getInitials(equipe.lider_nome)}</div>
                            <span>${escapeHtml(equipe.lider_nome)}</span>
                        ` : '<span class="text-muted">Sem líder</span>'}
                    </div>
                </td>
                <td>
                    <span class="badge-membros">${equipe.total_membros || 0} membros</span>
                </td>
                <td>
                    <span class="status-badge ${equipe.ativo ? 'status-ativo' : 'status-inativo'}">
                        ${equipe.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="verMembros(${equipe.id}, '${escapeHtml(equipe.nome || '')}')" title="Ver Membros">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                        </button>
                        <button class="action-btn" onclick="editarEquipe(${equipe.id})" title="Editar">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button class="action-btn action-danger" onclick="excluirEquipe(${equipe.id})" title="Excluir">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Erro ao carregar equipes:', err);
        table.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <p>Erro ao carregar equipes.</p>
                    <small>${err.message}</small>
                </td>
            </tr>
        `;
    }
}

// Carregar unidades para selects
async function loadUnidades() {
    try {
        const unidades = await api.get('/unidades');
        const select = document.getElementById('equipeUnidade');
        
        if (select) {
            select.innerHTML = '<option value="">Selecione uma unidade...</option>' +
                unidades.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}</option>`).join('');
        }
        
        const filtroUnidade = document.getElementById('filtroUnidade');
        if (filtroUnidade) {
            filtroUnidade.innerHTML = '<option value="">Todas as unidades</option>' +
                unidades.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}</option>`).join('');
        }
    } catch (err) {
        console.error('Erro ao carregar unidades:', err);
    }
}

// Carregar usuários disponíveis para adicionar à equipe
async function loadUsuariosDisponiveis(idEquipa) {
    try {
        const [usuarios, membros] = await Promise.all([
            api.get('/usuarios'),
            api.get(`/equipes/${idEquipa}/membros`)
        ]);
        
        // Filtrar usuários que já são membros
        const membrosIds = membros.map(m => m.id);
        const disponiveis = usuarios.filter(u => !membrosIds.includes(u.id) && u.ativo);
        
        const select = document.getElementById('novoMembroSelect');
        if (select) {
            select.innerHTML = '<option value="">Selecione um colaborador...</option>' +
                disponiveis.map(u => `<option value="${u.id}">${escapeHtml(u.nome)} (${escapeHtml(u.login)})</option>`).join('');
        }
        
        return membros;
    } catch (err) {
        console.error('Erro ao carregar usuários:', err);
        return [];
    }
}

// ============================================
// MODAIS
// ============================================

// Abrir modal de nova equipe
function openNovaEquipeModal() {
    document.getElementById('equipeModalTitle').textContent = 'Nova Equipe';
    document.getElementById('equipeId').value = '';
    document.getElementById('equipeNome').value = '';
    document.getElementById('equipeDescricao').value = '';
    document.getElementById('equipeUnidade').value = '';
    document.getElementById('equipeLider').value = '';
    document.getElementById('btnSalvarEquipe').textContent = 'Criar Equipe';
    document.getElementById('equipeModal').classList.add('active');
    loadLideresDisponiveis();
}

// Ver membros da equipe
async function verMembros(idEquipa, nomeEquipa) {
    document.getElementById('membrosEquipeNome').textContent = nomeEquipa;
    document.getElementById('membrosEquipeId').value = idEquipa;
    
    const listaMembros = document.getElementById('listaMembros');
    listaMembros.innerHTML = '<tr><td colspan="4" class="empty-state"><p>Carregando membros...</p></td></tr>';
    
    try {
        const membros = await api.get(`/equipes/${idEquipa}/membros`);
        
        if (membros.length === 0) {
            listaMembros.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <p>Esta equipe ainda não possui membros.</p>
                        <small>Clique em "Adicionar Membro" para incluir colaboradores.</small>
                    </td>
                </tr>
            `;
        } else {
            listaMembros.innerHTML = membros.map(m => `
                <tr>
                    <td>
                        <div class="membro-info">
                            <div class="user-avatar small">${getInitials(m.nome)}</div>
                            <div class="membro-detalhes">
                                <strong>${escapeHtml(m.nome)}</strong>
                                <small>${escapeHtml(m.funcao || 'Sem função')}</small>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHtml(m.email || '-')}</td>
                    <td>${escapeHtml(m.login)}</td>
                    <td>
                        <button class="btn btn-soft btn-small" onclick="removerMembro(${idEquipa}, ${m.id}, '${escapeHtml(m.nome)}')">
                            Remover
                        </button>
                    </td>
                </tr>
            `).join('');
        }
        
        // Carregar usuários disponíveis para adicionar
        await loadUsuariosDisponiveis(idEquipa);
        
        document.getElementById('membrosModal').classList.add('active');
    } catch (err) {
        console.error('Erro ao carregar membros:', err);
        listaMembros.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <p>Erro ao carregar membros.</p>
                </td>
            </tr>
        `;
    }
}

// Carregar líderes disponíveis
async function loadLideresDisponiveis() {
    try {
        const usuarios = await api.get('/usuarios');
        const ativos = usuarios.filter(u => u.ativo);
        
        const select = document.getElementById('equipeLider');
        if (select) {
            select.innerHTML = '<option value="">Selecione um líder...</option>' +
                ativos.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}</option>`).join('');
        }
    } catch (err) {
        console.error('Erro ao carregar líderes:', err);
    }
}

// Fechar modal de equipe
function closeEquipeModal() {
    document.getElementById('equipeModal').classList.remove('active');
}

// Fechar modal de membros
function closeMembrosModal() {
    document.getElementById('membrosModal').classList.remove('active');
}

// ============================================
// CRUD EQUIPES
// ============================================

// Salvar equipe (criar ou atualizar)
async function salvarEquipe(event) {
    event.preventDefault();
    
    const id = document.getElementById('equipeId').value;
    const nome = document.getElementById('equipeNome').value.trim();
    const descricao = document.getElementById('equipeDescricao').value.trim();
    const id_unidade = document.getElementById('equipeUnidade').value;
    const id_lider = document.getElementById('equipeLider').value;
    
    if (!nome) {
        alert('Por favor, informe o nome da equipe.');
        return;
    }
    
    const dados = {
        nome,
        descricao,
        id_unidade: id_unidade || null,
        id_lider: id_lider || null
    };
    
    const btn = document.getElementById('btnSalvarEquipe');
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    
    try {
        if (id) {
            // Atualizar
            await api.put(`/equipes/${id}`, dados);
            alert('Equipe atualizada com sucesso!');
        } else {
            // Criar
            await api.post('/equipes', dados);
            alert('Equipe criada com sucesso!');
        }
        
        closeEquipeModal();
        loadEquipes();
    } catch (err) {
        console.error('Erro ao salvar equipe:', err);
        alert('Erro ao salvar equipe: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = id ? 'Salvar Alterações' : 'Criar Equipe';
    }
}

// Editar equipe
async function editarEquipe(id) {
    try {
        const equipe = await api.get(`/equipes/${id}`);
        
        document.getElementById('equipeModalTitle').textContent = 'Editar Equipe';
        document.getElementById('equipeId').value = equipe.id;
        document.getElementById('equipeNome').value = equipe.nome || '';
        document.getElementById('equipeDescricao').value = equipe.descricao || '';
        document.getElementById('equipeUnidade').value = equipe.id_unidade || '';
        document.getElementById('equipeLider').value = equipe.id_lider || '';
        document.getElementById('btnSalvarEquipe').textContent = 'Salvar Alterações';
        
        await loadLideresDisponiveis();
        document.getElementById('equipeLider').value = equipe.id_lider || '';
        
        document.getElementById('equipeModal').classList.add('active');
    } catch (err) {
        console.error('Erro ao carregar equipe:', err);
        alert('Erro ao carregar dados da equipe.');
    }
}

// Excluir equipe
async function excluirEquipe(id) {
    if (!confirm('Tem certeza que deseja excluir esta equipe? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        await api.delete(`/equipes/${id}`);
        alert('Equipe excluída com sucesso!');
        loadEquipes();
    } catch (err) {
        console.error('Erro ao excluir equipe:', err);
        alert('Erro ao excluir equipe: ' + err.message);
    }
}

// ============================================
// GERENCIAR MEMBROS
// ============================================

// Adicionar membro à equipe
async function adicionarMembro() {
    const id_equipe = document.getElementById('membrosEquipeId').value;
    const id_usuario = document.getElementById('novoMembroSelect').value;
    
    if (!id_usuario) {
        alert('Por favor, selecione um colaborador para adicionar.');
        return;
    }
    
    try {
        await api.post(`/equipes/${id_equipe}/membros`, { id_usuario });
        alert('Membro adicionado com sucesso!');
        
        // Recarregar lista de membros
        await verMembros(parseInt(id_equipe), document.getElementById('membrosEquipeNome').textContent);
    } catch (err) {
        console.error('Erro ao adicionar membro:', err);
        alert('Erro ao adicionar membro: ' + err.message);
    }
}

// Remover membro da equipe
async function removerMembro(idEquipa, idUsuario, nomeUsuario) {
    if (!confirm(`Tem certeza que deseja remover ${nomeUsuario} desta equipe?`)) {
        return;
    }
    
    try {
        await api.delete(`/equipes/${idEquipa}/membros/${idUsuario}`);
        alert('Membro removido com sucesso!');
        
        // Recarregar lista de membros
        await verMembros(idEquipa, document.getElementById('membrosEquipeNome').textContent);
        loadEquipes(); // Atualizar contagem de membros
    } catch (err) {
        console.error('Erro ao remover membro:', err);
        alert('Erro ao remover membro: ' + err.message);
    }
}

// ============================================
// UTILITÁRIOS
// ============================================

// Obter iniciais do nome
function getInitials(nome) {
    if (!nome) return '??';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// Escapar HTML para prevenir XSS
function escapeHtml(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadEquipes();
    loadUnidades();
    
    // Form de equipe
    const form = document.getElementById('equipeForm');
    if (form) {
        form.addEventListener('submit', salvarEquipe);
    }
});
