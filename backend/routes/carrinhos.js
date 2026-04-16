const express = require('express');
const router = express.Router();
const db = require('../database/db'); // Isso conecta com o arquivo db.js que já criamos

// 1. Rota para LISTAR os carrinhos (GET)
router.get('/', (req, res) => {
    db.all(`SELECT * FROM carrinhos`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ erro: "Erro ao buscar carrinhos." });
        }
        res.json(rows);
    });
});

// 2. Rota para CADASTRAR um novo carrinho (POST)
router.post('/', (req, res) => {
    const { identificacao, quantidade_notebooks } = req.body;
    
    const query = `INSERT INTO carrinhos (identificacao, quantidade_notebooks) VALUES (?, ?)`;
    db.run(query, [identificacao, quantidade_notebooks], function(err) {
        if (err) {
            return res.status(500).json({ erro: "Erro ao cadastrar carrinho no banco." });
        }
        res.status(201).json({ 
            mensagem: "Carrinho cadastrado com sucesso!", 
            id: this.lastID 
        });
    });
});

// 3. Rota para EDITAR quantidade, status e observações
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { quantidade_notebooks, status, observacoes } = req.body;
    
    // Log para diagnóstico (aparecerá no seu terminal)
    console.log(`Recebido para atualizar ID ${id}:`, { quantidade_notebooks, status, observacoes });

    const query = `UPDATE carrinhos SET quantidade_notebooks = ?, status = ?, observacoes = ? WHERE id = ?`;
    
    db.run(query, [quantidade_notebooks, status, observacoes, id], function(err) {
        if (err) {
            console.error("Erro no Banco:", err.message);
            return res.status(500).json({ erro: err.message });
        }
        res.json({ mensagem: "Atualizado com sucesso!" });
    });
});

module.exports = router;

module.exports = router;