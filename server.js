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
    // Substitui quebras de linha por espaço
    let normalized = text.replace(/[\r\n]+/g, " ").trim();
    // Corrige escapes inválidos:
    // Isso substitui uma barra invertida que não é seguida por uma das sequências válidas
    normalized = normalized.replace(/\\(?![\\\/"bfnrt])/g, "\\\\");
    return normalized;
  }  
  
// Função para calcular a distância de Levenshtein entre duas strings
function levenshtein(a, b) {
    const matrix = [];
  
    // Inicializa a primeira coluna
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
  
    // Inicializa a primeira linha
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
  
    // Preenche o restante da matriz
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substituição
            matrix[i][j - 1] + 1,     // inserção
            matrix[i - 1][j] + 1      // deleção
          );
        }
      }
    }
  
    return matrix[b.length][a.length];
  }
  
  // Função que calcula a porcentagem de diferença entre duas strings
  function computeDifferencePercentage(a, b) {
    if (!a || !b) return 100;
    const distance = levenshtein(a, b);
    const maxLength = Math.max(a.length, b.length);
    return (distance / maxLength) * 100;
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
  
      // Se o payload não for um array, transforma em array
      if (!Array.isArray(processos)) {
        processos = [processos];
      }
  
      // Verifica se cada processo tem o número informado
      for (const p of processos) {
        if (!p.numero) {
          console.error("❌ Erro: Número do processo não informado.");
          return res.status(400).json({ error: "Número do processo é obrigatório." });
        }
      }
  
      // Processa cada processo individualmente
      for (const p of processos) {
        // Aplica as funções de normalização
        p.numero = normalizeNumero(p.numero);
        p.ultima_movimentacao = normalizeText(p.ultima_movimentacao);
        p.teor_ultima_movimentacao = normalizeText(p.teor_ultima_movimentacao);
        p.ultimo_despacho = normalizeText(p.ultimo_despacho);
        p.teor_ultimo_despacho = normalizeText(p.teor_ultimo_despacho);
        p.link = normalizeText(p.link);
  
        // Determina o valor de novo_despacho conforme a lógica:
        // Se o payload já veio com novo_despacho, usa-o; senão, calcula com base no histórico
        let novoDespacho;
        if (p.novo_despacho) {
          novoDespacho = p.novo_despacho;
        } else {
          if (p.teor_ultimo_despacho && p.teor_ultimo_despacho.trim() !== "") {
            // Busca o processo existente no banco
            const processoExistente = await db.collection('processos').findOne({ numero: p.numero });
            if (!processoExistente || !processoExistente.historico || processoExistente.historico.length === 0) {
              // Primeira vez: registra "Sim"
              novoDespacho = "Sim";
            } else {
              // Procura o último despacho não vazio
              let lastDespacho = "";
              for (let i = processoExistente.historico.length - 1; i >= 0; i--) {
                if (
                  processoExistente.historico[i].teor_ultimo_despacho &&
                  processoExistente.historico[i].teor_ultimo_despacho.trim() !== ""
                ) {
                  lastDespacho = processoExistente.historico[i].teor_ultimo_despacho;
                  break;
                }
              }
              if (lastDespacho === "") {
                novoDespacho = "Sim";
              } else {
                // Calcula a diferença percentual entre o último despacho e o novo
                const diffPercent = computeDifferencePercentage(lastDespacho, p.teor_ultimo_despacho);
                novoDespacho = diffPercent >= 5 ? "Sim" : "Não";
              }
            }
          } else {
            // Se o novo despacho estiver vazio, marca "Não"
            novoDespacho = "Não";
          }
        }
  
        // Cria o registro do histórico para esse processo
        const historicoItem = {
          data: new Date(),
          ultima_movimentacao: p.ultima_movimentacao || null,
          teor_ultima_movimentacao: p.teor_ultima_movimentacao || null,
          ultimo_despacho: p.ultimo_despacho || null,
          teor_ultimo_despacho: p.teor_ultimo_despacho || null,
          link: p.link || null
        };
  
        // Atualiza (ou insere) o documento no MongoDB
        await db.collection('processos').findOneAndUpdate(
          { numero: p.numero },
          {
            $setOnInsert: { numero: p.numero, status: "Em trâmite" },
            $push: { historico: historicoItem },
            $set: { ultima_pesquisa: new Date(), novo_despacho: novoDespacho }
          },
          { upsert: true }
        );
      }
  
      res.json({ message: "Processos atualizados com sucesso" });
    } catch (error) {
      console.error("❌ Erro ao atualizar processos:", error);
      res.status(500).json({ error: error.message });
    }
  });
  


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

