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

// Cria as tabelas do sistema (Versão Definitiva)
db.serialize(() => {
    
    // 1. Tabela de Professores (Agora com Senha e Perfil de Acesso)
    db.run(`CREATE TABLE IF NOT EXISTS professores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        disciplina TEXT NOT NULL,
        email TEXT UNIQUE,
        senha TEXT NOT NULL,
        perfil TEXT DEFAULT 'Professor' -- Pode ser 'Professor' ou 'Gestor'
    )`);

    // 2. Tabela de Carrinhos
    db.run(`CREATE TABLE IF NOT EXISTS carrinhos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        identificacao TEXT NOT NULL,
        quantidade_notebooks INTEGER NOT NULL,
        status TEXT DEFAULT 'Disponível' -- Pode ser 'Disponível' ou 'Manutenção'
    )`);

    // 3. Tabela de Reservas (Agora blindada para aulas Fixas e Avulsas)
    db.run(`CREATE TABLE IF NOT EXISTS reservas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        professor_id INTEGER,
        carrinho_id INTEGER,
        data_reserva TEXT NOT NULL,
        aula_referencia TEXT NOT NULL, 
        turma TEXT NOT NULL,
        tipo_reserva TEXT DEFAULT 'Avulsa', -- Pode ser 'Avulsa' ou 'Fixa'
        status TEXT DEFAULT 'Confirmada',
        FOREIGN KEY (professor_id) REFERENCES professores (id),
        FOREIGN KEY (carrinho_id) REFERENCES carrinhos (id)
    )`);

    // Criar coluna observações
    db.run(`ALTER TABLE carrinhos ADD COLUMN observacoes TEXT`, (err) => {
        if (err) {
            // Se o erro for "duplicate column name", significa que a coluna já existe
            console.log("Coluna 'observacoes' já verificada ou existente.");
        } else {
            console.log("Coluna 'observacoes' adicionada com sucesso!");
        }
    });
    
    console.log('Banco de dados atualizado: Perfis de acesso e Reservas Fixas configurados!');
});

module.exports = db;