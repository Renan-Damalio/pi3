router.post('/', (req, res) => {
    const { professor_id, carrinho_id, data_reserva, aula_referencia, turma, segmento, tipo_reserva } = req.body;

    // TRAVA DE SEGURANÇA: Garante que o segmento não chegue vazio do Frontend
    if (!segmento) {
        return res.status(400).json({ erro: "Erro: O segmento escolar é obrigatório." });
    }

    // 1. CÁLCULO DO DIA DA SEMANA ANTES DA VALIDAÇÃO (0 = Domingo, 1 = Segunda, etc.)
    const dia_semana = new Date(data_reserva + 'T00:00:00').getDay();

    // 2. LÓGICA DE VALIDAÇÃO APRIMORADA: 
    // Isola o segmento (Fundamental não esbarra no Médio) e verifica os bloqueios temporais usando o Node.js
    const sqlVerificar = `
        SELECT * FROM reservas 
        WHERE carrinho_id = ? 
        AND aula_referencia = ? 
        AND segmento = ?
        AND (
            data_reserva = ? -- Cenário A: Mesma data exata ocupada
            OR (tipo_reserva = 'Fixa' AND dia_semana = ? AND data_reserva <= ?) -- Cenário B: Já existe uma Fixa que começou antes ou na mesma data
            OR (? = 'Fixa' AND dia_semana = ? AND data_reserva >= ?) -- Cenário C: A nova é fixa, mas já tem datas futuras preenchidas
        )
    `;

    // Parâmetros que alimentam as interrogações (?) do SQL acima
    const parametrosVerificacao = [
        carrinho_id, 
        aula_referencia, 
        segmento, 
        data_reserva, // Para Cenário A: conflito da mesma data
        dia_semana, data_reserva, // Para Cenário B: compara o dia da semana e garante que a fixa existente é anterior ou igual
        tipo_reserva, dia_semana, data_reserva // Para Cenário C: verifica se a tentativa atual é 'Fixa', compara dia da semana e olha para o futuro
    ];

    db.get(sqlVerificar, parametrosVerificacao, (err, row) => {
        if (err) {
            return res.status(500).json({ erro: "Erro ao verificar disponibilidade." });
        }

        // Se 'row' existir, significa que barrou em alguma das regras (A, B ou C)
        if (row) {
            const tipoOcupacao = row.tipo_reserva === 'Fixa' ? 'Fixa (Semanal)' : 'Avulsa';
            return res.status(400).json({ 
                // Alterado para row.segmento para mostrar exatamente o que está gravado no banco
                erro: `Reserva bloqueada: O ${row.segmento} já possui uma reserva ${tipoOcupacao} neste carrinho e horário.` 
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