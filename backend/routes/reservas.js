router.post('/', (req, res) => {
    const { professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva } = req.body;

    if (!segmento) return res.status(400).json({ erro: "O segmento é obrigatório." });

    // 1. GERADOR DE SEQUÊNCIA: Calcula as datas de 7 em 7 dias
    const isFixa = String(tipo_reserva).trim().toLowerCase() === 'fixa';
    const datasParaReservar = [];
    let dataAtual = new Date(data_reserva + 'T12:00:00Z');
    const anoReferencia = dataAtual.getUTCFullYear();
    const dataLimite = new Date(`${anoReferencia}-12-31T12:00:00Z`);

    if (isFixa) {
        // Cria a sequência semanal até 31 de Dezembro
        while (dataAtual <= dataLimite) {
            datasParaReservar.push(dataAtual.toISOString().split('T')[0]);
            dataAtual.setUTCDate(dataAtual.getUTCDate() + 7);
        }
    } else {
        datasParaReservar.push(data_reserva);
    }

    // 2. VALIDAÇÃO DE CONFLITO EM LOTE
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
            return res.status(400).json({ erro: `Conflito: O dia ${dataErro} já está ocupado para este segmento.` });
        }

        // 3. INSERÇÃO ÚNICA (MULTI-ROW INSERT)
        // Montamos um único comando SQL: INSERT INTO ... VALUES (?,?,?,...), (?,?,?,...)
        let sqlInsert = `INSERT INTO reservas (professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva, dia_semana) VALUES `;
        let valuesArr = [];
        let params = [];

        datasParaReservar.forEach(dataStr => {
            const diaSemana = new Date(dataStr + 'T12:00:00Z').getUTCDay();
            valuesArr.push("(?, ?, ?, ?, ?, ?, ?, ?)");
            params.push(professor_id, carrinho_id, dataStr, aula_referencia, turma, segmento, tipo_reserva, diaSemana);
        });

        sqlInsert += valuesArr.join(', ');

        db.run(sqlInsert, params, function(err) {
            if (err) {
                console.error("Erro no Insert:", err);
                return res.status(500).json({ erro: "Erro ao processar a sequência de reservas." });
            }
            res.status(201).json({ 
                mensagem: `Sucesso! Foram criadas ${this.changes} reservas para o ${segmento} até o fim do ano.` 
            });
        });
    });
});