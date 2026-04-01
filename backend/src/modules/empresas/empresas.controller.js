/**
 * Empresas Controller
 * Controlador para operações relacionadas a empresas
 */

const service = require('./empresas.service');

/**
 * GET /empresas/atual
 * Buscar dados da empresa do usuário logado
 */
async function buscarAtual(req, res) {
    try {
        const id_empresa = req.usuario.id_empresa;
        const empresa = await service.buscarPorId(id_empresa);
        
        if (!empresa) {
            return res.status(404).json({ 
                erro: 'Empresa não encontrada' 
            });
        }
        
        res.json(empresa);
    } catch (error) {
        console.error('Erro ao buscar empresa:', error);
        res.status(500).json({ 
            erro: 'Erro interno ao buscar empresa' 
        });
    }
}

module.exports = {
    buscarAtual
};
