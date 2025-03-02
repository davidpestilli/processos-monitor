const API_URL = "https://processos-monitor-production.up.railway.app/processos";

// Função para carregar os processos do backend
function carregarProcessosDoBackend() {
    fetch(API_URL)
      .then(response => response.json())
      .then(processos => {
        const tabelaBody = document.querySelector("#tabelaProcessos tbody");
        tabelaBody.innerHTML = "";
  
        processos.forEach(processo => {
          // Usa o último registro do histórico para dados atuais
          const ultimoHistorico =
            processo.historico && processo.historico.length
              ? processo.historico[processo.historico.length - 1]
              : {};
  
          const row = document.createElement("tr");
  
          // Cria a célula do número do processo com data-attribute
          const numeroCell = document.createElement("td");
          const numeroLink = document.createElement("a");
          numeroLink.href = "#";
          numeroLink.textContent = processo.numero;
          // Armazena o objeto processo como string JSON para usar no modal
          numeroLink.dataset.processo = JSON.stringify(processo);
          numeroLink.classList.add("numeroLink");
          numeroCell.appendChild(numeroLink);
          row.appendChild(numeroCell);
  
          // Outras células
          const statusCell = document.createElement("td");
          statusCell.textContent = processo.status || "N/A";
          row.appendChild(statusCell);
  
          const pesquisaCell = document.createElement("td");
          pesquisaCell.textContent = processo.ultima_pesquisa
            ? new Date(processo.ultima_pesquisa).toLocaleDateString()
            : "N/A";
          row.appendChild(pesquisaCell);
  
          const movCell = document.createElement("td");
          movCell.textContent = ultimoHistorico.ultima_movimentacao || "N/A";
          row.appendChild(movCell);
  
          const teorMovCell = document.createElement("td");
          teorMovCell.classList.add("fixed");
          teorMovCell.textContent = ultimoHistorico.teor_ultima_movimentacao || "N/A";
          row.appendChild(teorMovCell);
  
          const despachoCell = document.createElement("td");
          despachoCell.textContent = ultimoHistorico.ultimo_despacho || "N/A";
          row.appendChild(despachoCell);
  
          const teorDespachoCell = document.createElement("td");
          teorDespachoCell.classList.add("fixed");
          const despachoLink = document.createElement("a");
          despachoLink.href = "#";
          despachoLink.textContent = ultimoHistorico.teor_ultimo_despacho || "N/A";
          // Armazena o objeto do histórico para uso no modal
          despachoLink.dataset.historico = JSON.stringify(ultimoHistorico);
          despachoLink.classList.add("despachoLink");
          teorDespachoCell.appendChild(despachoLink);
          row.appendChild(teorDespachoCell);
  
          // Célula com botão para alternar "Novo Despacho"
          const novoDespachoCell = document.createElement("td");
          const btn = document.createElement("button");
          btn.textContent = processo.novo_despacho === "Sim" ? "✔ Sim" : "❌ Não";
          btn.className = processo.novo_despacho === "Sim" ? "btn-sim" : "btn-nao";
          btn.addEventListener("click", function () {
            alternarNovoDespacho(processo.numero, btn);
          });
          novoDespachoCell.appendChild(btn);
          row.appendChild(novoDespachoCell);
  
          tabelaBody.appendChild(row);
        });
  
        // Adiciona event listeners para os links criados
        document.querySelectorAll(".numeroLink").forEach(link => {
          link.addEventListener("click", function (e) {
            e.preventDefault();
            const processo = JSON.parse(this.dataset.processo);
            abrirModalHistorico(processo);
          });
        });
  
        document.querySelectorAll(".despachoLink").forEach(link => {
          link.addEventListener("click", function (e) {
            e.preventDefault();
            const historico = JSON.parse(this.dataset.historico);
            abrirModalDespacho(historico);
          });
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
  