const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Listar Professores
router.get('/', (req, res) => {
    db.all(`SELECT id, nome, disciplina, email, perfil FROM professores`, [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

// Cadastrar Professor
router.post('/', (req, res) => {
    const { nome, disciplina, email, perfil } = req.body;
    const query = `INSERT INTO professores (nome, disciplina, email, perfil) VALUES (?, ?, ?, ?)`;
    db.run(query, [nome, disciplina, email, perfil || 'Professor'], function(err) {
        if (err) return res.status(500).json({ erro: "Erro ao cadastrar professor." });
        res.status(201).json({ mensagem: "Professor cadastrado!", id: this.lastID });
    });
});

// Excluir Professor
router.delete('/:id', (req, res) => {
    // 1. Capturamos o ID que veio na URL (ex: /professores/3)
    const idDoProfessor = req.params.id;

    // 2. Montamos a query SQL de exclusão
    const query = `DELETE FROM professores WHERE id = ?`;

    // 3. Executamos no banco de dados
    db.run(query, [idDoProfessor], function(err) {
        if (err) {
            // Se der erro no banco (ex: tabela não existe), retornamos erro 500
            return res.status(500).json({ erro: "Erro ao tentar excluir o professor." });
        }
        
        // 'this.changes' nos diz quantas linhas foram afetadas no banco.
        // Se for 0, significa que o ID enviado não existia.
        if (this.changes === 0) {
            return res.status(404).json({ aviso: "Professor não encontrado." });
        }

        // Tudo deu certo, retornamos uma mensagem de sucesso
        res.status(200).json({ mensagem: "Professor excluído com sucesso!" });
    });
});

// ESSA LINHA É A MAIS IMPORTANTE:
module.exports = router;