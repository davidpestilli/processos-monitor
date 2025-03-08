// app.js
import { fetchProcessos, updateNovoDespacho, salvarProcesso, excluirProcessos, excluirHistorico, uploadCSV } from "./api.js";
import { createProcessRow, openModalHistorico, openModalTexto, closeModal } from "./dom.js";

const API_URL = "https://processos-monitor-production.up.railway.app/processos";


// Seleciona elementos do DOM
const tabelaBody = document.querySelector("#tabelaProcessos tbody");
const formProcesso = document.querySelector("#formProcesso");
const inputNumeroProcesso = document.querySelector("#numeroProcesso");
const btnExcluirSelecionados = document.getElementById("btnExcluirSelecionados");
const inputCSV = document.querySelector("#inputCSV");

function atualizarBotaoNovoDespacho(botao, processo) {
    if (processo.novo_despacho === "Sim") {
        botao.textContent = "✔ Sim";
        botao.className = "btn-sim";
    } else {
        botao.textContent = "❌ Não";
        botao.className = "btn-nao";
    }
}

async function alternarNovoDespacho(processo, botao) {
    try {
        // Alterna o estado entre "Sim" e "Não" ao clique
        const novoValor = (processo.novo_despacho === "Sim") ? "Não" : "Sim";

        console.log(`🔄 Alternando despacho do processo ${processo.numero} para ${novoValor} manualmente...`);

        // Atualiza apenas a interface (sem lógica adicional)
        processo.novo_despacho = novoValor;
        atualizarBotaoNovoDespacho(botao, processo);

    } catch (error) {
        console.error("❌ Erro ao alternar despacho:", error.message);
        alert(`Erro ao alternar despacho: ${error.message}`);
    }
}



// Renderiza os processos na tabela
async function renderProcessos() {
    try {
        const processos = await fetchProcessos();
        tabelaBody.innerHTML = "";

        processos.forEach(processo => {
            console.log(`🔄 Renderizando processo ${processo.numero} com novo_despacho = ${processo.novo_despacho}`);

            const { row, numeroLink, btnNovoDespacho } = createProcessRow(processo);

            // Adiciona evento para abrir o modal de histórico
            numeroLink.addEventListener("click", (e) => {
                e.preventDefault();
                openModalHistorico(processo);
            });

            // Atualiza o botão conforme o backend
            atualizarBotaoNovoDespacho(btnNovoDespacho, processo);

            // Evento para alternar "Sim"/"Não" manualmente ao clique
            btnNovoDespacho.addEventListener("click", async () => {
                alternarNovoDespacho(processo, btnNovoDespacho);
            });

            tabelaBody.appendChild(row);
        });

    } catch (error) {
        console.error("❌ Erro ao renderizar processos:", error);
    }
}

const mensagemFeedback = document.getElementById("mensagemFeedback");

function exibirMensagem(mensagem, tipo) {
    mensagemFeedback.textContent = mensagem;
    mensagemFeedback.className = tipo === "sucesso" ? "sucesso" : "erro";
    mensagemFeedback.style.display = "block";

    setTimeout(() => {
        mensagemFeedback.style.display = "none";
    }, 3000);
}

//lógica do modal GAP
function abrirModalGAP(processo) {
  console.log(`🟢 Abrindo modal GAP para o processo: ${processo.numero}`);

  const modal = document.getElementById("modalGAP");
  const inputAssistente = document.getElementById("inputNomeAssistente");
  const btnIncluir = document.getElementById("btnIncluirAssistente");
  const mensagem = document.getElementById("mensagemGAP");

  // Resetando o campo de entrada e mensagem ao abrir o modal
  inputAssistente.value = "";
  mensagem.textContent = "";

  modal.style.display = "block";

  btnIncluir.onclick = async () => {
    const nomeAssistente = inputAssistente.value.trim();
    
    if (!nomeAssistente) {
        console.warn("⚠️ Nenhum nome foi digitado para o assistente.");
        mensagem.textContent = "Por favor, insira um nome.";
        return;
    }

    console.log(`📨 Enviando solicitação para atualizar o assistente do processo ${processo.numero} para "${nomeAssistente}"...`);

    try {
        const response = await fetch(`${API_URL}/atualizar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                processos: [{ numero: processo.numero, gap: nomeAssistente }]
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na resposta do servidor: ${response.status}`);
        }

        console.log(`✅ Assistente "${nomeAssistente}" incluído com sucesso no processo ${processo.numero}.`);

        mensagem.textContent = `O assistente ${nomeAssistente} foi incluído.`;
        processo.gap = nomeAssistente;

        // 🔹 Busca a célula correta na tabela usando dataset
        const gapCell = document.querySelector(`td.gap-cell[data-numero="${processo.numero}"]`);

        if (gapCell) {
            gapCell.textContent = nomeAssistente;
            console.log(`🖊️ Atualização bem-sucedida: assistente visível na tabela → "${nomeAssistente}".`);
        } else {
            console.warn(`⚠️ ERRO: A célula GAP do processo ${processo.numero} não foi encontrada na tabela.`);
            console.log("📌 Verifique se o número do processo no dataset corresponde ao número do processo salvo.");
        }

        setTimeout(() => {
            console.log("🔒 Fechando modal GAP...");
            modal.style.display = "none";
        }, 1000);

    } catch (error) {
        console.error(`❌ Erro ao salvar o assistente para o processo ${processo.numero}:`, error);
        mensagem.textContent = "Erro ao salvar assistente.";
    }
};

}

// 🔽 Torna a função global para `dom.js` poder chamá-la 🔽
window.abrirModalGAP = abrirModalGAP;

// Fecha o modal ao clicar no "X"
document.getElementById("fecharModalGAP").addEventListener("click", () => {
  console.log("🔴 Fechando modal GAP manualmente.");
  document.getElementById("modalGAP").style.display = "none";
});

// Fecha o modal ao clicar fora dele
window.addEventListener("click", (event) => {
  const modal = document.getElementById("modalGAP");
  if (event.target === modal) {
      console.log("🔴 Fechando modal GAP ao clicar fora.");
      modal.style.display = "none";
  }
});



// Configura o evento do formulário para adicionar um novo processo
if (formProcesso) {
  formProcesso.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (!inputNumeroProcesso.value.trim()) {
      exibirMensagem("Por favor, insira um número de processo válido.", "erro");
      return;
    }

    const numeroProcesso = inputNumeroProcesso.value.trim();
    
    try {
      await salvarProcesso({ numero: numeroProcesso, manual: true });
      exibirMensagem("Processo adicionado com sucesso!", "sucesso");
      renderProcessos();
      inputNumeroProcesso.value = "";
    } catch (error) {
      console.error("Erro ao adicionar processo:", error);
      exibirMensagem("Erro ao adicionar o processo.", "erro");
    }
  });
}


// Configura o evento do formulário para adicionar um novo processo
if (formProcesso) {
  formProcesso.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!inputNumeroProcesso.value.trim()) {
      alert("Por favor, insira um número de processo válido.");
      return;
    }
    const numeroProcesso = inputNumeroProcesso.value.trim();
    try {
      await salvarProcesso({ numero: numeroProcesso, manual: true });
      alert("Processo adicionado com sucesso!");
      renderProcessos();
      inputNumeroProcesso.value = "";
    } catch (error) {
      console.error("Erro ao adicionar processo:", error);
      alert("Erro ao adicionar o processo. Verifique o console.");
    }
  });
}

// Configura o evento para exclusão múltipla de processos
if (btnExcluirSelecionados) {
  btnExcluirSelecionados.addEventListener("click", async () => {
    const checkboxes = document.querySelectorAll(".processo-checkbox:checked");
    if (checkboxes.length === 0) {
      alert("Nenhum processo selecionado.");
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir ${checkboxes.length} processos selecionados?`)) {
      return;
    }
    const numerosParaExcluir = Array.from(checkboxes).map(cb => cb.dataset.numero);
    try {
      await excluirProcessos(numerosParaExcluir);
      alert("Processos excluídos com sucesso!");
      renderProcessos();
    } catch (error) {
      console.error("Erro ao excluir processos:", error);
      alert("Erro ao excluir processos.");
    }
  });
}

// Configura o processamento do CSV
window.processarCSV = function processarCSV() {
    if (!inputCSV.files.length) {
        alert("Por favor, selecione um arquivo CSV.");
        return;
    }
    
    const arquivo = inputCSV.files[0];
    const leitor = new FileReader();
    
    leitor.onload = async (event) => {
        const conteudo = event.target.result;
        const linhas = conteudo.split("\n").map(linha => linha.trim()).filter(linha => linha);
        const processos = linhas.flatMap(linha =>
            linha.split(";").map(numero => ({
                numero: numero.trim().replace(/,$/, ''),
                manual: true
            }))
        );

        if (processos.length === 0) {
            alert("O arquivo CSV está vazio ou mal formatado.");
            return;
        }

        try {
            await uploadCSV(processos);
            alert("Processos enviados com sucesso!");
            renderProcessos();
        } catch (error) {
            console.error("Erro ao enviar o CSV:", error);
            alert("Erro ao enviar o arquivo CSV.");
        }
    };

    leitor.readAsText(arquivo);
};


// Eventos para fechar modais
document.getElementById("fecharModalGenerico").addEventListener("click", () => {
  closeModal("modalGenerico");
});
document.getElementById("fecharDespacho").addEventListener("click", () => {
  closeModal("modalDespacho");
});
document.getElementById("fecharHistorico").addEventListener("click", () => {
  closeModal("modalHistorico");
});

// Seleção de todos os processos
document.getElementById("selecionarTodosProcessos").addEventListener("change", function () {
  const checkboxes = document.querySelectorAll(".processo-checkbox");
  checkboxes.forEach(cb => cb.checked = this.checked);
});

// Inicializa a aplicação
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM carregado. Iniciando aplicação...");
  renderProcessos();
});

// Garante que todas as modais com a classe "modal" comecem fechadas ao carregar a página
document.querySelectorAll(".modal").forEach(modal => {
    modal.style.display = "none";
});

// Função para fechar o modal ao clicar fora dele
document.addEventListener("click", (event) => {
    const modais = document.querySelectorAll(".modal"); // Seleciona todas as modais
    modais.forEach(modal => {
        if (event.target === modal) { // Se o clique foi fora do conteúdo da modal
            modal.style.display = "none";
        }
    });
});


const btnEnviarCSV = document.getElementById("btnEnviarCSV");
if (btnEnviarCSV) {
    btnEnviarCSV.addEventListener("click", processarCSV);
}


// Event listener para o botão "Excluir Selecionados" no modal de histórico
const btnExcluirHistorico = document.getElementById("btnExcluirHistoricoSelecionado");
if (btnExcluirHistorico) {
  btnExcluirHistorico.addEventListener("click", async () => {
    const historicoCheckboxes = document.querySelectorAll(".historico-checkbox:checked");
    if (historicoCheckboxes.length === 0) {
      alert("Nenhuma entrada do histórico selecionada.");
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir ${historicoCheckboxes.length} entradas do histórico selecionadas?`)) {
      return;
    }
    // Cria o array de entradas com número e data
    const entradasParaExcluir = Array.from(historicoCheckboxes).map(cb => ({
      numero: cb.dataset.numero,
      data: cb.dataset.data
    }));
    try {
      await excluirHistorico(entradasParaExcluir);
      alert("Entradas do histórico excluídas com sucesso!");
      // Re-renderiza o modal com o processo atual, se disponível
      if (window.currentHistoricoProcesso) {
        openModalHistorico(window.currentHistoricoProcesso);
      }
    } catch (error) {
      console.error("Erro ao excluir entradas do histórico:", error);
      alert("Erro ao excluir entradas do histórico.");
    }
  });
}
