const API_URL = "https://processos-monitor-production.up.railway.app/processos";

// Função para carregar os processos do backend
function carregarProcessosDoBackend() {
    fetch(API_URL)
      .then(response => response.json())
      .then(processos => {
        const tabelaBody = document.querySelector("#tabelaProcessos tbody");
        tabelaBody.innerHTML = "";
  
        processos.forEach(processo => {
          // Se houver histórico, use o último item (assumindo ordem cronológica)
          const ultimoHistorico =
            processo.historico && processo.historico.length
              ? processo.historico[processo.historico.length - 1]
              : {};
  
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>
              <a href="#" onclick='abrirModalHistorico(${JSON.stringify(
                processo
              )})'>
                ${processo.numero}
              </a>
            </td>
            <td>${processo.status || "N/A"}</td>
            <td>${
              processo.ultima_pesquisa
                ? new Date(processo.ultima_pesquisa).toLocaleDateString()
                : "N/A"
            }</td>
            <td>${ultimoHistorico.ultima_movimentacao || "N/A"}</td>
            <td class="fixed">${ultimoHistorico.teor_ultima_movimentacao || "N/A"}</td>
            <td>${ultimoHistorico.ultimo_despacho || "N/A"}</td>
            <td class="fixed">
              <a href="#" onclick='abrirModalDespacho(${JSON.stringify(
                ultimoHistorico
              )})'>
                ${ultimoHistorico.teor_ultimo_despacho || "N/A"}
              </a>
            </td>
            <td>
              ${
                processo.novo_despacho === "Sim"
                  ? `<button class="btn-sim" onclick="alternarNovoDespacho('${processo.numero}', this)">✔ Sim</button>`
                  : `<button class="btn-nao" onclick="alternarNovoDespacho('${processo.numero}', this)">❌ Não</button>`
              }
            </td>
          `;
          tabelaBody.appendChild(row);
        });
      })
      .catch(error => {
        console.error("Erro ao buscar processos:", error);
      });
  }
  


// Função para alternar o campo "Novo Despacho"
async function alternarNovoDespacho(numero, botao) {
    try {
        const novoValor = botao.textContent.includes("Sim") ? "Não" : "Sim";
        const response = await fetch(`${API_URL}/atualizar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                processos: [{ numero, novo_despacho: novoValor }]
            })
        });

        if (!response.ok) throw new Error("Erro ao atualizar despacho.");
        
        botao.textContent = novoValor === "Sim" ? "✔ Sim" : "❌ Não";
        botao.className = novoValor === "Sim" ? "btn-sim" : "btn-nao";
    } catch (error) {
        console.error("Erro ao atualizar despacho:", error);
    }
}

// Função para enviar um novo processo ao backend
async function salvarProcessoNoBackend(processo) {
    try {
        const response = await fetch(API_URL + "/atualizar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ processos: [processo] })
        });

        if (!response.ok) throw new Error("Erro ao enviar processo.");

        console.log("✅ Processo enviado com sucesso!");
        carregarProcessosDoBackend(); // Atualiza a tabela após o envio
    } catch (error) {
        console.error("Erro ao enviar processo:", error);
    }
}

// Adicionar evento para capturar submissão de novo processo
document.addEventListener("DOMContentLoaded", function () {
    const formProcesso = document.querySelector("#formProcesso");

    if (formProcesso) {
        formProcesso.addEventListener("submit", async function (event) {
            event.preventDefault(); // Evita que a página recarregue

            const inputNumeroProcesso = document.querySelector("#numeroProcesso");

            if (!inputNumeroProcesso || !inputNumeroProcesso.value.trim()) {
                alert("Por favor, insira um número de processo válido.");
                return;
            }

            const numeroProcesso = inputNumeroProcesso.value.trim();

            try {
                const response = await fetch("https://processos-monitor-production.up.railway.app/processos/atualizar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        processos: [{ numero: numeroProcesso }],
                    }),
                });

                if (!response.ok) {
                    throw new Error("Erro ao adicionar o processo.");
                }

                alert("Processo adicionado com sucesso!");

                // Recarregar a lista de processos após adicionar um novo
                carregarProcessosDoBackend();

                // Limpar o campo de entrada
                inputNumeroProcesso.value = "";
            } catch (error) {
                console.error("Erro ao adicionar o processo:", error);
                alert("Erro ao adicionar o processo. Verifique o console para mais detalhes.");
            }
        });
    }
});

function processarCSV() {
    const inputCSV = document.querySelector("#inputCSV");

    if (!inputCSV.files.length) {
        alert("Por favor, selecione um arquivo CSV.");
        return;
    }

    const arquivo = inputCSV.files[0];
    const leitor = new FileReader();

    leitor.onload = async function (event) {
        const conteudo = event.target.result;
        const linhas = conteudo
            .split("\n") // Quebra o CSV por linha
            .map(linha => linha.trim()) // Remove espaços em branco
            .filter(linha => linha); // Remove linhas vazias

        // 🔹 Garante que cada número de processo seja um objeto separado
        const processos = linhas.flatMap(linha => 
            linha.split(";").map(numero => ({ numero: numero.trim() }))
        );

        if (processos.length === 0) {
            alert("O arquivo CSV está vazio ou mal formatado.");
            return;
        }

        try {
            const response = await fetch("https://processos-monitor-production.up.railway.app/processos/atualizar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ processos }), // Agora os processos são enviados corretamente
            });

            if (!response.ok) {
                throw new Error("Erro ao enviar os processos.");
            }

            alert("Processos enviados com sucesso!");
            carregarProcessosDoBackend(); // Atualiza a tabela após o envio
        } catch (error) {
            console.error("Erro ao enviar o CSV:", error);
            alert("Erro ao enviar o arquivo CSV.");
        }
    };

    leitor.readAsText(arquivo);
}



// Carregar os processos ao iniciar
document.addEventListener("DOMContentLoaded", carregarProcessosDoBackend);

window.processarCSV = processarCSV;

// Modal para exibir o teor completo do despacho (último registro)
function abrirModalDespacho(item) {
    document.getElementById("modalTextoDespacho").textContent =
      item.teor_ultimo_despacho || "N/A";
    const linkEl = document.getElementById("modalLinkDespacho");
    if (item.link) {
      linkEl.href = item.link;
      linkEl.style.display = "block";
    } else {
      linkEl.style.display = "none";
    }
    document.getElementById("modalDespacho").style.display = "block";
  }
  
  function fecharModalDespacho() {
    document.getElementById("modalDespacho").style.display = "none";
  }
  
  // Modal para exibir o histórico completo do processo
  function abrirModalHistorico(processo) {
    const modalConteudo = document.getElementById("modalConteudoHistorico");
    modalConteudo.innerHTML = "";
    if (processo.historico && processo.historico.length > 0) {
      processo.historico.forEach(item => {
        const divItem = document.createElement("div");
        divItem.style.borderBottom = "1px solid #ccc";
        divItem.style.marginBottom = "10px";
        divItem.innerHTML = `
          <p><strong>Data:</strong> ${new Date(item.data).toLocaleDateString()}</p>
          <p><strong>Última Movimentação:</strong> ${item.ultima_movimentacao || "N/A"}</p>
          <p><strong>Teor Movimentação:</strong> ${item.teor_ultima_movimentacao || "N/A"}</p>
          <p><strong>Último Despacho:</strong> ${item.ultimo_despacho || "N/A"}</p>
          <p><strong>Teor Despacho:</strong> ${item.teor_ultimo_despacho || "N/A"}</p>
          ${
            item.link
              ? `<p><a href="${item.link}" target="_blank">Ver despacho no STF</a></p>`
              : ""
          }
        `;
        modalConteudo.appendChild(divItem);
      });
    } else {
      modalConteudo.innerHTML = "<p>Nenhum histórico encontrado.</p>";
    }
    document.getElementById("modalHistorico").style.display = "block";
  }
  
  function fecharModalHistorico() {
    document.getElementById("modalHistorico").style.display = "none";
  }
  