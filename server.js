import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Caminho correto para arquivos estáticos (para compatibilidade com ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'public')));

// Servir index.html na rota raiz "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Railway fornece essa variável automaticamente
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(cors());
app.use(express.json());

// Endpoint para salvar processos
app.post('/processos/atualizar', async (req, res) => {
    try {
        const { numero, ultima_movimentacao, teor_ultima_movimentacao, ultimo_despacho, teor_ultimo_despacho } = req.body;

        if (!numero || !ultima_movimentacao || !teor_ultima_movimentacao) {
            return res.status(400).json({ error: "Dados incompletos." });
        }

        // Determinar o status com base no teor da movimentação
        let novoStatus = 'Em trâmite';
        if (teor_ultima_movimentacao.includes("Decurso")) {
            novoStatus = "Decurso";
        } else if (teor_ultima_movimentacao.includes("Trânsito")) {
            novoStatus = "Trânsito";
        }

        // Buscar último despacho salvo
        const result = await pool.query("SELECT teor_ultimo_despacho FROM processos WHERE numero = $1", [numero]);
        let novoDespacho = "Sim"; 

        if (result.rows.length > 0) {
            const despachoAnterior = result.rows[0].teor_ultimo_despacho || "";
            if (despachoAnterior && teor_ultimo_despacho) {
                const similaridade = calcularSimilaridade(despachoAnterior, teor_ultimo_despacho);
                if (similaridade >= 95) {
                    novoDespacho = "Não";
                }
            }
        }

        // Atualizar o processo no banco
        await pool.query(`
            UPDATE processos 
            SET 
                status = $1,
                ultima_pesquisa = NOW(),
                ultima_movimentacao = $2,
                teor_ultima_movimentacao = $3,
                ultimo_despacho = $4,
                teor_ultimo_despacho = $5,
                novo_despacho = $6
            WHERE numero = $7
        `, [novoStatus, ultima_movimentacao, teor_ultima_movimentacao, ultimo_despacho, teor_ultimo_despacho, novoDespacho, numero]);

        res.json({ message: "Processo atualizado com sucesso!", numero, novoDespacho });
    } catch (error) {
        console.error("Erro ao atualizar processo:", error);
        res.status(500).json({ error: "Erro ao atualizar o processo." });
    }
});


function calcularSimilaridade(texto1, texto2) {
    // Algoritmo de similaridade básico (substituir por um melhor se necessário)
    let maxLen = Math.max(texto1.length, texto2.length);
    let sameChars = 0;

    for (let i = 0; i < Math.min(texto1.length, texto2.length); i++) {
        if (texto1[i] === texto2[i]) {
            sameChars++;
        }
    }

    return (sameChars / maxLen) * 100;
}


// Endpoint para obter processos
app.get('/processos/em-tramite', async (req, res) => {
    try {
        const result = await pool.query("SELECT numero FROM processos WHERE status = 'Em trâmite'");
        const numerosDosProcessos = result.rows.map(row => row.numero);
        res.json(numerosDosProcessos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar processos em trâmite.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

app.post('/processos', async (req, res) => {
    try {
        const { processos } = req.body;
        if (!Array.isArray(processos)) {
            return res.status(400).json({ error: "Formato inválido. Envie um array de processos." });
        }

        const values = processos.map(p => `('${p.processNumber}', 'Em trâmite')`).join(',');
        const query = `
            INSERT INTO processos (numero, status) 
            VALUES ${values} RETURNING *;
        `;

        const result = await pool.query(query);
        res.status(201).json(result.rows);
    } catch (error) {
        console.error("Erro ao salvar processos:", error);
        res.status(500).json({ error: "Erro ao salvar processos." });
    }
});


app.get('/processos', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM processos ORDER BY ultima_pesquisa DESC");
        res.json(result.rows);
    } catch (error) {
        console.error("Erro ao buscar processos:", error);
        res.status(500).json({ error: "Erro ao buscar processos." });
    }
});

