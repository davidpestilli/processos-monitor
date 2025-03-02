import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;

dotenv.config();
console.log("DATABASE_URL carregado:", process.env.DATABASE_URL);

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
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("railway.app") ? { rejectUnauthorized: false } : false
});


// Testar conexão ao iniciar
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error("Erro ao conectar ao PostgreSQL:", err);
    } else {
        console.log("Conexão bem-sucedida com PostgreSQL:", res.rows);
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

        let novoStatus = 'Em trâmite';
        if (teor_ultima_movimentacao.includes("Decurso")) {
            novoStatus = "Decurso";
        } else if (teor_ultima_movimentacao.includes("Trânsito")) {
            novoStatus = "Trânsito";
        }

        const result = await pool.query(`
            INSERT INTO processos (numero, status, ultima_pesquisa, ultima_movimentacao, teor_ultima_movimentacao, ultimo_despacho, teor_ultimo_despacho, novo_despacho)
            VALUES ($1, $2, NOW(), $3, $4, $5, $6, 'Sim')
            ON CONFLICT (numero) DO UPDATE 
            SET 
                status = $2,
                ultima_pesquisa = NOW(),
                ultima_movimentacao = $3,
                teor_ultima_movimentacao = $4,
                ultimo_despacho = $5,
                teor_ultimo_despacho = $6,
                novo_despacho = 'Sim'
            RETURNING *;
        `, [numero, novoStatus, ultima_movimentacao, teor_ultima_movimentacao, ultimo_despacho, teor_ultimo_despacho]);

        res.json({ message: "Processo atualizado com sucesso!", numero, novoDespacho: "Sim" });
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


