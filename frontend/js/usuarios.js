/**
 * JCS-Processos - Usuarios Module (CRUD Completo)
 */

var usuariosData = [];
var currentUsuarioId = null;

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    if (!protectPage()) return;
    loadUserInfo();
    loadUsuarios();
    loadPerfis();
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

function loadPerfis() {
    // Perfis fixos do sistema
    var perfis = [
        { id: 1, nome: 'admin' },
        { id: 2, nome: 'supervisor' },
        { id: 3, nome: 'colaborador' }
    ];
    
    var select = document.getElementById('usuarioPerfil');
    select.innerHTML = '<option value="">Selecione...</option>';
    perfis.forEach(function(perfil) {
        var nome = perfil.nome === 'admin' ? 'Administrador' : 
                   perfil.nome === 'supervisor' ? 'Supervisor' : 'Colaborador';
        select.innerHTML += '<option value="' + perfil.id + '">' + nome + '</option>';
    });
}

async function loadUsuarios() {
    var tbody = document.getElementById('usuariosTable');
    
    try {
        var data = await api.get('/usuarios');
        usuariosData = Array.isArray(data) ? data : [];
        
        console.log('Usuarios carregados:', usuariosData.length);
        
        tbody.innerHTML = '';
        
        if (usuariosData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">Nenhum usuario encontrado.</td></tr>';
            return;
        }
        
        usuariosData.forEach(function(usuario) {
            var tr = document.createElement('tr');
            var statusBadge = usuario.ativo !== false ? 
                '<span class="badge badge-success">Ativo</span>' : 
                '<span class="badge badge-gray">Inativo</span>';
            
            tr.innerHTML = 
                '<td>' + (usuario.nome || '-') + '</td>' +
                '<td>' + (usuario.email || '-') + '</td>' +
                '<td>' + formatPerfil(usuario.perfil) + '</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td>' +
                    '<button onclick="viewUsuario(' + usuario.id + ')" class="btn btn-soft" style="padding:6px 10px;margin-right:4px;">Ver</button>' +
                    '<button onclick="editUsuario(' + usuario.id + ')" class="btn btn-primary" style="padding:6px 10px;margin-right:4px;">Editar</button>' +
                    '<button onclick="confirmarExcluirUsuario(' + usuario.id + ')" class="btn btn-danger" style="padding:6px 10px;">Excluir</button>' +
                '</td>';
            tbody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Erro ao carregar usuarios:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;padding:20px;">Erro ao carregar usuarios.</td></tr>';
    }
}

function formatPerfil(perfil) {
    if (!perfil) return '<span class="badge badge-gray">Nao definido</span>';
    var map = {
        'admin': '<span class="badge badge-red">Administrador</span>',
        'supervisor': '<span class="badge badge-blue">Supervisor</span>',
        'colaborador': '<span class="badge badge-gray">Colaborador</span>'
    };
    return map[perfil.toLowerCase()] || '<span class="badge badge-info">' + perfil + '</span>';
}

// ============================================
// Modal Functions
// ============================================
function openUsuarioModal(usuario) {
    currentUsuarioId = usuario ? usuario.id : null;
    var modal = document.getElementById('usuarioModal');
    var title = document.getElementById('modalTitle');
    var form = document.getElementById('usuarioForm');
    
    form.reset();
    
    if (usuario) {
        title.textContent = 'Editar Usuario';
        document.getElementById('usuarioId').value = usuario.id;
        document.getElementById('usuarioNome').value = usuario.nome || '';
        document.getElementById('usuarioLogin').value = usuario.login || '';
        document.getElementById('usuarioEmail').value = usuario.email || '';
        document.getElementById('usuarioTelefone').value = usuario.telefone || '';
        document.getElementById('usuarioPerfil').value = usuario.id_perfil || '';
        document.getElementById('usuarioAtivo').checked = usuario.ativo !== false;
        document.getElementById('senhaField').style.display = 'none';
    } else {
        title.textContent = 'Novo Usuario';
        document.getElementById('usuarioId').value = '';
        document.getElementById('senhaField').style.display = 'block';
    }
    
    modal.style.display = 'flex';
}

function closeUsuarioModal() {
    document.getElementById('usuarioModal').style.display = 'none';
    currentUsuarioId = null;
}

// ============================================
// View, Edit, Delete Functions
// ============================================
async function viewUsuario(id) {
    try {
        var usuario = await api.get('/usuarios/' + id);
        currentUsuarioId = id;
        
        var content = document.getElementById('viewUsuarioContent');
        content.innerHTML = 
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
                '<p><strong>ID:</strong> ' + usuario.id + '</p>' +
                '<p><strong>Nome:</strong> ' + (usuario.nome || '-') + '</p>' +
                '<p><strong>Login:</strong> ' + (usuario.login || '-') + '</p>' +
                '<p><strong>Email:</strong> ' + (usuario.email || '-') + '</p>' +
                '<p><strong>Telefone:</strong> ' + (usuario.telefone || '-') + '</p>' +
                '<p><strong>Perfil:</strong> ' + formatPerfil(usuario.perfil) + '</p>' +
                '<p><strong>Status:</strong> ' + (usuario.ativo !== false ? 'Ativo' : 'Inativo') + '</p>' +
            '</div>' +
            '<div style="margin-top:20px;">' +
                '<button onclick="editUsuario(' + id + ')" class="btn btn-primary" style="margin-right:10px;">Editar</button>' +
                '<button onclick="closeViewUsuarioModal()" class="btn btn-soft">Fechar</button>' +
            '</div>';
        
        document.getElementById('viewUsuarioModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Erro ao carregar usuario:', error);
        alert('Erro ao carregar usuario: ' + error.message);
    }
}

function closeViewUsuarioModal() {
    document.getElementById('viewUsuarioModal').style.display = 'none';
    currentUsuarioId = null;
}

function editUsuario(id) {
    closeViewUsuarioModal();
    var usuario = usuariosData.find(function(u) { return u.id === id; });
    if (usuario) {
        openUsuarioModal(usuario);
    }
}

function novoUsuario() {
    openUsuarioModal(null);
}

async function saveUsuario(event) {
    event.preventDefault();
    
    var senha = document.getElementById('usuarioSenha').value;
    
    var usuarioData = {
        nome: document.getElementById('usuarioNome').value,
        login: document.getElementById('usuarioLogin').value,
        email: document.getElementById('usuarioEmail').value,
        telefone: document.getElementById('usuarioTelefone').value,
        id_perfil: document.getElementById('usuarioPerfil').value,
        ativo: document.getElementById('usuarioAtivo').checked
    };
    
    // Adicionar senha apenas se estiver criando novo usuario ou se foi preenchida
    if (!currentUsuarioId || senha) {
        usuarioData.senha = senha;
    }
    
    try {
        if (currentUsuarioId) {
            await api.put('/usuarios/' + currentUsuarioId, usuarioData);
            alert('Usuario atualizado com sucesso!');
        } else {
            if (!senha) {
                alert('Informe a senha para criar o usuario.');
                return;
            }
            await api.post('/usuarios', usuarioData);
            alert('Usuario criado com sucesso!');
        }
        
        closeUsuarioModal();
        loadUsuarios();
        
    } catch (error) {
        console.error('Erro ao salvar usuario:', error);
        alert('Erro ao salvar usuario: ' + error.message);
    }
}

function confirmarExcluirUsuario(id) {
    if (confirm('Tem certeza que deseja excluir este usuario?')) {
        excluirUsuario(id);
    }
}

async function excluirUsuario(id) {
    try {
        await api.delete('/usuarios/' + id);
        alert('Usuario excluido com sucesso!');
        loadUsuarios();
    } catch (error) {
        console.error('Erro ao excluir usuario:', error);
        alert('Erro ao excluir usuario: ' + error.message);
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
