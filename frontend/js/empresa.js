/**
 * JCS-Processos - Empresa Info
 * Script para carregar e exibir informações da empresa na sidebar
 */

var empresaInfo = {
    nome: '',
    cnpj: '',
    responsavel: '',
    whatsapp: ''
};

/**
 * Carregar dados da empresa do usuário logado
 */
function carregarEmpresa() {
    var empresaContainer = document.getElementById('empresaInfo');
    if (!empresaContainer) return;
    
    // Verificar se API_BASE_URL está definido
    if (typeof API_BASE_URL === 'undefined') {
        console.warn('API_BASE_URL não definido');
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', API_BASE_URL + '/empresas/atual', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + api.getToken());

    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                var empresa = JSON.parse(xhr.responseText);
                empresaInfo = {
                    nome: empresa.nome || '',
                    cnpj: empresa.cnpj || '',
                    responsavel: empresa.responsavel || '',
                    whatsapp: empresa.whatsapp || ''
                };
                exibirEmpresa();
            } catch (e) {
                console.error('Erro ao processar dados da empresa:', e);
            }
        } else if (xhr.status === 401) {
            // Não está logado, não mostra info da empresa
            console.log('Usuário não autenticado');
        } else {
            console.warn('Erro ao carregar empresa:', xhr.status);
        }
    };

    xhr.onerror = function() {
        console.warn('Erro de conexão ao carregar empresa');
    };

    xhr.send();
}

/**
 * Exibir informações da empresa na sidebar
 */
function exibirEmpresa() {
    var empresaContainer = document.getElementById('empresaInfo');
    if (!empresaContainer) return;

    var html = '';

    if (empresaInfo.nome) {
        html += '<div class="empresa-nome">';
        html += '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">';
        html += '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>';
        html += '</svg>';
        html += '<span>' + escapeHtml(empresaInfo.nome) + '</span>';
        html += '</div>';
    }

    if (empresaInfo.cnpj) {
        html += '<div class="empresa-detail">';
        html += '<span class="label">CNPJ:</span> ' + escapeHtml(empresaInfo.cnpj);
        html += '</div>';
    }

    if (empresaInfo.responsavel) {
        html += '<div class="empresa-detail">';
        html += '<span class="label">Resp.:</span> ' + escapeHtml(empresaInfo.responsavel);
        html += '</div>';
    }

    if (empresaInfo.whatsapp) {
        html += '<div class="empresa-detail empresa-whatsapp">';
        html += '<svg fill="currentColor" viewBox="0 0 24 24" width="14" height="14">';
        html += '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>';
        html += '</svg>';
        html += '<span>' + escapeHtml(empresaInfo.whatsapp) + '</span>';
        html += '</div>';
    }

    empresaContainer.innerHTML = html;
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Carregar empresa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está logado antes de carregar
    if (api && api.getUser()) {
        carregarEmpresa();
    }
});
