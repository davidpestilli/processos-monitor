const API_URL = "https://processos-monitor-production.up.railway.app/processos";

  function formatDate(date) {
    if (!date) return "N/A";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  }

// Função para carregar os processos do backend
function carregarProcessosDoBackend() {
    const cacheBuster = new Date().getTime(); // Garante que o navegador sempre carregue dados novos

    fetch(`${API_URL}?_=${cacheBuster}`, { cache: "no-store" }) // Evita cache
      .then(response => response.json())
      .then(processos => {
        console.log("✅ Processos recebidos do backend:", processos); // <-- Novo log
        const tabelaBody = document.querySelector("#tabelaProcessos tbody");
        tabelaBody.innerHTML = ""; // Limpa a tabela antes de atualizar

        processos.forEach(processo => {
            const ultimoHistorico =
                processo.historico && processo.historico.length
                ? processo.historico[processo.historico.length - 1]
                : {};
    
            const row = document.createElement("tr");

            const numeroCell = document.createElement("td");
            const numeroLink = document.createElement("a");
            numeroLink.href = "#";
            numeroLink.textContent = processo.numero;
            numeroLink.dataset.processo = JSON.stringify(processo);
            numeroLink.classList.add("numeroLink");
            numeroCell.appendChild(numeroLink);

            const statusCell = document.createElement("td");
            statusCell.textContent = processo.status || "N/A";

            const pesquisaCell = document.createElement("td");
            pesquisaCell.textContent = processo.ultima_pesquisa ? formatDate(processo.ultima_pesquisa) : "N/A";

            const movCell = document.createElement("td");
            movCell.textContent = ultimoHistorico.ultima_movimentacao || "N/A";

            const teorMovCell = document.createElement("td");
            teorMovCell.classList.add("fixed");
            teorMovCell.textContent = ultimoHistorico.teor_ultima_movimentacao || "N/A";

            const despachoCell = document.createElement("td");
            despachoCell.textContent = ultimoHistorico.ultimo_despacho || "N/A";

            const teorDespachoCell = document.createElement("td");
            teorDespachoCell.classList.add("fixed");
            const despachoLink = document.createElement("a");
            despachoLink.href = "#";
            despachoLink.textContent = ultimoHistorico.teor_ultimo_despacho || "N/A";
            despachoLink.dataset.historico = JSON.stringify(ultimoHistorico);
            despachoLink.classList.add("despachoLink");
            teorDespachoCell.appendChild(despachoLink);

            const novoDespachoCell = document.createElement("td");
            const btnNovoDespacho = document.createElement("button");
            if (processo.novo_despacho === "Sim") {
                btnNovoDespacho.innerHTML = `<span class="icon-check">✔</span> Sim`;
                btnNovoDespacho.className = "btn-sim";
            } else {
                btnNovoDespacho.innerHTML = `<span class="icon-cross">✖</span> Não`;
                btnNovoDespacho.className = "btn-nao";
            }
            btnNovoDespacho.addEventListener("click", function () {
                alternarNovoDespacho(processo.numero, btnNovoDespacho);
            });
            novoDespachoCell.appendChild(btnNovoDespacho);

            const acoesCell = document.createElement("td");
            const btnExcluir = document.createElement("button");
            btnExcluir.textContent = "Excluir";
            btnExcluir.className = "btn-excluir";
            btnExcluir.addEventListener("click", () => {
                if (confirm("Tem certeza que quer excluir este processo?")) {
                    excluirProcesso(processo.numero);
                }
            });
            acoesCell.appendChild(btnExcluir);

            row.appendChild(numeroCell);
            row.appendChild(statusCell);
            row.appendChild(pesquisaCell);
            row.appendChild(movCell);
            row.appendChild(teorMovCell);
            row.appendChild(despachoCell);
            row.appendChild(teorDespachoCell);
            row.appendChild(novoDespachoCell);
            row.appendChild(acoesCell);

            tabelaBody.appendChild(row);
        });

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

        // 🔹 Após atualizar, recarregar a tabela para mostrar as mudanças
        carregarProcessosDoBackend();

    } catch (error) {
        console.error("Erro ao enviar processo:", error);
    }
}



// Função para chamar o endpoint de exclusão do processo
async function excluirProcesso(numero) {
    try {
        const response = await fetch(`${API_URL}/${numero}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Erro ao excluir processo.");
        alert("Processo excluído com sucesso.");
        carregarProcessosDoBackend(); // Atualiza a tabela após a exclusão
    } catch (error) {
        console.error("Erro ao excluir processo:", error);
        alert("Erro ao excluir processo. Verifique o console para mais detalhes.");
    }
}


async function excluirHistorico(numero, data) {
    try {
        const response = await fetch(`${API_URL}/${numero}/historico`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data })
        });
        if (!response.ok) throw new Error("Erro ao excluir entrada do histórico.");
        alert("Entrada do histórico excluída com sucesso.");
        // Após excluir, recarregue a tabela ou reabra o modal para refletir a mudança
        carregarProcessosDoBackend();
        fecharModalHistorico();
    } catch (error) {
        console.error("Erro ao excluir entrada do histórico:", error);
        alert("Erro ao excluir entrada do histórico.");
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
                const response = await fetch(API_URL + "/atualizar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    // Aqui adicionamos "manual": true no objeto do processo
                    body: JSON.stringify({
                        processos: [{ numero: numeroProcesso, manual: true }]
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
        // Modificado para marcar como inserção manual:
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
    modalConteudo.innerHTML = ""; // Limpa conteúdo antigo
  
    // Cria o título com o número do processo
    const modalTitulo = document.createElement("h3");
    modalTitulo.textContent = "Histórico do Processo: " + processo.numero;
    modalConteudo.appendChild(modalTitulo);
  
    // Cria a tabela
    const table = document.createElement("table");
    table.classList.add("historico-table");
  
    // Cria o cabeçalho com a nova coluna "Ações"
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const headers = [
      "Última Pesquisa",
      "Movimentação",
      "Teor Movimentação",
      "Despacho",
      "Teor Despacho",
      "Link",
      "Ações"
    ];
    headers.forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    // Cria o corpo da tabela
    const tbody = document.createElement("tbody");
  
    if (processo.historico && processo.historico.length > 0) {
      processo.historico.forEach(item => {
        const tr = document.createElement("tr");
  
        // Coluna: Última Pesquisa
        const tdData = document.createElement("td");
        tdData.textContent = formatDate(item.data);
        tr.appendChild(tdData);
  
        // Coluna: Movimentação
        const tdMov = document.createElement("td");
        tdMov.textContent = item.ultima_movimentacao || "N/A";
        tr.appendChild(tdMov);
  
        // Coluna: Teor Movimentação
        const tdTeorMov = document.createElement("td");
        tdTeorMov.textContent = item.teor_ultima_movimentacao || "N/A";
        tdTeorMov.classList.add("fixed");
        tr.appendChild(tdTeorMov);
  
        // Coluna: Despacho
        const tdDespacho = document.createElement("td");
        tdDespacho.textContent = item.ultimo_despacho || "N/A";
        tr.appendChild(tdDespacho);
  
        // Coluna: Teor Despacho
        const tdTeorDespacho = document.createElement("td");
        tdTeorDespacho.textContent = item.teor_ultimo_despacho || "N/A";
        tdTeorDespacho.classList.add("fixed");
        tr.appendChild(tdTeorDespacho);
  
        // Coluna: Link
        const tdLink = document.createElement("td");
        if (item.link) {
          const a = document.createElement("a");
          a.href = item.link;
          a.target = "_blank";
          a.textContent = "Ver";
          tdLink.appendChild(a);
        } else {
          tdLink.textContent = "N/A";
        }
        tr.appendChild(tdLink);
  
        // Coluna: Ações (botão excluir)
        const tdAcoes = document.createElement("td");
        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.classList.add("btn-excluir-historico");
        btnExcluir.addEventListener("click", function() {
          if (confirm("Tem certeza que quer excluir esta entrada do histórico?")) {
            excluirHistorico(processo.numero, item.data);
          }
        });
        tdAcoes.appendChild(btnExcluir);
        tr.appendChild(tdAcoes);
  
        tbody.appendChild(tr);
      });
    } else {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.textContent = "Nenhum histórico encontrado.";
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    modalConteudo.appendChild(table);
    document.getElementById("modalHistorico").style.display = "block";
  }
  
  
  function fecharModalHistorico() {
    document.getElementById("modalHistorico").style.display = "none";
  }
  
  document.getElementById("fecharDespacho").addEventListener("click", () => {
    document.getElementById("modalDespacho").style.display = "none";
  });
  
  document.getElementById("fecharHistorico").addEventListener("click", () => {
    document.getElementById("modalHistorico").style.display = "none";
  });

  // Torna a função acessível no console do navegador
window.carregarProcessosDoBackend = carregarProcessosDoBackend;
