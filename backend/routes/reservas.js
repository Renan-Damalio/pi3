router.post('/', (req, res) => {
    const { professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva } = req.body;

    // Trava de segurança
    if (!segmento) return res.status(400).json({ erro: "Erro: O segmento escolar é obrigatório." });

    // 1. GERADOR DE DATAS: Preenche até o final do ano
    const datasParaReservar = [];
    let dataAtual = new Date(data_reserva + 'T12:00:00Z');
    
    // Descobre qual é o ano da reserva para definir o limite (31 de Dezembro do mesmo ano)
    const anoReserva = dataAtual.getUTCFullYear();
    const dataLimite = new Date(`${anoReserva}-12-31T12:00:00Z`);

    if (tipo_reserva === 'Fixa') {
        // Loop: Repete de 7 em 7 dias enquanto a data for menor ou igual a 31/12
        while (dataAtual <= dataLimite) {
            const ano = dataAtual.getUTCFullYear();
            const mes = String(dataAtual.getUTCMonth() + 1).padStart(2, '0');
            const dia = String(dataAtual.getUTCDate()).padStart(2, '0');
            
            datasParaReservar.push(`${ano}-${mes}-${dia}`);

            // Soma 7 dias exatos para o próximo pulo
            dataAtual.setUTCDate(dataAtual.getUTCDate() + 7);
        }
    } else {
        // Se a reserva for Avulsa, joga apenas a data solicitada na lista
        datasParaReservar.push(data_reserva);
    }

    // 2. VALIDAÇÃO INFALÍVEL: Verifica se ALGUMA das datas geradas já está ocupada
    // Cria os pontos de interrogação (?) dinamicamente para a busca no SQL
    const placeholders = datasParaReservar.map(() => '?').join(',');
    
    const sqlVerificar = `
        SELECT data_reserva FROM reservas 
        WHERE carrinho_id = ? 
        AND aula_referencia = ? 
        AND segmento = ?
        AND data_reserva IN (${placeholders})
    `;

    // Junta os parâmetros fixos com a lista de datas
    const paramsBusca = [carrinho_id, aula_referencia, segmento, ...datasParaReservar];

    db.all(sqlVerificar, paramsBusca, (err, rows) => {
        if (err) return res.status(500).json({ erro: "Erro ao verificar o banco de dados." });

        // Se retornar qualquer linha, significa que pelo menos uma data já bateu com outra reserva!
        if (rows.length > 0) {
            // Pega a primeira data que deu conflito e inverte para o formato brasileiro (DD/MM/YYYY)
            const dataConflito = rows[0].data_reserva.split('-').reverse().join('/');
            return res.status(400).json({ 
                erro: `Bloqueado: O ${segmento} já tem uma reserva neste carrinho e horário no dia ${dataConflito}.` 
            });
        }

        // 3. GRAVAÇÃO EM MASSA: Insere todas as datas geradas de uma vez
        const sqlInsert = `
            INSERT INTO reservas (professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva, dia_semana) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        let insercoesFeitas = 0;
        let teveErro = false;

        datasParaReservar.forEach(data => {
            // Calcula o dia da semana (0 a 6)
            const diaSemanaNum = new Date(data + 'T12:00:00Z').getUTCDay();

            db.run(sqlInsert, [professor_id, carrinho_id, data, aula_referencia, turma, segmento, tipo_reserva, diaSemanaNum], function(err) {
                if (err) teveErro = true;
                insercoesFeitas++;

                // Quando terminar de rodar a última data gerada, devolve a resposta final
                if (insercoesFeitas === datasParaReservar.length) {
                    if (teveErro) {
                        return res.status(500).json({ erro: "Atenção: Algumas datas falharam ao serem salvas." });
                    }
                    res.status(201).json({ mensagem: "Reserva(s) processada(s) com sucesso!" });
                }
            });
        });
    });
});