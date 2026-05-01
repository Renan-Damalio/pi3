router.post('/', (req, res) => {
    const { professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva } = req.body;

    // 1. CÁLCULO DO DIA DA SEMANA ANTES DA VALIDAÇÃO (0 = Domingo, 1 = Segunda, etc.)
    const dia_semana = new Date(data_reserva + 'T00:00:00').getDay();

    // 2. LÓGICA DE VALIDAÇÃO APRIMORADA COM STRFTIME: 
    // Isola o segmento (Fundamental não esbarra no Médio) e verifica os bloqueios temporais de forma nativa no banco
    const sqlVerificar = `
        SELECT * FROM reservas 
        WHERE carrinho_id = ? 
        AND aula_referencia = ? 
        AND segmento = ?
        AND (
            data_reserva = ? -- Cenário A: Mesma data exata ocupada
            OR (tipo_reserva = 'Fixa' AND strftime('%w', data_reserva) = strftime('%w', ?) AND data_reserva <= ?) -- Cenário B: Já existe uma Fixa que começou antes ou na mesma data
            OR (? = 'Fixa' AND strftime('%w', data_reserva) = strftime('%w', ?) AND data_reserva >= ?) -- Cenário C: A nova é fixa, mas já tem datas futuras preenchidas
        )
    `;

    // Parâmetros que alimentam as interrogações (?) do SQL acima
    const parametrosVerificacao = [
        carrinho_id, 
        aula_referencia, 
        segmento, 
        data_reserva, // Para Cenário A: conflito da mesma data
        data_reserva, data_reserva, // Para Cenário B: compara o dia da semana e garante que a fixa existente é anterior ou igual
        tipo_reserva, data_reserva, data_reserva // Para Cenário C: verifica se a tentativa atual é 'Fixa', compara dia da semana e olha para o futuro
    ];

    db.get(sqlVerificar, parametrosVerificacao, (err, row) => {
        if (err) {
            return res.status(500).json({ erro: "Erro ao verificar disponibilidade." });
        }

        // Se 'row' existir, significa que barrou em alguma das regras (A, B ou C)
        if (row) {
            const tipoOcupacao = row.tipo_reserva === 'Fixa' ? 'Fixa (Semanal)' : 'Avulsa';
            return res.status(400).json({ 
                erro: `Reserva bloqueada: O ${segmento} já possui uma reserva ${tipoOcupacao} neste carrinho e horário.` 
            });
        }

        // 3. SE PASSAR NA VALIDAÇÃO, FAZ O INSERT
        const sqlInsert = `
            INSERT INTO reservas (professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva, dia_semana) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(sqlInsert, [professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva, dia_semana], function(err) {
            if (err) return res.status(500).json({ erro: err.message });
            res.status(201).json({ id: this.lastID, mensagem: "Reserva realizada com sucesso!" });
        });
    });
});