/**
 * Empresas Service
 * Serviço para operações relacionadas a empresas
 */

const pool = require('../../config/db');

/**
 * Buscar empresa por ID
 */
async function buscarPorId(id_empresa) {
    const query = `
        SELECT 
            id,
            nome,
            cnpj,
            email,
            telefone,
            responsavel,
            whatsapp,
            ativo,
            created_at
        FROM empresas 
        WHERE id = $1 AND ativo = true
    `;
    
    const { rows } = await pool.query(query, [id_empresa]);
    return rows[0] || null;
}

module.exports = {
    buscarPorId
};
