// routes/processos.routes.js

import express from 'express';
import { normalizeNumero, normalizeText, removeAccents } from '../public/utils.js';

/**
 * Cria e retorna um router para as rotas de processos.
 * Recebe a instância do banco de dados (db) para uso nas operações.
 */
export function createProcessosRouter(db) {
  const router = express.Router();

  // GET /processos - Retorna todos os processos
  router.get('/', async (req, res) => {
    try {
      const processos = await db.collection('processos').find().toArray();
      res.json(processos);
    } catch (error) {
      console.error("Erro ao buscar processos:", error);
      res.status(500).json({ error: "Erro ao buscar processos." });
    }
  });

  // GET /processos/numeros - Retorna os números dos processos com status "Em trâmite"
  router.get('/numeros', async (req, res) => {
    try {
      const processos = await db
        .collection('processos')
        .find({ status: "Em trâmite" }, { projection: { numero: 1, _id: 0 } })
        .toArray();
      res.json(processos);
    } catch (error) {
      console.error("Erro ao buscar processos:", error);
      res.status(500).json({ error: "Erro ao buscar processos." });
    }
  });


// POST /processos/atualizar - Atualiza ou insere processos
router.post('/atualizar', async (req, res) => {
  console.log("Requisição em /processos/atualizar");
  try {
    let { processos } = req.body;
    if (!Array.isArray(processos)) {
      processos = [processos];
    }
    for (const p of processos) {
      if (!p.numero) {
        console.error("Número do processo não informado.");
        return res.status(400).json({ error: "Número do processo é obrigatório." });
      }

      // Normaliza os campos
      p.numero = normalizeNumero(p.numero);
      p.ultima_movimentacao = normalizeText(p.ultima_movimentacao);
      p.teor_ultima_movimentacao = normalizeText(p.teor_ultima_movimentacao);
      p.ultimo_despacho = normalizeText(p.ultimo_despacho);
      p.teor_ultimo_despacho = normalizeText(p.teor_ultimo_despacho);
      p.link = normalizeText(p.link);

      // Determina o status com base no teor da última movimentação
      let status = "Em trâmite";
      if (p.teor_ultima_movimentacao) {
        const teorMov = removeAccents(p.teor_ultima_movimentacao.toLowerCase());
        if (teorMov.includes("decurso")) {
          status = "Decurso";
        } else if (teorMov.includes("baixa")) {
          status = "Baixa";
        } else if (teorMov.includes("transito")) {
          status = "Trânsito";
        } else if (teorMov.includes("origem")) {
          status = "Origem";
        }
      }

      // Cria um item para o histórico
      const historicoItem = {
        data: new Date(),
        ultima_movimentacao: p.ultima_movimentacao || null,
        teor_ultima_movimentacao: p.teor_ultima_movimentacao || null,
        ultimo_despacho: p.ultimo_despacho || null,
        teor_ultimo_despacho: p.teor_ultimo_despacho || null,
        link: p.link || null
      };

      // Atualiza ou insere o processo no MongoDB
      await db.collection('processos').findOneAndUpdate(
        { numero: p.numero },
        {
          $set: { status, ultima_pesquisa: new Date(), novo_despacho: p.novo_despacho },
          $push: { historico: historicoItem },
          $setOnInsert: { numero: p.numero }
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
    res.json({ message: "Processos atualizados com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar processos:", error);
    res.status(500).json({ error: error.message });
  }
});



  // POST /processos/excluir-multiplos - Exclui vários processos
  router.post("/excluir-multiplos", async (req, res) => {
    try {
      const { numeros } = req.body;
      if (!numeros || !Array.isArray(numeros)) {
        return res.status(400).json({ error: "Lista de números inválida." });
      }
      const result = await db.collection("processos").deleteMany({ numero: { $in: numeros } });
      res.json({ message: "Processos excluídos com sucesso.", deletados: result.deletedCount });
    } catch (error) {
      console.error("Erro ao excluir múltiplos processos:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /processos/excluir-historico-multiplos - Exclui entradas do histórico
  router.post("/excluir-historico-multiplos", async (req, res) => {
    try {
      const { entradas } = req.body;
      if (!entradas || !Array.isArray(entradas)) {
        return res.status(400).json({ error: "Lista de entradas inválida." });
      }
      const result = await Promise.all(
        entradas.map(async ({ numero, data }) => {
          return db.collection("processos").updateOne(
            { numero },
            { $pull: { historico: { data: new Date(data) } } }
          );
        })
      );
      res.json({ message: "Entradas do histórico excluídas com sucesso.", modificadas: result.length });
    } catch (error) {
      console.error("Erro ao excluir múltiplas entradas do histórico:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
