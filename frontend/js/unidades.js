// ============================================
// JCS-Processos - Unidades JavaScript
// ============================================

// Estado atual
let unidadesData = [];

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

// Carregar lista de unidades
async function loadUnidades() {
    const table = document.getElementById('unidadesTable');
    table.innerHTML = `
        <tr>
            <td colspan="6" class="empty-state">
                <p>Carregando unidades...</p>
            </td>
        </tr>
    `;

    try {
        unidadesData = await api.get('/unidades');
        
        if (unidadesData.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <p>Nenhuma unidade encontrada.</p>
                        <small>Clique em "Nova Unidade" para criar a primeira.</small>
                    </td>
                </tr>
            `;
            return;
        }

        table.innerHTML = unidadesData.map(unidade => `
            <tr>
                <td>
                    <div class="equipe-info">
                        <strong>${escapeHtml(unidade.nome || '')}</strong>
                        ${unidade.endereco ? `<small>${escapeHtml(unidade.endereco)}</small>` : ''}
                    </div>
                </td>
                <td>
                    <div class="lider-info">
                        ${unidade.responsavel_nome ? `
                            <div class="user-avatar small">${getInitials(unidade.responsavel_nome)}</div>
                            <span>${escapeHtml(unidade.responsavel_nome)}</span>
                        ` : '<span class="text-muted">Sem responsável</span>'}
                    </div>
                </td>
                <td>
                    <span class="badge-membros">${unidade.total_processos || 0} processos</span>
                </td>
                <td>
                    <span class="badge-membros">${unidade.total_usuarios || 0} usuários</span>
                </td>
                <td>
                    <span class="status-badge ${unidade.ativo ? 'status-ativo' : 'status-inativo'}">
                        ${unidade.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="verProcessos(${unidade.id}, '${escapeHtml(unidade.nome || '')}')" title="Ver Processos">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </button>
                        <button class="action-btn" onclick="verUsuarios(${unidade.id}, '${escapeHtml(unidade.nome || '')}')" title="Ver Usuários">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                        </button>
                        <button class="action-btn" onclick="editarUnidade(${unidade.id})" title="Editar">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button class="action-btn action-danger" onclick="excluirUnidade(${unidade.id})" title="Excluir">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Erro ao carregar unidades:', err);
        table.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <p>Erro ao carregar unidades.</p>
                    <small>${err.message}</small>
                </td>
            </tr>
        `;
    }
}

// ============================================
// MODAIS DE CADASTRO/EDIÇÃO
// ============================================

// Abrir modal de nova unidade
function openNovaUnidadeModal() {
    document.getElementById('unidadeModalTitle').textContent = 'Nova Unidade';
    document.getElementById('unidadeId').value = '';
    document.getElementById('unidadeNome').value = '';
    document.getElementById('unidadeEndereco').value = '';
    document.getElementById('unidadeResponsavel').value = '';
    document.getElementById('unidadeAtivo').checked = true;
    document.getElementById('btnSalvarUnidade').textContent = 'Criar Unidade';
    document.getElementById('unidadeModal').classList.add('active');
    loadResponsaveisDisponiveis();
}

// Fechar modal de unidade
function closeUnidadeModal() {
    document.getElementById('unidadeModal').classList.remove('active');
}

// Carregar responsáveis disponíveis
async function loadResponsaveisDisponiveis() {
    try {
        const usuarios = await api.get('/usuarios');
        const ativos = usuarios.filter(u => u.ativo);
        
        const select = document.getElementById('unidadeResponsavel');
        if (select) {
            select.innerHTML = '<option value="">Selecione um responsável...</option>' +
                ativos.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}</option>`).join('');
        }
    } catch (err) {
        console.error('Erro ao carregar responsáveis:', err);
    }
}

// ============================================
// MODAIS DE PROCESSOS
// ============================================

// Ver processos vinculados à unidade
async function verProcessos(idUnidade, nomeUnidade) {
    document.getElementById('processosUnidadeNome').textContent = nomeUnidade;
    document.getElementById('processosUnidadeId').value = idUnidade;
    
    const listaProcessos = document.getElementById('listaProcessos');
    listaProcessos.innerHTML = '<tr><td colspan="5" class="empty-state"><p>Carregando processos...</p></td></tr>';
    
    try {
        const processos = await api.get(`/unidades/${idUnidade}/processos`);
        
        if (processos.length === 0) {
            listaProcessos.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <p>Esta unidade ainda não possui processos vinculados.</p>
                        <small>Clique em "Vincular Processo" para adicionar.</small>
                    </td>
                </tr>
            `;
        } else {
            listaProcessos.innerHTML = processos.map(p => `
                <tr>
                    <td>
                        <div class="equipe-info">
                            <strong>${escapeHtml(p.nome || '')}</strong>
                            ${p.descricao ? `<small>${escapeHtml(p.descricao)}</small>` : ''}
                        </div>
                    </td>
                    <td>${escapeHtml(p.area_nome || '-')}</td>
                    <td>
                        <div class="lider-info">
                            ${p.responsavel_nome ? `
                                <div class="user-avatar small">${getInitials(p.responsavel_nome)}</div>
                                <span>${escapeHtml(p.responsavel_nome)}</span>
                            ` : '<span class="text-muted">Sem responsável</span>'}
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${p.status === 'ativo' ? 'status-ativo' : 'status-inativo'}">
                            ${p.status || 'ativo'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-soft btn-small" onclick="desvincularProcesso(${idUnidade}, ${p.id}, '${escapeHtml(p.nome)}')">
                            Desvincular
                        </button>
                    </td>
                </tr>
            `).join('');
        }
        
        // Carregar processos disponíveis para vincular
        await loadProcessosDisponiveis(idUnidade);
        
        document.getElementById('processosModal').classList.add('active');
    } catch (err) {
        console.error('Erro ao carregar processos:', err);
        listaProcessos.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <p>Erro ao carregar processos.</p>
                </td>
            </tr>
        `;
    }
}

// Carregar processos disponíveis para vincular
async function loadProcessosDisponiveis(idUnidade) {
    try {
        const processos = await api.get(`/unidades/${idUnidade}/processos/disponiveis`);
        
        const select = document.getElementById('novoProcessoSelect');
        if (select) {
            if (processos.length === 0) {
                select.innerHTML = '<option value="">Nenhum processo disponível</option>';
            } else {
                select.innerHTML = '<option value="">Selecione um processo...</option>' +
                    processos.map(p => `<option value="${p.id}">${escapeHtml(p.nome)} - ${escapeHtml(p.area_nome || 'Sem área')}</option>`).join('');
            }
        }
    } catch (err) {
        console.error('Erro ao carregar processos disponíveis:', err);
    }
}

// Fechar modal de processos
function closeProcessosModal() {
    document.getElementById('processosModal').classList.remove('active');
}

// ============================================
// MODAIS DE USUÁRIOS
// ============================================

// Ver usuários vinculados à unidade
async function verUsuarios(idUnidade, nomeUnidade) {
    document.getElementById('usuariosUnidadeNome').textContent = nomeUnidade;
    document.getElementById('usuariosUnidadeId').value = idUnidade;
    
    const listaUsuarios = document.getElementById('listaUsuarios');
    listaUsuarios.innerHTML = '<tr><td colspan="5" class="empty-state"><p>Carregando usuários...</p></td></tr>';
    
    try {
        const usuarios = await api.get(`/unidades/${idUnidade}/usuarios`);
        
        if (usuarios.length === 0) {
            listaUsuarios.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <p>Esta unidade ainda não possui usuários vinculados.</p>
                        <small>Clique em "Vincular Usuário" para adicionar.</small>
                    </td>
                </tr>
            `;
        } else {
            listaUsuarios.innerHTML = usuarios.map(u => `
                <tr>
                    <td>
                        <div class="membro-info">
                            <div class="user-avatar small">${getInitials(u.nome)}</div>
                            <div class="membro-detalhes">
                                <strong>${escapeHtml(u.nome)}</strong>
                                <small>${escapeHtml(u.funcao || 'Sem função')}</small>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHtml(u.login)}</td>
                    <td>${escapeHtml(u.email || '-')}</td>
                    <td>
                        <span class="status-badge ${u.ativo ? 'status-ativo' : 'status-inativo'}">
                            ${u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-soft btn-small" onclick="desvincularUsuario(${idUnidade}, ${u.id}, '${escapeHtml(u.nome)}')">
                            Desvincular
                        </button>
                    </td>
                </tr>
            `).join('');
        }
        
        // Carregar usuários disponíveis para vincular
        await loadUsuariosDisponiveis(idUnidade);
        
        document.getElementById('usuariosModal').classList.add('active');
    } catch (err) {
        console.error('Erro ao carregar usuários:', err);
        listaUsuarios.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <p>Erro ao carregar usuários.</p>
                </td>
            </tr>
        `;
    }
}

// Carregar usuários disponíveis para vincular
async function loadUsuariosDisponiveis(idUnidade) {
    try {
        const usuarios = await api.get(`/unidades/${idUnidade}/usuarios/disponiveis`);
        
        const select = document.getElementById('novoUsuarioSelect');
        if (select) {
            if (usuarios.length === 0) {
                select.innerHTML = '<option value="">Nenhum usuário disponível</option>';
            } else {
                select.innerHTML = '<option value="">Selecione um usuário...</option>' +
                    usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)} (${escapeHtml(u.login)})</option>`).join('');
            }
        }
    } catch (err) {
        console.error('Erro ao carregar usuários disponíveis:', err);
    }
}

// Fechar modal de usuários
function closeUsuariosModal() {
    document.getElementById('usuariosModal').classList.remove('active');
}

// ============================================
// CRUD UNIDADES
// ============================================

// Salvar unidade (criar ou atualizar)
async function salvarUnidade(event) {
    event.preventDefault();
    
    const id = document.getElementById('unidadeId').value;
    const nome = document.getElementById('unidadeNome').value.trim();
    const endereco = document.getElementById('unidadeEndereco').value.trim();
    const responsavel_id = document.getElementById('unidadeResponsavel').value;
    const ativo = document.getElementById('unidadeAtivo').checked;
    
    if (!nome) {
        alert('Por favor, informe o nome da unidade.');
        return;
    }
    
    const dados = {
        nome,
        endereco,
        responsavel_id: responsavel_id || null,
        ativo
    };
    
    const btn = document.getElementById('btnSalvarUnidade');
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    
    try {
        if (id) {
            // Atualizar
            await api.put(`/unidades/${id}`, dados);
            alert('Unidade atualizada com sucesso!');
        } else {
            // Criar
            await api.post('/unidades', dados);
            alert('Unidade criada com sucesso!');
        }
        
        closeUnidadeModal();
        loadUnidades();
    } catch (err) {
        console.error('Erro ao salvar unidade:', err);
        alert('Erro ao salvar unidade: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = id ? 'Salvar Alterações' : 'Criar Unidade';
    }
}

// Editar unidade
async function editarUnidade(id) {
    try {
        const unidade = await api.get(`/unidades/${id}`);
        
        document.getElementById('unidadeModalTitle').textContent = 'Editar Unidade';
        document.getElementById('unidadeId').value = unidade.id;
        document.getElementById('unidadeNome').value = unidade.nome || '';
        document.getElementById('unidadeEndereco').value = unidade.endereco || '';
        document.getElementById('unidadeAtivo').checked = unidade.ativo !== false;
        document.getElementById('btnSalvarUnidade').textContent = 'Salvar Alterações';
        
        await loadResponsaveisDisponiveis();
        document.getElementById('unidadeResponsavel').value = unidade.responsavel_id || '';
        
        document.getElementById('unidadeModal').classList.add('active');
    } catch (err) {
        console.error('Erro ao carregar unidade:', err);
        alert('Erro ao carregar dados da unidade.');
    }
}

// Excluir unidade
async function excluirUnidade(id) {
    if (!confirm('Tem certeza que deseja excluir esta unidade? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        await api.delete(`/unidades/${id}`);
        alert('Unidade excluída com sucesso!');
        loadUnidades();
    } catch (err) {
        console.error('Erro ao excluir unidade:', err);
        alert('Erro ao excluir unidade: ' + err.message);
    }
}

// ============================================
// VINCULAR/DESVINCULAR PROCESSOS
// ============================================

// Vincular processo à unidade
async function vincularProcesso() {
    const id_unidade = document.getElementById('processosUnidadeId').value;
    const id_processo = document.getElementById('novoProcessoSelect').value;
    
    if (!id_processo) {
        alert('Por favor, selecione um processo para vincular.');
        return;
    }
    
    try {
        await api.post(`/unidades/${id_unidade}/processos`, { id_processo });
        alert('Processo vinculado com sucesso!');
        
        // Recarregar lista de processos
        await verProcessos(parseInt(id_unidade), document.getElementById('processosUnidadeNome').textContent);
        loadUnidades(); // Atualizar contagem na tabela principal
    } catch (err) {
        console.error('Erro ao vincular processo:', err);
        alert('Erro ao vincular processo: ' + err.message);
    }
}

// Desvincular processo da unidade
async function desvincularProcesso(idUnidade, idProcesso, nomeProcesso) {
    if (!confirm(`Tem certeza que deseja desvincular "${nomeProcesso}" desta unidade?`)) {
        return;
    }
    
    try {
        await api.delete(`/unidades/${idUnidade}/processos/${idProcesso}`);
        alert('Processo desvinculado com sucesso!');
        
        // Recarregar lista de processos
        await verProcessos(idUnidade, document.getElementById('processosUnidadeNome').textContent);
        loadUnidades(); // Atualizar contagem na tabela principal
    } catch (err) {
        console.error('Erro ao desvincular processo:', err);
        alert('Erro ao desvincular processo: ' + err.message);
    }
}

// ============================================
// VINCULAR/DESVINCULAR USUÁRIOS
// ============================================

// Vincular usuário à unidade
async function vincularUsuario() {
    const id_unidade = document.getElementById('usuariosUnidadeId').value;
    const id_usuario = document.getElementById('novoUsuarioSelect').value;
    
    if (!id_usuario) {
        alert('Por favor, selecione um usuário para vincular.');
        return;
    }
    
    try {
        await api.post(`/unidades/${id_unidade}/usuarios`, { id_usuario });
        alert('Usuário vinculado com sucesso!');
        
        // Recarregar lista de usuários
        await verUsuarios(parseInt(id_unidade), document.getElementById('usuariosUnidadeNome').textContent);
        loadUnidades(); // Atualizar contagem na tabela principal
    } catch (err) {
        console.error('Erro ao vincular usuário:', err);
        alert('Erro ao vincular usuário: ' + err.message);
    }
}

// Desvincular usuário da unidade
async function desvincularUsuario(idUnidade, idUsuario, nomeUsuario) {
    if (!confirm(`Tem certeza que deseja desvincular "${nomeUsuario}" desta unidade?`)) {
        return;
    }
    
    try {
        await api.delete(`/unidades/${idUnidade}/usuarios/${idUsuario}`);
        alert('Usuário desvinculado com sucesso!');
        
        // Recarregar lista de usuários
        await verUsuarios(idUnidade, document.getElementById('usuariosUnidadeNome').textContent);
        loadUnidades(); // Atualizar contagem na tabela principal
    } catch (err) {
        console.error('Erro ao desvincular usuário:', err);
        alert('Erro ao desvincular usuário: ' + err.message);
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
    loadUnidades();
    
    // Form de unidade
    const form = document.getElementById('unidadeForm');
    if (form) {
        form.addEventListener('submit', salvarUnidade);
    }
});
