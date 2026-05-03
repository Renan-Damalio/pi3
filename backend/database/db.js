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

// Cria as tabelas do sistema
db.serialize(() => {
    
    // 1. Tabela de Professores
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
        status TEXT DEFAULT 'Disponível',
        observacoes TEXT
    )`);

    // 3. Tabela de Reservas (Versão Definitiva)
    // O DEFAULT foi ajustado para bater com os nomes enviados pelo Frontend (index.html)
    db.run(`CREATE TABLE IF NOT EXISTS reservas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        professor_id INTEGER,
        carrinho_id INTEGER,
        data_reserva TEXT NOT NULL,
        aula_referencia TEXT NOT NULL, 
        turma TEXT NOT NULL,
        segmento TEXT DEFAULT 'Ensino Médio', 
        tipo_reserva TEXT DEFAULT 'Avulsa', 
        dia_semana INTEGER, 
        status TEXT DEFAULT 'Confirmada',
        FOREIGN KEY (professor_id) REFERENCES professores (id),
        FOREIGN KEY (carrinho_id) REFERENCES carrinhos (id)
    )`);

    // --- BLOCO DE ATUALIZAÇÃO PARA O RENDER ---
    // (Caso o banco antigo ainda exista lá, ele tentará adicionar as colunas)
    
    db.run(`ALTER TABLE carrinhos ADD COLUMN observacoes TEXT`, (err) => {
        if (!err) console.log("Coluna 'observacoes' adicionada!");
    });

    db.run(`ALTER TABLE reservas ADD COLUMN segmento TEXT DEFAULT 'Ensino Médio'`, (err) => {
        if (!err) console.log("Coluna 'segmento' adicionada em reservas!");
    });

    db.run(`ALTER TABLE reservas ADD COLUMN dia_semana INTEGER`, (err) => {
        if (!err) console.log("Coluna 'dia_semana' adicionada em reservas!");
    });

    db.run(`ALTER TABLE professores ADD COLUMN email TEXT`, (err) => {
        if (!err) console.log("Coluna 'email' adicionada em professores!");
    });

    db.run(`ALTER TABLE professores ADD COLUMN perfil TEXT`, (err) => {
        if (!err) console.log("Coluna 'perfil' adicionada em professores!");
    });

    console.log('Banco de dados operacional e atualizado!');
});

module.exports = db;