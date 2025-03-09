// routes/processos.routes.js

import express from 'express';
import { computeDifferencePercentage, normalizeNumero, normalizeText, removeAccents } from '../public/utils.js';


/**
 * Cria e retorna um router para as rotas de processos.
 * Recebe a instância do banco de dados (db) para uso nas operações.
 */
export function createProcessosRouter(db) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
        console.log("🔎 Buscando processos no MongoDB...");

        const processos = await db.collection("processos").find().toArray();

        if (!processos || processos.length === 0) {
            console.warn("⚠️ Nenhum processo encontrado no banco de dados.");
        } else {
            console.log(`📊 ${processos.length} processos encontrados.`);
        }

        // 🔥 Garantindo a ordem correta dos campos
        const processosFormatados = processos.map(processo => ({
            historico: processo.historico || [],  
            numero: processo.numero || "-",
            status: processo.status || "-",
            ultima_pesquisa: processo.ultima_pesquisa || "-",
            ultima_movimentacao: processo.ultima_movimentacao || "-",
            teor_ultima_movimentacao: processo.teor_ultima_movimentacao || "-",
            ultimo_despacho: processo.ultimo_despacho || "-",
            teor_ultimo_despacho: processo.teor_ultimo_despacho || "-",
            novo_despacho: processo.novo_despacho !== undefined ? processo.novo_despacho : "Não",
            gap: processo.gap || "-",
            resumos: processo.resumos || []
        }));

        console.log("📤 Enviando processos completos para o frontend:", JSON.stringify(processosFormatados, null, 2));

        res.json(processosFormatados);
    } catch (error) {
        console.error("❌ Erro ao buscar processos:", error);
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

  router.post('/atualizar', async (req, res) => {
    console.log("🔵 Requisição recebida em /processos/atualizar");

    try {
        let { processos } = req.body;
        if (!Array.isArray(processos)) {
            processos = [processos];
        }

        for (const p of processos) {
            if (!p.numero) {
                console.error("🔴 ERRO: Número do processo não informado.");
                return res.status(400).json({ error: "Número do processo é obrigatório." });
            }

            // Normaliza os campos
            p.numero = normalizeNumero(p.numero);
            p.ultima_movimentacao = normalizeText(p.ultima_movimentacao);
            p.teor_ultima_movimentacao = normalizeText(p.teor_ultima_movimentacao);
            p.ultimo_despacho = normalizeText(p.ultimo_despacho);
            p.teor_ultimo_despacho = normalizeText(p.teor_ultimo_despacho);
            p.link = normalizeText(p.link);

            // Obtém o processo existente no banco de dados
            const processoExistente = await db.collection('processos').findOne(
              { numero: p.numero },
              { projection: { teor_ultimo_despacho: 1, historico: 1, novo_despacho: 1, gap: 1 } } 
            );
            
            let teorAnterior = "";
            if (processoExistente) {
                if (processoExistente.teor_ultimo_despacho) {
                    teorAnterior = normalizeText(processoExistente.teor_ultimo_despacho);
                } else if (processoExistente.historico && processoExistente.historico.length > 0) {
                    const historicoOrdenado = processoExistente.historico.sort((a, b) => new Date(b.data) - new Date(a.data));
                    teorAnterior = normalizeText(historicoOrdenado[0].teor_ultimo_despacho || "");
                }
            }
            
            console.log(teorAnterior 
                ? `📜 Último despacho encontrado para ${p.numero}: "${teorAnterior}"`
                : `⚠️ Nenhum despacho anterior encontrado no campo principal nem no histórico.`
            );


          // Define o estado anterior do botão "Novo Despacho"
          const estadoAnterior = processoExistente ? (processoExistente.novo_despacho || "Não") : "Não";
          let novoDespachoStatus = estadoAnterior;

          // Se há um novo teor de despacho, calcula a diferença
          const teorNovo = p.teor_ultimo_despacho ? normalizeText(p.teor_ultimo_despacho) : "";
          let diferenca = 0;

          if (teorNovo) {
              diferenca = computeDifferencePercentage(teorAnterior, teorNovo);

              console.log(`🔍 Comparando despachos para ${p.numero}`);
              console.log(`📝 Anterior: "${teorAnterior}"`);
              console.log(`🆕 Novo: "${teorNovo}"`);
              console.log(`📊 Diferença: ${diferenca}%`);

              // Se a diferença for maior que 5% e o estado anterior era "Não", muda para "Sim"
              if (diferenca >= 5 && estadoAnterior === "Não") {
                  novoDespachoStatus = "Sim";
                  console.log(`✅ Diferença >= 5% e estava "Não". Atualizando novo_despacho para "Sim".`);
              } else {
                  console.log(`🔹 Diferença < 5% OU já estava "Sim". Mantendo estado atual.`);
              }
          }


            // Atualiza o status baseado no teor da última movimentação
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


            // Declara historicoItem no escopo correto antes de usar
            let historicoItem = null;
            const historicoModificado = p.ultima_movimentacao || p.teor_ultima_movimentacao || p.ultimo_despacho || p.teor_ultimo_despacho;
            
            if (historicoModificado) {          
                historicoItem = {
                    data: new Date(),
                    ultima_movimentacao: p.ultima_movimentacao || null,
                    teor_ultima_movimentacao: p.teor_ultima_movimentacao || null,
                    ultimo_despacho: p.ultimo_despacho || null,
                    teor_ultimo_despacho: p.teor_ultimo_despacho || null,
                    link: p.link || null
                };
            }

            // Atualiza ou insere o processo no MongoDB
            // Primeiro, atualiza os demais campos do processo
            // Garante que `updateFields` inclua TODOS os campos, preservando valores existentes
            const updateFields = {
              status,
              novo_despacho: novoDespachoStatus,
              gap: p.gap !== undefined ? p.gap : processoExistente?.gap || "",
              resumo: p.resumo || "",
              ultima_movimentacao: p.ultima_movimentacao !== undefined ? p.ultima_movimentacao : processoExistente?.ultima_movimentacao,
              teor_ultima_movimentacao: p.teor_ultima_movimentacao !== undefined ? p.teor_ultima_movimentacao : processoExistente?.teor_ultima_movimentacao,
              ultimo_despacho: p.ultimo_despacho !== undefined ? p.ultimo_despacho : processoExistente?.ultimo_despacho,
              teor_ultimo_despacho: p.teor_ultimo_despacho !== undefined ? p.teor_ultimo_despacho : processoExistente?.teor_ultimo_despacho
            };

            // Atualiza a última pesquisa apenas se for uma requisição manual
            if (p.manual) {
              updateFields.ultima_pesquisa = new Date();
            }

            // Atualiza o banco com todos os campos preservados
            await db.collection('processos').findOneAndUpdate(
              { numero: p.numero },
              { $set: updateFields },
              { upsert: true, returnDocument: 'after' }
            );


            // Agora, se houver histórico novo, adiciona separadamente
            if (historicoItem) {
              await db.collection('processos').updateOne(
                  { numero: p.numero },
                  { $push: { historico: historicoItem } }
              );
            }


            console.log(`✅ Processo ${p.numero} atualizado com novo_despacho = ${novoDespachoStatus}`);
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



//endpoints para armazenar e recuperar resumos
router.get("/:numero/resumos", async (req, res) => {
  try {
    const numero = req.params.numero;
    console.log(`🔍 Buscando resumos para o processo ${numero}`);

    const processo = await db.collection("processos").findOne(
      { numero },
      { projection: { resumos: 1 } }
    );

    if (!processo) {
      console.warn(`⚠️ Processo ${numero} não encontrado no banco de dados.`);
      return res.status(404).json({ error: "Processo não encontrado." });
    }

    // 🔹 Se não houver resumos, retorna um array vazio ao invés de 404
    if (!processo.resumos || processo.resumos.length === 0) {
      console.warn(`⚠️ Processo ${numero} não possui resumos.`);
      return res.status(200).json([]); 
    }

    console.log(`✅ Resumos encontrados para ${numero}:`, processo.resumos);
    res.json(processo.resumos);

  } catch (error) {
    console.error("❌ Erro ao buscar resumos:", error);
    res.status(500).json({ error: "Erro ao buscar resumos." });
  }
});

router.post("/:numero/resumos", async (req, res) => {
  try {
      const numero = req.params.numero;
      const { texto, assistente } = req.body;
      const novoResumo = { texto, assistente, data: new Date() };

      console.log(`📥 Salvando resumo para o processo ${numero}`);

      // Buscar o processo para preservar o status atual
      const processoExistente = await db.collection("processos").findOne({ numero });

      if (!processoExistente) {
          return res.status(404).json({ error: "Processo não encontrado." });
      }

      // 🔥 Agora garantimos que o status e outros campos não sejam perdidos
      await db.collection("processos").updateOne(
          { numero },
          {
              $push: { resumos: novoResumo },
              $set: {
                  status: processoExistente.status, // Mantém o status atual
                  ultima_movimentacao: processoExistente.ultima_movimentacao,
                  teor_ultima_movimentacao: processoExistente.teor_ultima_movimentacao,
                  ultimo_despacho: processoExistente.ultimo_despacho,
                  teor_ultimo_despacho: processoExistente.teor_ultimo_despacho
              }
          },
          { upsert: true }
      );

      res.json({ message: "Resumo salvo com sucesso." });
  } catch (error) {
      console.error("❌ Erro ao salvar resumo:", error);
      res.status(500).json({ error: "Erro ao salvar resumo." });
  }
});


router.post("/excluir-resumos", async (req, res) => {
  console.log("🟢 Recebida solicitação para excluir resumos...");

  try {
    // Extrai a lista de resumos do corpo da requisição
    const { resumos } = req.body;

    // Verifica se a lista de resumos é válida
    if (!resumos || !Array.isArray(resumos)) {
      console.warn("⚠️ Lista de resumos inválida recebida:", resumos);
      return res.status(400).json({ error: "Lista de resumos inválida." });
    }

    console.log(`📌 Total de resumos a excluir: ${resumos.length}`);

    // Percorre cada resumo a ser excluído
    for (const resumo of resumos) {
      console.log(`🔹 Excluindo resumo do processo ${resumo.numero}: "${resumo.texto.substring(0, 50)}..."`);

      // Atualiza o banco de dados para remover o resumo correspondente
      const resultado = await db.collection("processos").updateOne(
        { numero: resumo.numero },
        { $pull: { resumos: { texto: resumo.texto } } }
      );

      // Verifica se alguma modificação foi feita no banco de dados
      if (resultado.modifiedCount > 0) {
        console.log(`✅ Resumo removido com sucesso para o processo ${resumo.numero}`);
      } else {
        console.warn(`⚠️ Nenhuma alteração feita para o processo ${resumo.numero}. Resumo pode não existir.`);
      }
    }

    // Responde com uma mensagem de sucesso
    console.log("✅ Todos os resumos selecionados foram processados para exclusão.");
    res.json({ message: "Resumos excluídos com sucesso." });

  } catch (error) {
    console.error("❌ Erro ao excluir resumos:", error);
    res.status(500).json({ error: "Erro ao excluir resumos." });
  }
});

return router;
}