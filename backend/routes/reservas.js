router.post('/', (req, res) => {
    const { professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva } = req.body;

    if (!segmento) return res.status(400).json({ erro: "Erro: O segmento é obrigatório." });

    // 1. CÁLCULO SEGURO DE DATA: Força o horário para o MEIO-DIA em UTC.
    // Isso impede que o fuso horário do servidor mude a data para o dia anterior.
    const dataNova = new Date(data_reserva + 'T12:00:00Z');
    const diaSemanaNovo = dataNova.getUTCDay(); 

    // 2. BUSCA GERAL: Trazemos tudo do carrinho e ignoramos a filtragem falha do SQLite
    const sqlBusca = `SELECT * FROM reservas WHERE carrinho_id = ?`;

    db.all(sqlBusca, [carrinho_id], (err, reservas) => {
        if (err) return res.status(500).json({ erro: "Erro no banco de dados." });

        let conflito = null;

        for (let r of reservas) {
            // NORMALIZAÇÃO DE TEXTO: Corta espaços invisíveis e protege contra dados nulos antigos
            const dbAula = String(r.aula_referencia).trim();
            const reqAula = String(aula_referencia).trim();
            const dbSegmento = String(r.segmento || 'Ensino Médio').trim();
            const reqSegmento = String(segmento).trim();

            // Se for outra aula ou outro segmento, ignora e vai para a próxima linha
            if (dbAula !== reqAula) continue;
            if (dbSegmento !== reqSegmento) continue;

            // Calcula o dia da semana da reserva salva no banco de forma segura
            const dataBanco = new Date(r.data_reserva + 'T12:00:00Z');
            const diaSemanaBanco = dataBanco.getUTCDay();

            // Regra A: Choque exato de data
            if (r.data_reserva === data_reserva) {
                conflito = r; break;
            }

            // Regra B: Já existe uma Fixa que foi criada antes ou na mesma data
            if (r.tipo_reserva === 'Fixa' && diaSemanaBanco === diaSemanaNovo && r.data_reserva <= data_reserva) {
                conflito = r; break;
            }

            // Regra C: Tentando criar Fixa hoje, mas já existe avulsa lançada no futuro
            if (tipo_reserva === 'Fixa' && diaSemanaBanco === diaSemanaNovo && r.data_reserva >= data_reserva) {
                conflito = r; break;
            }
        }

        // Se encontrou qualquer conflito nas regras acima, bloqueia imediatamente
        if (conflito) {
            const tipoMsg = conflito.tipo_reserva === 'Fixa' ? 'Fixa (Semanal)' : 'Avulsa';
            return res.status(400).json({ 
                erro: `Bloqueado: O ${segmento} já possui uma reserva ${tipoMsg} para a ${aula_referencia} neste dia.` 
            });
        }

        // 3. GRAVAÇÃO NO BANCO
        const sqlInsert = `
            INSERT INTO reservas (professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva, dia_semana) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(sqlInsert, [professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva, diaSemanaNovo], function(err) {
            if (err) return res.status(500).json({ erro: err.message });
            res.status(201).json({ id: this.lastID, mensagem: "Reserva realizada com sucesso!" });
        });
    });
});