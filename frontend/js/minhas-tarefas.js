/**
 * JCS-Processos - Minhas Tarefas (Checklist)
 * Script para exibir e gerenciar tarefas do usuário logado
 */

// Variaveis globais
var tarefas = [];
var tarefaAtualObs = null;
var filtroAtual = 'all';

// ============================================
// Inicializacao
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacao();
    carregarTarefas();
    configurarFiltros();
});

// Verificar se usuario esta logado
function verificarAutenticacao() {
    var user = api.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Atualizar info do usuario na sidebar
    var userAvatar = document.getElementById('userAvatar');
    var userName = document.getElementById('userName');
    var userRole = document.getElementById('userRole');
    
    if (userAvatar) {
        userAvatar.textContent = user.nome ? user.nome.charAt(0).toUpperCase() : 'U';
    }
    if (userName) {
        userName.textContent = user.nome || 'Usuário';
    }
    if (userRole) {
        userRole.textContent = user.funcao || 'Colaborador';
    }
}

// ============================================
// Carregar Tarefas
// ============================================

function carregarTarefas() {
    var container = document.getElementById('tasksContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-state">' +
        '<div class="spinner-large"></div>' +
        '<p>Carregando suas tarefas...</p>' +
    '</div>';
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', API_BASE_URL + '/tarefas', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + api.getToken());
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    tarefas = response.tarefas || [];
                    renderizarTarefas();
                } catch (e) {
                    mostrarErro('Erro ao processar dados das tarefas');
                }
            } else if (xhr.status === 401) {
                api.clearToken();
                window.location.href = 'index.html';
            } else {
                mostrarErro('Erro ao carregar tarefas');
            }
        }
    };
    
    xhr.send();
}

function mostrarErro(mensagem) {
    var container = document.getElementById('tasksContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="empty-checklist">' +
        '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>' +
        '</svg>' +
        '<h3>Oops!</h3>' +
        '<p>' + mensagem + '</p>' +
    '</div>';
}

// ============================================
// Renderizar Tarefas
// ============================================

function renderizarTarefas() {
    var container = document.getElementById('tasksContainer');
    if (!container) return;
    
    // Filtrar tarefas
    var tarefasFiltradas = tarefas.filter(function(tarefa) {
        if (filtroAtual === 'all') return true;
        return tarefa.status === filtroAtual;
    });
    
    // Agrupar por processo
    var grupos = {};
    tarefasFiltradas.forEach(function(tarefa) {
        var processo = tarefa.processo_nome || 'Sem Processo';
        if (!grupos[processo]) {
            grupos[processo] = [];
        }
        grupos[processo].push(tarefa);
    });
    
    // Contadores
    var pendentes = tarefas.filter(function(t) { return t.status === 'pendente'; }).length;
    var concluidas = tarefas.filter(function(t) { return t.status === 'concluida'; }).length;
    
    var pendentesEl = document.getElementById('pendingCount');
    var concluidasEl = document.getElementById('doneCount');
    if (pendentesEl) pendentesEl.textContent = pendentes;
    if (concluidasEl) concluidasEl.textContent = concluidas;
    
    // Verificar se ha tarefas
    if (tarefasFiltradas.length === 0) {
        container.innerHTML = '<div class="empty-checklist">' +
            '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>' +
            '</svg>' +
            '<h3>Tudo limpo!</h3>' +
            '<p>Você não tem tarefas neste momento.</p>' +
        '</div>';
        return;
    }
    
    // Renderizar grupos
    var html = '';
    var nomeProcessos = Object.keys(grupos);
    
    nomeProcessos.forEach(function(nomeProcesso) {
        var tarefasDoGrupo = grupos[nomeProcesso];
        
        // Ordenar tarefas: pendentes primeiro, depois concluidas
        tarefasDoGrupo.sort(function(a, b) {
            // Se uma é concluida e outra não, a pendente vem primeiro
            if (a.status === 'concluida' && b.status !== 'concluida') return 1;
            if (a.status !== 'concluida' && b.status === 'concluida') return -1;
            
            // Se ambas têm ordem de execução, usar essa ordem
            if (a.ordem_execucao && b.ordem_execucao) {
                return a.ordem_execucao - b.ordem_execucao;
            }
            
            // Caso contrário, manter ordem original
            return 0;
        });
        
        var totalGrupo = tarefasDoGrupo.length;
        var concluidasGrupo = tarefasDoGrupo.filter(function(t) { return t.status === 'concluida'; }).length;
        var progresso = Math.round((concluidasGrupo / totalGrupo) * 100);
        
        html += '<div class="process-group">';
        html += '<div class="process-header">';
        html += '<h3>' + nomeProcesso + '</h3>';
        html += '<div class="process-progress">' + concluidasGrupo + '/' + totalGrupo + '</div>';
        html += '<div class="process-progress-bar">';
        html += '<div class="process-progress-fill" style="width: ' + progresso + '%"></div>';
        html += '</div>';
        html += '</div>';
        
        tarefasDoGrupo.forEach(function(tarefa) {
            html += renderizarTaskItem(tarefa);
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Adicionar event listeners nos checkboxes
    tarefasFiltradas.forEach(function(tarefa) {
        var checkbox = document.getElementById('chk-' + tarefa.id);
        if (checkbox) {
            checkbox.addEventListener('change', (function(id) {
                return function() {
                    marcarConcluida(id, this.checked);
                };
            })(tarefa.id));
        }
    });
}

function renderizarTaskItem(tarefa) {
    var isCompleted = tarefa.status === 'concluida';
    var classeCompleted = isCompleted ? ' completed' : '';
    
    var priorityBadge = getPriorityBadge(tarefa.prioridade);
    var statusBadge = getStatusBadge(tarefa.status);
    var timeBadge = getTimeBadge(tarefa);
    var recurrenceBadge = getRecurrenceBadge(tarefa);
    
    var html = '<div class="task-item' + classeCompleted + '" id="task-' + tarefa.id + '">';
    
    // Indicador de ordem de execução
    if (tarefa.ordem_execucao && tarefa.ordem_execucao > 0) {
        html += '<div class="task-order" style="position: absolute; left: -8px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">';
        html += tarefa.ordem_execucao;
        html += '</div>';
    }
    
    // Checkbox
    html += '<label class="task-checkbox">';
    html += '<input type="checkbox" id="chk-' + tarefa.id + '" ' + (isCompleted ? 'checked' : '') + '>';
    html += '<span class="checkbox-custom">';
    html += '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">';
    html += '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>';
    html += '</svg>';
    html += '</span>';
    html += '</label>';
    
    // Conteudo
    html += '<div class="task-content">';
    html += '<div class="task-title">' + tarefa.titulo + '</div>';
    
    if (tarefa.descricao) {
        html += '<div class="task-description">' + tarefa.descricao + '</div>';
    }
    
    html += '<div class="task-meta">';
    html += recurrenceBadge;
    html += priorityBadge;
    html += statusBadge;
    html += timeBadge;
    html += '</div>';
    
    html += '</div>';
    
    // Acoes
    html += '<div class="task-actions">';
    html += '<button class="btn-obs" onclick="abrirModalObs(' + tarefa.id + ')">';
    html += '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">';
    html += '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>';
    html += '</svg>';
    html += 'Observação';
    html += '</button>';
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

function getRecurrenceBadge(tarefa) {
    var html = '';
    
    if (tarefa.tarefa_diaria) {
        html += '<span class="task-badge" style="background: #e0f2fe; color: #0284c7;">📅 Diária</span>';
    } else if (tarefa.dias_semana && tarefa.dias_semana.length > 0) {
        var diasTexto = formatarDiasSemana(tarefa.dias_semana);
        html += '<span class="task-badge" style="background: #fef3c7; color: #d97706;">' + diasTexto + '</span>';
    }
    
    return html;
}

function formatarDiasSemana(dias) {
    if (!dias || !Array.isArray(dias)) return '';
    
    var nomes = ['', 'Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    var diasOrdenados = [...dias].sort(function(a, b) { return a - b; });
    var texto = diasOrdenados.map(function(d) { return nomes[d] || ''; }).filter(Boolean).join(', ');
    
    return texto;
}

function getPriorityBadge(prioridade) {
    var classe = '';
    var texto = '';
    
    if (prioridade === 'alta') {
        classe = 'priority-high';
        texto = 'Alta';
    } else if (prioridade === 'media') {
        classe = 'priority-medium';
        texto = 'Média';
    } else {
        classe = 'priority-low';
        texto = 'Baixa';
    }
    
    return '<span class="task-badge ' + classe + '">' + texto + '</span>';
}

function getStatusBadge(status) {
    var classe = '';
    var texto = '';
    
    if (status === 'pendente') {
        classe = 'status-pendente';
        texto = 'Pendente';
    } else if (status === 'em_execucao') {
        classe = 'status-em_execucao';
        texto = 'Em Execução';
    } else if (status === 'concluida') {
        classe = 'status-concluida';
        texto = 'Concluída';
    }
    
    return '<span class="task-badge ' + classe + '">' + texto + '</span>';
}

function getTimeBadge(tarefa) {
    var html = '';
    
    if (tarefa.data_programada) {
        var dataFormatada = formatarData(tarefa.data_programada);
        var isOverdue = false;
        
        if (tarefa.status !== 'concluida') {
            var hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            var dataProg = new Date(tarefa.data_programada);
            dataProg.setHours(0, 0, 0, 0);
            isOverdue = dataProg < hoje;
        }
        
        var classeOverdue = isOverdue ? ' overdue' : '';
        html += '<span class="task-badge time' + classeOverdue + '">';
        
        if (tarefa.hora_programada) {
            html += dataFormatada + ' às ' + tarefa.hora_programada;
        } else {
            html += dataFormatada;
        }
        
        html += '</span>';
    }
    
    return html;
}

function formatarData(dataStr) {
    if (!dataStr) return '';
    
    var partes = dataStr.split('T')[0].split('-');
    if (partes.length !== 3) return dataStr;
    
    return partes[2] + '/' + partes[1] + '/' + partes[0];
}

// ============================================
// Marcar Tarefa como Concluida
// ============================================

function marcarConcluida(idTarefa, concluido) {
    var taskItem = document.getElementById('task-' + idTarefa);
    if (!taskItem) return;
    
    var novoStatus = concluido ? 'concluida' : 'pendente';
    
    // Encontrar tarefa no array
    var tarefa = tarefas.find(function(t) { return t.id === idTarefa; });
    if (!tarefa) return;
    
    // Atualizar visual imediatamente
    if (concluido) {
        taskItem.classList.add('completed');
    } else {
        taskItem.classList.remove('completed');
    }
    
    // Atualizar badge de status
    var statusBadge = taskItem.querySelector('.status-pendente, .status-em_execucao, .status-concluida');
    if (statusBadge) {
        statusBadge.className = 'task-badge status-' + novoStatus;
        statusBadge.textContent = novoStatus === 'concluida' ? 'Concluída' : (novoStatus === 'em_execucao' ? 'Em Execução' : 'Pendente');
    }
    
    // Remover badge de overdue se concluido
    if (concluido) {
        var timeBadge = taskItem.querySelector('.task-badge.time.overdue');
        if (timeBadge) {
            timeBadge.classList.remove('overdue');
        }
    }
    
    // Atualizar contadores
    var pendentes = tarefas.filter(function(t) { return t.status === 'pendente'; }).length;
    var concluidas = tarefas.filter(function(t) { return t.status === 'concluida'; }).length;
    
    var pendentesEl = document.getElementById('pendingCount');
    var concluidasEl = document.getElementById('doneCount');
    
    if (concluido) {
        if (pendentesEl) pendentesEl.textContent = pendentes - 1;
        if (concluidasEl) concluidasEl.textContent = concluidas + 1;
    } else {
        if (pendentesEl) pendentesEl.textContent = pendentes + 1;
        if (concluidasEl) concluidasEl.textContent = concluidas - 1;
    }
    
    // Atualizar array local
    tarefa.status = novoStatus;
    if (concluido) {
        tarefa.data_execucao = new Date().toISOString().split('T')[0];
    } else {
        tarefa.data_execucao = null;
    }
    
    // Enviar para API
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', API_BASE_URL + '/tarefas/' + idTarefa, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + api.getToken());
    
    var body = {
        status: novoStatus
    };
    
    if (concluido) {
        body.data_execucao = tarefa.data_execucao;
    }
    
    xhr.send(JSON.stringify(body));
}

// ============================================
// Modal de Observacao
// ============================================

function abrirModalObs(idTarefa) {
    var tarefa = tarefas.find(function(t) { return t.id === idTarefa; });
    if (!tarefa) return;
    
    tarefaAtualObs = tarefa;
    
    var modal = document.getElementById('obsModal');
    var titulo = document.getElementById('obsTaskTitle');
    var texto = document.getElementById('obsText');
    
    if (titulo) {
        titulo.textContent = tarefa.titulo;
    }
    if (texto) {
        texto.value = tarefa.observacao_geral || '';
    }
    if (modal) {
        modal.classList.add('active');
    }
}

function fecharModalObs() {
    var modal = document.getElementById('obsModal');
    if (modal) {
        modal.classList.remove('active');
    }
    tarefaAtualObs = null;
}

function salvarObservacao() {
    if (!tarefaAtualObs) return;
    
    var texto = document.getElementById('obsText');
    if (!texto) return;
    
    var observacao = texto.value.trim();
    
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', API_BASE_URL + '/tarefas/' + tarefaAtualObs.id, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + api.getToken());
    
    var body = {
        observacao_geral: observacao
    };
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                tarefaAtualObs.observacao_geral = observacao;
                fecharModalObs();
                
                // Mostrar feedback
                var taskItem = document.getElementById('task-' + tarefaAtualObs.id);
                if (taskItem) {
                    taskItem.style.borderColor = 'var(--success)';
                    setTimeout(function() {
                        taskItem.style.borderColor = '';
                    }, 1500);
                }
            } else {
                alert('Erro ao salvar observação');
            }
        }
    };
    
    xhr.send(JSON.stringify(body));
}

// ============================================
// Filtros
// ============================================

function configurarFiltros() {
    var tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            // Remover active de todos
            tabs.forEach(function(t) { t.classList.remove('active'); });
            // Adicionar active neste
            this.classList.add('active');
            // Atualizar filtro
            filtroAtual = this.getAttribute('data-filter');
            // Re-renderizar
            renderizarTarefas();
        });
    });
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(e) {
    var modal = document.getElementById('obsModal');
    if (modal && modal.classList.contains('active')) {
        if (e.target === modal) {
            fecharModalObs();
        }
    }
});

// Tecla ESC fecha modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fecharModalObs();
    }
});
