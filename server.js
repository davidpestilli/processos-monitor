import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017";
const dbName = "processos_db"; // Nome do banco no MongoDB
let db;

// Conectar ao MongoDB
MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log("✅ Conectado ao MongoDB");
        db = client.db(dbName);
    })
    .catch(error => console.error("❌ Erro ao conectar ao MongoDB:", error));

// Rota para buscar todos os processos
app.get('/processos', async (req, res) => {
    try {
        const processos = await db.collection('processos').find({}).toArray();
        res.json(processos);
    } catch (error) {
        console.error("Erro ao buscar processos:", error);
        res.status(500).json({ error: "Erro ao buscar processos." });
    }
});

// Rota para atualizar ou inserir processos
app.post('/processos/atualizar', async (req, res) => {
    try {
        let { processos } = req.body;

        if (!Array.isArray(processos)) {
            processos = [processos];
        }

        for (const p of processos) {
            if (!p.numero || !p.ultima_movimentacao || !p.teor_ultima_movimentacao) {
                return res.status(400).json({ error: "Dados incompletos." });
            }
        }

        const bulkOps = processos.map(p => ({
            updateOne: {
                filter: { numero: p.numero },
                update: {
                    $set: {
                        ultima_movimentacao: p.ultima_movimentacao,
                        teor_ultima_movimentacao: p.teor_ultima_movimentacao,
                        ultimo_despacho: p.ultimo_despacho,
                        teor_ultimo_despacho: p.teor_ultimo_despacho,
                        novo_despacho: "Sim",
                        ultima_pesquisa: new Date()
                    }
                },
                upsert: true
            }
        }));

        await db.collection('processos').bulkWrite(bulkOps);
        res.json({ message: "Processos atualizados com sucesso!", processos });
    } catch (error) {
        console.error("Erro ao atualizar processos:", error);
        res.status(500).json({ error: "Erro ao atualizar os processos." });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

