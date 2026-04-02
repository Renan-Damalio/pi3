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
    const { nome, disciplina, email, senha, perfil } = req.body;
    const query = `INSERT INTO professores (nome, disciplina, email, senha, perfil) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [nome, disciplina, email, senha, perfil || 'Professor'], function(err) {
        if (err) return res.status(500).json({ erro: "Erro ao cadastrar professor." });
        res.status(201).json({ mensagem: "Professor cadastrado!", id: this.lastID });
    });
});

// ESSA LINHA É A MAIS IMPORTANTE:
module.exports = router;