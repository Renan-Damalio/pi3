router.post('/', (req, res) => {
    const { professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva } = req.body;

    if (!segmento) return res.status(400).json({ erro: "Erro: O segmento escolar é obrigatório." });

    // 1. BLINDAGEM DE TEXTO: Transforma "FIXA", "Fixa ", "fixa" tudo no mesmo padrão seguro
    const isFixa = String(tipo_reserva).trim().toLowerCase() === 'fixa';

    // 2. GERADOR DE DATAS ATÉ O FIM DO ANO
    const datasParaReservar = [];
    let dataAtual = new Date(data_reserva + 'T12:00:00Z');
    
    const anoReserva = dataAtual.getUTCFullYear();
    const dataLimite = new Date(`${anoReserva}-12-31T12:00:00Z`);

    if (isFixa) {
        // Se reconheceu que é fixa, roda o loop somando 7 dias até 31 de Dezembro
        while (dataAtual <= dataLimite) {
            const ano = dataAtual.getUTCFullYear();
            const mes = String(dataAtual.getUTCMonth() + 1).padStart(2, '0');
            const dia = String(dataAtual.getUTCDate()).padStart(2, '0');
            
            datasParaReservar.push(`${ano}-${mes}-${dia}`);
            dataAtual.setUTCDate(dataAtual.getUTCDate() + 7);
        }
    } else {
        // Se for avulsa, grava só o dia pedido
        datasParaReservar.push(data_reserva);
    }

    // 3. VALIDAÇÃO DE CONFLITOS (Olhando para a lista inteira de datas geradas)
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

        // Se o banco achar qualquer conflito, trava tudo e avisa a data exata!
        if (rows.length > 0) {
            const dataConflito = rows[0].data_reserva.split('-').reverse().join('/');
            return res.status(400).json({ 
                erro: `Bloqueado: O ${segmento} já tem uma reserva neste carrinho no dia ${dataConflito}.` 
            });
        }

        // 4. GRAVAÇÃO SEGURA EM LOTE (Evitando Crash do Servidor)
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

                // Só responde ao cliente quando o loop inteiro terminar (garante a regra do Express de 1 resposta só)
                if (insercoesFeitas === datasParaReservar.length) {
                    if (teveErro) {
                        return res.status(500).json({ erro: "Algumas reservas falharam ao serem salvas no banco." });
                    }
                    res.status(201).json({ mensagem: "Reservas geradas e validadas com sucesso até o fim do ano!" });
                }
            });
        });
    });
});