const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Listar todas as reservas (unindo dados de professor e carrinho)
router.get('/', (req, res) => {
    const query = `
        SELECT r.*, p.nome as professor_nome, c.identificacao as carrinho_nome 
        FROM reservas r
        JOIN professores p ON r.professor_id = p.id
        JOIN carrinhos c ON r.carrinho_id = c.id
        ORDER BY r.data_reserva DESC, r.aula_referencia ASC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

// Criar nova reserva com trava de segurança
router.post('/', (req, res) => {
    const { professor_id, carrinho_id, data_reserva, aula_referencia, turma, tipo_reserva } = req.body;
    
    // Verifica se o carrinho já está ocupado no mesmo dia e aula
    const checkQuery = `SELECT id FROM reservas WHERE carrinho_id = ? AND data_reserva = ? AND aula_referencia = ?`;
    
    db.get(checkQuery, [carrinho_id, data_reserva, aula_referencia], (err, row) => {
        if (row) {
            return res.status(400).json({ erro: "Este carrinho já está reservado para este horário!" });
        }

        const insertQuery = `INSERT INTO reservas (professor_id, carrinho_id, data_reserva, aula_referencia, turma, tipo_reserva) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(insertQuery, [professor_id, carrinho_id, data_reserva, aula_referencia, turma, tipo_reserva || 'Avulsa'], function(err) {
            if (err) return res.status(500).json({ erro: err.message });
            res.status(201).json({ mensagem: "Reserva confirmada!", id: this.lastID });
        });
    });
});
// Rota para EXCLUIR uma reserva
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM reservas WHERE id = ?`;

    db.run(query, [id], function(err) {
        if (err) return res.status(500).json({ erro: "Erro ao excluir reserva." });
        res.json({ mensagem: "Reserva removida com sucesso!" });
    });
});
module.exports = router;