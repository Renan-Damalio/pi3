router.post('/', (req, res) => {
    const { professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva } = req.body;

    // Trava de segurança para garantir que a requisição está completa
    if (!segmento) return res.status(400).json({ erro: "Erro: O segmento é obrigatório." });

    // Node.js calcula o dia da semana novo (0 a 6)
    const dataNovaObj = new Date(data_reserva + 'T00:00:00');
    const diaSemanaNovo = dataNovaObj.getDay(); 

    // 1. Puxamos do banco TODAS as reservas apenas deste Carrinho e desta Aula
    const sqlBusca = `SELECT * FROM reservas WHERE carrinho_id = ? AND aula_referencia = ?`;

    db.all(sqlBusca, [carrinho_id, aula_referencia], (err, reservasExistentes) => {
        if (err) return res.status(500).json({ erro: "Erro ao consultar o banco de dados." });

        let conflito = null;

        // 2. LÓGICA DE VALIDAÇÃO EM JAVASCRIPT (Imune a falhas de tipagem do SQLite)
        for (let r of reservasExistentes) {
            
            // REGRA 1 (Isolamento): Ensino Médio e Fundamental não se enxergam.
            // Se a reserva do banco for de um segmento diferente da atual, pula para a próxima.
            if (r.segmento !== segmento) continue;

            // Recalculamos o dia da semana da reserva gravada para ignorar a coluna do banco
            const dataBancoObj = new Date(r.data_reserva + 'T00:00:00');
            const diaSemanaBanco = dataBancoObj.getDay();

            // Cenário A: Choque exato de data
            if (r.data_reserva === data_reserva) {
                conflito = r; break;
            }

            // Cenário B: Já existe uma reserva FIXA no passado/hoje que bloqueia esta semana
            if (r.tipo_reserva === 'Fixa' && diaSemanaBanco === diaSemanaNovo && r.data_reserva <= data_reserva) {
                conflito = r; break;
            }

            // Cenário C: Tentativa de criar uma FIXA hoje, mas já existe agendamento futuro
            if (tipo_reserva === 'Fixa' && diaSemanaBanco === diaSemanaNovo && r.data_reserva >= data_reserva) {
                conflito = r; break;
            }
        }

        // Se o JavaScript encontrou um conflito, ele barra o acesso imediatamente
        if (conflito) {
            const tipoMsg = conflito.tipo_reserva === 'Fixa' ? 'Fixa (Semanal)' : 'Avulsa';
            return res.status(400).json({ 
                erro: `Bloqueado: O ${segmento} já possui uma reserva ${tipoMsg} neste carrinho para esta data ou dia da semana.` 
            });
        }

        // 3. Se passou invicto pela validação, grava no banco!
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