import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para limpar o campo "numero"
// Se o valor vier com estruturas extras (como [{"numero":"..."}), extrai apenas o número correto.
function normalizeNumero(numero) {
    if (typeof numero !== "string") return numero;
    // Se o número iniciar com '[{' é sinal de que há conteúdo extra
    if (numero.trim().startsWith('[{')) {
      // Tenta extrair com regex o valor entre "numero":" e "
      const match = numero.match(/"numero":"([^"]+)"/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return numero.trim();
  }
  
  // Função para normalizar os textos (movimentações e despachos)
  // Remove quebras de linha e espaços extras, além de normalizar aspas duplicadas
  function normalizeText(text) {
    if (typeof text !== "string") return text;
    // Remove quebras de linha (substitui por espaço) e espaços em branco extras
    let normalized = text.replace(/[\r\n]+/g, " ").trim();
    // Se houver aspas duplicadas, converte para aspas simples (opcional)
    normalized = normalized.replace(/"+/g, '"');
    return normalized;
  }
  

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota para servir o index.html quando acessar "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

app.get('/processos/numeros', async (req, res) => {
    try {
      const processos = await db
        .collection('processos')
        .find({ status: "Em trâmite" }, { projection: { numero: 1, _id: 0 } })
        .toArray();
      res.json(processos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  

// Rota para atualizar ou inserir processos
app.post('/processos/atualizar', async (req, res) => {
    try {
        let { processos } = req.body;

        console.log("🚀 Dados recebidos no Railway:", JSON.stringify(req.body, null, 2)); // <-- Debug

        // Se o usuário enviou um único objeto em vez de um array, transforma em array
        if (!Array.isArray(processos)) {
            processos = [processos];
        }

        for (const p of processos) {
            if (!p.numero) {
                console.error("❌ Erro: Número do processo não informado.");
                return res.status(400).json({ error: "Número do processo é obrigatório." });
            }
        }

        // Aqui aplicamos as funções de normalização para cada processo
        const bulkOps = processos.map(p => {
            // Normaliza os campos usando as funções que você inseriu anteriormente
            p.numero = normalizeNumero(p.numero);
            p.ultima_movimentacao = normalizeText(p.ultima_movimentacao);
            p.teor_ultima_movimentacao = normalizeText(p.teor_ultima_movimentacao);
            p.ultimo_despacho = normalizeText(p.ultimo_despacho);
            p.teor_ultimo_despacho = normalizeText(p.teor_ultimo_despacho);
            p.link = normalizeText(p.link);

            // Cria o registro para o histórico
            const historicoItem = {
                data: new Date(),
                ultima_movimentacao: p.ultima_movimentacao || null,
                teor_ultima_movimentacao: p.teor_ultima_movimentacao || null,
                ultimo_despacho: p.ultimo_despacho || null,
                teor_ultimo_despacho: p.teor_ultimo_despacho || null,
                link: p.link || null
            };

            return {
                updateOne: {
                    filter: { numero: p.numero },
                    update: {
                        $setOnInsert: { numero: p.numero, status: "Em trâmite" },
                        $push: { historico: historicoItem },
                        $set: { ultima_pesquisa: new Date(), novo_despacho: p.novo_despacho || null }
                    },
                    upsert: true
                }
            };
        });

        await db.collection('processos').bulkWrite(bulkOps);
        res.json({ message: "Processos atualizados com sucesso" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Dentro do endpoint que atualiza processos
const bulkOps = processos.map(p => {
    const historicoItem = {
        data: new Date(),
        ultima_movimentacao: p.ultima_movimentacao || null,
        teor_ultima_movimentacao: p.teor_ultima_movimentacao || null,
        ultimo_despacho: p.ultimo_despacho || null,
        teor_ultimo_despacho: p.teor_ultimo_despacho || null,
        link: p.link || null
    };

    return {
        updateOne: {
            filter: { numero: p.numero },
            update: {
                $setOnInsert: { numero: p.numero, status: "Em trâmite" },
                $push: { historico: historicoItem },
                $set: { ultima_pesquisa: new Date(), novo_despacho: p.novo_despacho || null }
            },
            upsert: true
        }
    };
});


        

        await db.collection('processos').bulkWrite(bulkOps);

        res.json({ message: "Processos atualizados com sucesso!", processos });
    } catch (error) {
        console.error("❌ Erro ao atualizar processos:", error);
        res.status(500).json({ error: "Erro ao atualizar os processos." });
    }
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

