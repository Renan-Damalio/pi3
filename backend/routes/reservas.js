router.post('/', (req, res) => {
    const { professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva } = req.body;

    if (!segmento) return res.status(400).json({ erro: "Erro: O segmento escolar é obrigatório." });

    // 1. QUANTAS DATAS VAMOS GERAR?
    // Se for Fixa, gera para as próximas 20 semanas (1 semestre). Se for Avulsa, gera só 1.
    const semanasParaGerar = tipo_reserva === 'Fixa' ? 20 : 1; 
    const datasParaReservar = [];

    // Lógica para gerar as datas futuras
    let dataAtual = new Date(data_reserva + 'T12:00:00Z');
    
    for (let i = 0; i < semanasParaGerar; i++) {
        // Formata a data para YYYY-MM-DD
        const ano = dataAtual.getUTCFullYear();
        const mes = String(dataAtual.getUTCMonth() + 1).padStart(2, '0');
        const dia = String(dataAtual.getUTCDate()).padStart(2, '0');
        datasParaReservar.push(`${ano}-${mes}-${dia}`);

        // Adiciona 7 dias exatos para o próximo loop
        dataAtual.setUTCDate(dataAtual.getUTCDate() + 7);
    }

    // 2. VALIDAÇÃO SIMPLES E INFALÍVEL
    // Monta os '?' dinamicamente dependendo de quantas datas geramos
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

        // Se encontrou QUALQUER linha, significa que pelo menos uma das datas já está ocupada
        if (rows.length > 0) {
            // Pega a primeira data que deu conflito e formata para BR para mostrar no erro
            const dataConflito = rows[0].data_reserva.split('-').reverse().join('/');
            return res.status(400).json({ 
                erro: `Bloqueado: O ${segmento} já tem uma reserva para este carrinho na data ${dataConflito}.` 
            });
        }

        // 3. GRAVAÇÃO EM LOTE (BATCH INSERT)
        const sqlInsert = `
            INSERT INTO reservas (professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva, dia_semana) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        let insercoesFeitas = 0;
        let teveErro = false;

        datasParaReservar.forEach(data => {
            const diaSemanaNum = new Date(data + 'T12:00:00Z').getUTCDay();

            db.run(sqlInsert, [professor_id, carrinho_id, data, aula_referencia, turma, segmento, tipo_reserva, diaSemanaNum], function(err) {
                if (err) teveErro = true;
                insercoesFeitas++;

                // Quando terminar de gravar a última data, devolve a resposta de Sucesso
                if (insercoesFeitas === datasParaReservar.length) {
                    if (teveErro) {
                        return res.status(500).json({ erro: "Algumas reservas falharam ao serem salvas." });
                    }
                    res.status(201).json({ mensagem: "Reserva(s) processada(s) com sucesso!" });
                }
            });
        });
    });
});