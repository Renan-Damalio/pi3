const express = require('express');
const router = express.Router();
const db = require('../database/db'); // Mantido o seu caminho original que está funcionando

// ROTA GET: Buscar todas as reservas
router.get('/', (req, res) => {
    const sql = `
        SELECT r.*, p.nome AS professor_nome, c.identificacao AS carrinho_nome 
        FROM reservas r
        LEFT JOIN professores p ON r.professor_id = p.id
        LEFT JOIN carrinhos c ON r.carrinho_id = c.id
        ORDER BY r.data_reserva ASC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

// ROTA POST: Criar nova reserva
router.post('/', (req, res) => {
    const { professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva } = req.body;

    if (!segmento) return res.status(400).json({ erro: "O segmento é obrigatório." });

    // 1. BLINDAGEM MÁXIMA PARA IDENTIFICAR A RESERVA FIXA
    const isFixa = String(tipo_reserva).toLowerCase().includes('fixa');
    
    const datasParaReservar = [];
    let dataAtual = new Date(data_reserva + 'T12:00:00Z');
    const anoReferencia = dataAtual.getUTCFullYear();
    const dataLimite = new Date(`${anoReferencia}-12-31T12:00:00Z`);

    if (isFixa) {
        while (dataAtual <= dataLimite) {
            datasParaReservar.push(dataAtual.toISOString().split('T')[0]);
            dataAtual.setUTCDate(dataAtual.getUTCDate() + 7);
        }
    } else {
        datasParaReservar.push(data_reserva);
    }

    const placeholders = datasParaReservar.map(() => '?').join(',');
    const sqlCheck = `
        SELECT data_reserva FROM reservas 
        WHERE carrinho_id = ? 
        AND aula_referencia = ? 
        AND segmento = ? 
        AND data_reserva IN (${placeholders})
    `;

    db.all(sqlCheck, [carrinho_id, aula_referencia, segmento, ...datasParaReservar], (err, rows) => {
        if (err) return res.status(500).json({ erro: "Erro ao validar conflitos." });
        
        if (rows && rows.length > 0) {
            const dataErro = rows[0].data_reserva.split('-').reverse().join('/');
            return res.status(400).json({ erro: `Bloqueado: O dia ${dataErro} já está ocupado para este carrinho.` });
        }

        let sqlInsert = `INSERT INTO reservas (professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva, dia_semana) VALUES `;
        let valuesArr = [];
        let params = [];

        datasParaReservar.forEach(dataStr => {
            const diaSemana = new Date(dataStr + 'T12:00:00Z').getUTCDay();
            valuesArr.push("(?, ?, ?, ?, ?, ?, ?, ?)");
            const tipoGravado = isFixa ? 'Fixa' : 'Avulsa';
            params.push(professor_id, carrinho_id, dataStr, aula_referencia, turma, segmento, tipoGravado, diaSemana);
        });

        sqlInsert += valuesArr.join(', ');

        db.run(sqlInsert, params, function(err) {
            if (err) return res.status(500).json({ erro: "Erro ao salvar as reservas." });
            
            // O MARCADOR ESTÁ AQUI:
            res.status(201).json({ 
                mensagem: `MARCADOR: O sistema gerou e validou ${datasParaReservar.length} reserva(s) com sucesso até o fim do ano!` 
            });
        });
    });
});

// ROTA DELETE: Excluir reserva
router.delete('/:id', (req, res) => {
    db.run(`DELETE FROM reservas WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: "Reserva excluída com sucesso" });
    });
});

module.exports = router;