router.post('/', (req, res) => {
    const { professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva } = req.body;

    // Trava de segurança
    if (!segmento) return res.status(400).json({ erro: "Erro: O segmento escolar é obrigatório." });

    // 1. GERADOR DE DATAS: Preenche até o final do ano
    const datasParaReservar = [];
    let dataAtual = new Date(data_reserva + 'T12:00:00Z');
    
    const anoReserva = dataAtual.getUTCFullYear();
    const dataLimite = new Date(`${anoReserva}-12-31T12:00:00Z`);

    if (tipo_reserva === 'Fixa') {
        while (dataAtual <= dataLimite) {
            const ano = dataAtual.getUTCFullYear();
            const mes = String(dataAtual.getUTCMonth() + 1).padStart(2, '0');
            const dia = String(dataAtual.getUTCDate()).padStart(2, '0');
            
            datasParaReservar.push(`${ano}-${mes}-${dia}`);
            dataAtual.setUTCDate(dataAtual.getUTCDate() + 7);
        }
    } else {
        datasParaReservar.push(data_reserva);
    }

    // 2. VALIDAÇÃO INFALÍVEL
    const placeholders = datasParaReservar.map(() => '?').join(',');
    const sqlVerificar = `
        SELECT data_reserva FROM reservas 
        WHERE carrinho_id = ? 
        AND aula_referencia = ? 
        AND segmento = ?
        AND data_reserva IN (${placeholders})
    `;

    const paramsBusca = [carrinho_id, aula_referencia, segmento, ...datasParaReservar];

    db.all(sqlVerificar, paramsBusca, (err, rows) => {
        if (err) return res.status(500).json({ erro: "Erro ao verificar o banco de dados." });

        if (rows.length > 0) {
            const dataConflito = rows[0].data_reserva.split('-').reverse().join('/');
            return res.status(400).json({ 
                erro: `Bloqueado: O ${segmento} já tem uma reserva neste carrinho e horário no dia ${dataConflito}.` 
            });
        }

        // 3. GRAVAÇÃO EM MASSA COM TRANSAÇÃO (Ou tudo, ou nada)
        // O serialize garante que os comandos não se atropelem
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            const sqlInsert = `INSERT INTO reservas (professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva, dia_semana) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            
            // O 'prepare' compila o comando apenas uma vez para rodar mais rápido no loop
            const stmt = db.prepare(sqlInsert);
            
            let erroNaTransacao = false;

            datasParaReservar.forEach(data => {
                const diaSemanaNum = new Date(data + 'T12:00:00Z').getUTCDay();
                stmt.run([professor_id, carrinho_id, data, aula_referencia, turma, segmento, tipo_reserva, diaSemanaNum], function(err) {
                    if (err) erroNaTransacao = true; // Se der um único erro, marcamos a flag
                });
            });

            stmt.finalize(); // Fecha a compilação do SQL

            // Toma a decisão final baseada na flag
            db.run("COMMIT", function(err) {
                if (err || erroNaTransacao) {
                    // Se falhou, roda o ROLLBACK (apaga os inserts parciais) e envia UMA única resposta de erro.
                    db.run("ROLLBACK");
                    return res.status(500).json({ erro: "Falha na transação do banco. Nenhuma reserva foi salva para evitar dados corrompidos." });
                } else {
                    // Sucesso total. Envia UMA única resposta de sucesso.
                    return res.status(201).json({ mensagem: "Todas as reservas foram processadas e salvas com segurança!" });
                }
            });
        });
    });
});