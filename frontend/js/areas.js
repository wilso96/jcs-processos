/**
 * JCS-Processos - Areas Module (CRUD Completo)
 */

var areasData = [];
var currentAreaId = null;

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    if (!protectPage()) return;
    loadUserInfo();
    loadAreas();
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

async function loadAreas() {
    var tbody = document.getElementById('areasTable');
    
    try {
        var data = await api.get('/areas');
        areasData = Array.isArray(data) ? data : [];
        
        console.log('Areas carregadas:', areasData.length);
        
        tbody.innerHTML = '';
        
        if (areasData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">Nenhuma area encontrada.</td></tr>';
            return;
        }
        
        areasData.forEach(function(area) {
            var tr = document.createElement('tr');
            var statusBadge = area.ativo !== false ? 
                '<span class="badge badge-success">Ativo</span>' : 
                '<span class="badge badge-gray">Inativo</span>';
            
            tr.innerHTML = 
                '<td>' + escapeHtml(area.nome || '-') + '</td>' +
                '<td>' + escapeHtml(area.descricao || '-') + '</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td>' +
                    '<button onclick="viewArea(' + area.id + ')" class="btn btn-soft" style="padding:6px 10px;margin-right:4px;">Ver</button>' +
                    '<button onclick="editArea(' + area.id + ')" class="btn btn-primary" style="padding:6px 10px;margin-right:4px;">Editar</button>' +
                    '<button onclick="confirmarExcluirArea(' + area.id + ')" class="btn btn-danger" style="padding:6px 10px;">Excluir</button>' +
                '</td>';
            tbody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Erro ao carregar areas:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;padding:20px;">Erro ao carregar areas.</td></tr>';
    }
}

// ============================================
// Modal Functions
// ============================================
function openAreaModal(area) {
    currentAreaId = area ? area.id : null;
    var modal = document.getElementById('areaModal');
    var title = document.getElementById('modalTitle');
    var form = document.getElementById('areaForm');
    
    form.reset();
    
    if (area) {
        title.textContent = 'Editar Area';
        document.getElementById('areaId').value = area.id;
        document.getElementById('areaNome').value = area.nome || '';
        document.getElementById('areaDescricao').value = area.descricao || '';
        document.getElementById('areaAtivo').checked = area.ativo !== false;
    } else {
        title.textContent = 'Nova Area';
        document.getElementById('areaId').value = '';
    }
    
    modal.style.display = 'flex';
}

function closeAreaModal() {
    document.getElementById('areaModal').style.display = 'none';
    currentAreaId = null;
}

function novaArea() {
    openAreaModal(null);
}

// ============================================
// View, Edit, Delete Functions
// ============================================
async function viewArea(id) {
    try {
        var area = await api.get('/areas/' + id);
        currentAreaId = id;
        
        var content = document.getElementById('viewAreaContent');
        content.innerHTML = 
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
                '<p><strong>ID:</strong> ' + area.id + '</p>' +
                '<p><strong>Nome:</strong> ' + escapeHtml(area.nome || '-') + '</p>' +
                '<p><strong>Descricao:</strong> ' + escapeHtml(area.descricao || '-') + '</p>' +
                '<p><strong>Status:</strong> ' + (area.ativo !== false ? 'Ativo' : 'Inativo') + '</p>' +
                '<p><strong>Data de Criacao:</strong> ' + formatDate(area.created_at) + '</p>' +
            '</div>' +
            '<div style="margin-top:20px;">' +
                '<button onclick="editArea(' + id + ')" class="btn btn-primary" style="margin-right:10px;">Editar</button>' +
                '<button onclick="closeViewAreaModal()" class="btn btn-soft">Fechar</button>' +
            '</div>';
        
        document.getElementById('viewAreaModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Erro ao carregar area:', error);
        alert('Erro ao carregar area: ' + error.message);
    }
}

function closeViewAreaModal() {
    document.getElementById('viewAreaModal').style.display = 'none';
    currentAreaId = null;
}

function editArea(id) {
    closeViewAreaModal();
    var area = areasData.find(function(a) { return a.id === id; });
    if (area) {
        openAreaModal(area);
    }
}

async function saveArea(event) {
    event.preventDefault();
    
    var areaData = {
        nome: document.getElementById('areaNome').value,
        descricao: document.getElementById('areaDescricao').value,
        ativo: document.getElementById('areaAtivo').checked
    };
    
    try {
        if (currentAreaId) {
            await api.put('/areas/' + currentAreaId, areaData);
            alert('Area atualizada com sucesso!');
        } else {
            await api.post('/areas', areaData);
            alert('Area criada com sucesso!');
        }
        
        closeAreaModal();
        loadAreas();
        
    } catch (error) {
        console.error('Erro ao salvar area:', error);
        alert('Erro ao salvar area: ' + error.message);
    }
}

function confirmarExcluirArea(id) {
    if (confirm('Tem certeza que deseja excluir esta area?')) {
        excluirArea(id);
    }
}

async function excluirArea(id) {
    try {
        await api.delete('/areas/' + id);
        alert('Area excluida com sucesso!');
        loadAreas();
    } catch (error) {
        console.error('Erro ao excluir area:', error);
        alert('Erro ao excluir area: ' + error.message);
    }
}

// ============================================
// Helper Functions
// ============================================
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

function formatDate(dateStr) {
    if (!dateStr) return '-';
    var date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
}
