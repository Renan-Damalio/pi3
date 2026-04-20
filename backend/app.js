const express = require('express');
const cors = require('cors');
const db = require('./database/db'); // Importa o banco de dados

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- ADICIONADA ESTAS DUAS LINHAS ABAIXO APÓS FALHAS NA EXECUÇÃO ---
const rotasCarrinhos = require('./routes/carrinhos');
app.use('/api/carrinhos', rotasCarrinhos);
// -----------------------------------------
// --- ADICIONADA ROTAS PROFESSORES ---
const rotasProfessores = require('./routes/professores');
app.use('/api/professores', rotasProfessores);
// -----------------------------------------
// --- ADICIONA AAS RESERVAS DE CARRINHO ---
const rotasReservas = require('./routes/reservas');
app.use('/api/reservas', rotasReservas);
// -----------------------------------------
// Rota de teste
app.get('/', (req, res) => {
    res.json({ mensagem: "API de Reserva de Carrinhos rodando perfeitamente!" });
});

// --- AJUSTE PARA TESTES (JEST) ---
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

// Exporta o app para o Jest
module.exports = app;