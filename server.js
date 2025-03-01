import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

const { Pool } = pkg;

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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
app.post('/processos', async (req, res) => {
    try {
        const { processos } = req.body; // Espera um array de objetos { processNumber }
        if (!Array.isArray(processos)) {
            return res.status(400).json({ error: 'Formato inválido. Envie um array de processos.' });
        }

        const values = processos.map(p => `('${p.processNumber}', 'Em trâmite', NOW())`).join(',');
        const query = `INSERT INTO processos (numero, status, criado_em) VALUES ${values} RETURNING *;`;

        const result = await pool.query(query);
        res.status(201).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao salvar processos.' });
    }
});

// Endpoint para obter processos
app.get('/processos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM processos ORDER BY criado_em DESC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar processos.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
