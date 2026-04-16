# 📅 Sistema de Reserva de Notebooks - PJI310 (UNIVESP)

Este projeto foi desenvolvido para a disciplina de Projeto Integrador III do curso de Ciência de Dados da UNIVESP. O sistema permite a gestão de reservas de carrinhos de notebooks em ambiente escolar, separando as necessidades do Ensino Médio e Fundamental, com controle de acesso para coordenação e administração.

## 🚀 Funcionalidades

* **Painel de Reservas:** Agendamento de notebooks por data, aula e turma.
* **Gestão de Professores:** Cadastro e listagem da equipe docente (Acesso Restrito).
* **Gestão de Carrinhos:** Controle de inventário, status de manutenção (Disponível/Indisponível) e observações técnicas (Acesso Restrito).
* **Regras de Negócio:**
    * Filtro automático: Apenas carrinhos "Disponíveis" aparecem para reserva.
    * Grade Horária: Suporte para as 7 aulas do Ensino Médio com horários específicos.
    * Trava de Segurança: Reservas do tipo "Fixa" exigem senha da coordenação.

## 🔐 Credenciais de Acesso

Para fins de teste e avaliação, as senhas configuradas são:

| Nível de Acesso | Local | Senha |
| :--- | :--- | :--- |
| **Administrador** | Páginas de Professores/Carrinhos | `admin123` |
| **Coordenação** | Confirmar Reserva Fixa | `coord2026` |

## 🛠️ Tecnologias Utilizadas

* **Front-end:** HTML5, CSS3 (Layout Arial/Clean) e JavaScript (Vanilla).
* **Back-end:** Node.js com Express.
* **Banco de Dados:** SQLite (Persistência local em arquivo `.sqlite`).

## 📦 Como Rodar o Projeto

1.  Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.
2.  Clone o repositório ou baixe os arquivos.
3.  Abra o terminal na pasta `backend` e instale as dependências:
    ```bash
    npm install
    ```
4.  Inicie o servidor:
    ```bash
    node app.js
    ```
5.  Abra o arquivo `frontend/index.html` no seu navegador.

## 📊 Estrutura de Dados (Ciência de Dados)

O sistema foi modelado para permitir futuras análises de dados, como:
* Taxa de ocupação por carrinho.
* Frequência de uso por disciplina/professor.
* Relatórios de indisponibilidade por manutenção.

---
**Desenvolvido por:** Igor (Biólogo & Graduando em Ciência de Dados - UNIVESP) 
