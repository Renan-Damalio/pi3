const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cria o arquivo do banco de dados SQLite
const dbPath = path.resolve(__dirname, 'escola.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite da Escola.');
    }
});

// Cria as tabelas do sistema (Versão Ajustada sem Senha Obrigatória)
db.serialize(() => {
    
    // 1. Tabela de Professores
    // AJUSTE: Removido 'NOT NULL' da senha para permitir cadastro via frontend sem esse campo
    db.run(`CREATE TABLE IF NOT EXISTS professores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        disciplina TEXT NOT NULL,
        email TEXT,
        senha TEXT, 
        perfil TEXT DEFAULT 'Professor'
    )`);

    // 2. Tabela de Carrinhos
    db.run(`CREATE TABLE IF NOT EXISTS carrinhos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        identificacao TEXT NOT NULL,
        quantidade_notebooks INTEGER NOT NULL,
        status TEXT DEFAULT 'Disponível'
    )`);

    // 3. Tabela de Reservas
    db.run(`CREATE TABLE IF NOT EXISTS reservas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        professor_id INTEGER,
        carrinho_id INTEGER,
        data_reserva TEXT NOT NULL,
        aula_referencia TEXT NOT NULL, 
        turma TEXT NOT NULL,
        tipo_reserva TEXT DEFAULT 'Avulsa',
        status TEXT DEFAULT 'Confirmada',
        FOREIGN KEY (professor_id) REFERENCES professores (id),
        FOREIGN KEY (carrinho_id) REFERENCES carrinhos (id)
    )`);

    // --- BLOCO DE ATUALIZAÇÃO DE COLUNAS (Prevenção de Erro 500) ---
    
    // Adicionar observações em carrinhos
    db.run(`ALTER TABLE carrinhos ADD COLUMN observacoes TEXT`, (err) => {
        if (!err) console.log("Coluna 'observacoes' adicionada!");
    });

    // Adicionar email em professores (caso o banco seja antigo)
    db.run(`ALTER TABLE professores ADD COLUMN email TEXT`, (err) => {
        if (!err) console.log("Coluna 'email' adicionada em professores!");
    });

    // Adicionar perfil em professores (caso o banco seja antigo)
    db.run(`ALTER TABLE professores ADD COLUMN perfil TEXT`, (err) => {
        if (!err) console.log("Coluna 'perfil' adicionada em professores!");
    });
    
    console.log('Banco de dados operacional e atualizado!');
});

module.exports = db;