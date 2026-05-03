router.post('/', (req, res) => {
    const { professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva } = req.body;

    if (!segmento) return res.status(400).json({ erro: "Erro: O segmento é obrigatório." });

    // Força o horário para o MEIO-DIA em UTC para evitar bugs de fuso horário
    const dataNova = new Date(data_reserva + 'T12:00:00Z');
    const diaSemanaNovo = dataNova.getUTCDay(); 

    // Busca apenas pelo carrinho (ignorando textos problemáticos no SQL)
    const sqlBusca = `SELECT * FROM reservas WHERE carrinho_id = ?`;

    db.all(sqlBusca, [carrinho_id], (err, reservas) => {
        if (err) return res.status(500).json({ erro: "Erro no banco de dados." });

        let conflito = null;

        for (let r of reservas) {
            // 🛡️ BLINDAGEM DE ENCODING 1: Extrai APENAS os números da aula (Ex: "1ª Aula" vira "1")
            const aulaDb = String(r.aula_referencia).replace(/\D/g, "");
            const aulaReq = String(aula_referencia).replace(/\D/g, "");
            
            // 🛡️ BLINDAGEM DE ENCODING 2: Simplifica o segmento para 'ef' (Fundamental) ou 'em' (Médio)
            const segDb = String(r.segmento).toLowerCase().includes('fundamental') ? 'ef' : 'em';
            const segReq = String(segmento).toLowerCase().includes('fundamental') ? 'ef' : 'em';

            // Se for outra aula ou outro segmento, eles não se cruzam. Pula para o próximo!
            if (aulaDb !== aulaReq) continue;
            if (segDb !== segReq) continue;

            // Datas do banco
            const dataBanco = new Date(r.data_reserva + 'T12:00:00Z');
            const diaSemanaBanco = dataBanco.getUTCDay();

            // Regra A: Choque exato de data
            if (r.data_reserva === data_reserva) {
                conflito = r; break;
            }

            // Regra B: Já existe uma Fixa que foi criada antes ou na mesma data
            if (r.tipo_reserva === 'Fixa' && diaSemanaBanco === diaSemanaNovo && dataBanco <= dataNova) {
                conflito = r; break;
            }

            // Regra C: Tentando criar Fixa hoje, mas já existe avulsa lançada no futuro
            if (tipo_reserva === 'Fixa' && diaSemanaBanco === diaSemanaNovo && dataBanco >= dataNova) {
                conflito = r; break;
            }
        }

        // Se o loop acima encontrou um conflito, barramos aqui.
        if (conflito) {
            const tipoMsg = conflito.tipo_reserva === 'Fixa' ? 'Fixa (Semanal)' : 'Avulsa';
            return res.status(400).json({ 
                erro: `Bloqueado: A ${aula_referencia} já possui uma reserva ${tipoMsg} para o ${segmento} neste carrinho e dia da semana.` 
            });
        }

        // Se chegou até aqui, está 100% livre. Grava no banco com os textos originais bonitinhos.
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