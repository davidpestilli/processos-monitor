const API_URL = "https://processos-monitor-production.up.railway.app/processos";

  function formatDate(date) {
    if (!date) return "-";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  }


function limitarTexto(texto, limite = 80) {
    if (!texto || texto.trim() === "-") return "-"; // 🔹 Evita inserir "-" duas vezes
    return texto.length > limite ? texto.substring(0, limite) + "..." : texto;
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
            statusCell.textContent = processo.status ? processo.status : "-"; // 🔹 Agora garante que o status atualizado seja exibido
            
            // Aplica cor de fundo verde claro se o status NÃO for "Em trâmite"
            if (processo.status && ["baixa", "decurso", "trânsito", "origem"].includes(processo.status.toLowerCase())) {
                statusCell.classList.add("status-alerta");
            }
            
            console.log(`🔄 Status carregado no frontend para ${processo.numero}: ${processo.status}`);
                       

            const pesquisaCell = document.createElement("td");
            pesquisaCell.textContent = processo.ultima_pesquisa ? formatDate(processo.ultima_pesquisa) : "-";

            const movCell = document.createElement("td");
            movCell.textContent = ultimoHistorico.ultima_movimentacao ? ultimoHistorico.ultima_movimentacao : "-";
            
            const teorMovCell = document.createElement("td");
            const teorMovLink = document.createElement("a");
            teorMovLink.href = "#";
            teorMovLink.classList.add("teor-movimentacao");
            
            const teorMovText = ultimoHistorico.teor_ultima_movimentacao ? limitarTexto(ultimoHistorico.teor_ultima_movimentacao, 80) : "-";
            teorMovLink.textContent = teorMovText;
            
            teorMovLink.addEventListener("click", function (e) {
                e.preventDefault();
                abrirModalTexto(ultimoHistorico.teor_ultima_movimentacao || "-", "Teor da Última Movimentação");
            });
            teorMovCell.appendChild(teorMovLink);
            
            
            
            const despachoCell = document.createElement("td");
            despachoCell.textContent = ultimoHistorico.ultimo_despacho || "-";
            
            const teorDespachoCell = document.createElement("td");
            const teorDespachoLink = document.createElement("a");
            teorDespachoLink.href = "#";
            teorDespachoLink.classList.add("teor-despacho");
            teorDespachoLink.textContent = limitarTexto(ultimoHistorico.teor_ultimo_despacho, 80); // Limita a 80 caracteres
            teorDespachoLink.addEventListener("click", function (e) {
                e.preventDefault();
                abrirModalTexto(
                    ultimoHistorico.teor_ultimo_despacho || "-", // Exibe o texto completo no modal
                    "Teor do Último Despacho",
                    ultimoHistorico.link || null  // 🔹 Agora passa o link correto!
                );
            });
            teorDespachoCell.appendChild(teorDespachoLink);
            
              

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

            const checkboxCell = document.createElement("td");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("processo-checkbox");
            checkbox.dataset.numero = processo.numero;  // Armazena o número do processo
            checkboxCell.appendChild(checkbox);
            row.insertBefore(checkboxCell, row.firstChild); // Garante que o checkbox esteja na primeira coluna


            row.appendChild(numeroCell);
            row.appendChild(statusCell);
            row.appendChild(pesquisaCell);
            row.appendChild(movCell);
            row.appendChild(teorMovCell);
            row.appendChild(despachoCell);
            row.appendChild(teorDespachoCell);
            row.appendChild(novoDespachoCell);
            row.appendChild(checkboxCell);


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

      document.getElementById("selecionarTodosProcessos").addEventListener("change", function () {
        const checkboxes = document.querySelectorAll(".processo-checkbox");
        checkboxes.forEach(checkbox => checkbox.checked = this.checked);
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

document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM completamente carregado. Registrando eventos...");

    // 🔹 Capturar submissão de novo processo
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
                    // Adicionamos "manual": true no objeto do processo
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

    // 🔹 Adicionar evento para exclusão múltipla de processos na tabela principal
    const btnExcluirSelecionados = document.getElementById("btnExcluirSelecionados");

    if (btnExcluirSelecionados) {
        btnExcluirSelecionados.addEventListener("click", async function () {
            console.log("🔍 Botão de exclusão múltipla clicado.");

            const checkboxes = document.querySelectorAll(".processo-checkbox:checked");

            if (checkboxes.length === 0) {
                alert("Nenhum processo selecionado.");
                return;
            }

            if (!confirm(`Tem certeza que deseja excluir ${checkboxes.length} processos selecionados?`)) {
                return;
            }

            const numerosParaExcluir = Array.from(checkboxes).map(cb => cb.dataset.numero);
            console.log("📌 Processos a excluir:", numerosParaExcluir);

            try {
                const response = await fetch("/processos/excluir-multiplos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ numeros: numerosParaExcluir })
                });

                if (!response.ok) throw new Error("Erro ao excluir processos.");

                alert("Processos excluídos com sucesso!");
                carregarProcessosDoBackend();
            } catch (error) {
                console.error("❌ Erro ao excluir processos:", error);
                alert("Erro ao excluir processos. Verifique o console para mais detalhes.");
            }
        });
    } else {
        console.error("❌ Erro: Botão 'Excluir Selecionados' não encontrado no DOM.");
    }

    // 🔹 Adicionar evento para exclusão múltipla no modal histórico
    const btnExcluirHistoricoSelecionado = document.getElementById("btnExcluirHistoricoSelecionado");

    if (btnExcluirHistoricoSelecionado) {
        btnExcluirHistoricoSelecionado.addEventListener("click", async function () {
            console.log("🔍 Botão de exclusão múltipla do histórico clicado.");

            // Capturar checkboxes marcados no modal do histórico
            const checkboxes = document.querySelectorAll(".historico-checkbox:checked");

            if (checkboxes.length === 0) {
                alert("Nenhuma entrada do histórico selecionada.");
                return;
            }

            if (!confirm(`Tem certeza que deseja excluir ${checkboxes.length} entradas selecionadas do histórico?`)) {
                return;
            }

            // Criar array de objetos contendo os números dos processos e as datas das entradas
            const dadosParaExcluir = Array.from(checkboxes).map(cb => ({
                numero: cb.dataset.numero,
                data: cb.dataset.data
            }));

            console.log("📌 Entradas do histórico a excluir:", dadosParaExcluir);

            try {
                const response = await fetch("/processos/excluir-historico-multiplos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ entradas: dadosParaExcluir })
                });

                if (!response.ok) throw new Error("Erro ao excluir entradas do histórico.");

                alert("Entradas do histórico excluídas com sucesso!");
                carregarProcessosDoBackend(); // Atualiza a tabela principal
                fecharModalHistorico(); // Fecha o modal após exclusão
            } catch (error) {
                console.error("❌ Erro ao excluir histórico:", error);
                alert("Erro ao excluir histórico. Verifique o console para mais detalhes.");
            }
        });
    } else {
        console.error("❌ Erro: Botão 'Excluir Selecionados' do modal histórico não encontrado no DOM.");
    }

    // 🔹 Depois de configurar os eventos, carregamos os processos do backend
    carregarProcessosDoBackend();
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
      item.teor_ultimo_despacho || "-";
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

  // Função para abrir o modal de teor de movimentação e despacho
  function abrirModalTexto(texto, titulo, link = null) {
    document.getElementById("modalTextoGenerico").textContent = texto;
    document.getElementById("modalTituloGenerico").textContent = titulo;

    const modalLink = document.getElementById("modalLinkGenerico");
    if (link) {
        modalLink.href = link;
        modalLink.style.display = "block";
    } else {
        modalLink.style.display = "none";
    }

    document.getElementById("modalGenerico").style.display = "block";
}



// Fechar o modal genérico
document.getElementById("fecharModalGenerico").addEventListener("click", function () {
    document.getElementById("modalGenerico").style.display = "none";
});

  
function abrirModalHistorico(processo) {
    const modalConteudo = document.getElementById("modalConteudoHistorico");
    modalConteudo.innerHTML = ""; // Limpa conteúdo antigo

    // Criar a tabela
    const table = document.createElement("table");
    table.classList.add("historico-table");

    // Criar o cabeçalho com a coluna de seleção
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    // Criar o cabeçalho para o checkbox "Selecionar Todos"
    const thCheckbox = document.createElement("th");
    const selectAllCheckbox = document.createElement("input");
    selectAllCheckbox.type = "checkbox";
    selectAllCheckbox.id = "selecionarTodosHistorico";
    thCheckbox.appendChild(selectAllCheckbox);
    headerRow.appendChild(thCheckbox);

    // Criar os demais cabeçalhos
    const headers = ["Última Pesquisa", "Movimentação", "Teor Movimentação", "Despacho", "Teor Despacho", "Link"];
    headers.forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Criar o corpo da tabela
    const tbody = document.createElement("tbody");

    if (processo.historico && processo.historico.length > 0) {
        processo.historico.forEach(item => {
            const tr = document.createElement("tr");

            // Criar a célula do checkbox
            const tdCheckbox = document.createElement("td");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("historico-checkbox");
            checkbox.dataset.numero = processo.numero;
            checkbox.dataset.data = item.data;
            tdCheckbox.appendChild(checkbox);
            tr.appendChild(tdCheckbox);

            // Adicionar as demais colunas
            const tdData = document.createElement("td");
            tdData.textContent = formatDate(item.data);
            tr.appendChild(tdData);

            const tdMov = document.createElement("td");
            tdMov.textContent = item.ultima_movimentacao || "-";
            tr.appendChild(tdMov);

            const tdTeorMov = document.createElement("td");
            const teorMovLink = document.createElement("a");
            teorMovLink.href = "#";
            teorMovLink.classList.add("teor-movimentacao");
            teorMovLink.textContent = item.teor_ultima_movimentacao || "-";
            teorMovLink.addEventListener("click", function (e) {
                e.preventDefault();
                abrirModalTexto(item.teor_ultima_movimentacao || "-", "Teor da Movimentação");
            });
            tdTeorMov.appendChild(teorMovLink);
            tr.appendChild(tdTeorMov);

            const tdDespacho = document.createElement("td");
            tdDespacho.textContent = item.ultimo_despacho || "-";
            tr.appendChild(tdDespacho);

            const teorDespachoCell = document.createElement("td");
            const teorDespachoLink = document.createElement("a");
            teorDespachoLink.href = "#";
            teorDespachoLink.classList.add("teor-despacho");
            teorDespachoLink.textContent = item.teor_ultimo_despacho || "-";
            teorDespachoLink.addEventListener("click", function (e) {
                e.preventDefault();
                abrirModalTexto(teorDespachoLink.textContent, "Teor do Último Despacho");
            });
            teorDespachoCell.appendChild(teorDespachoLink);
            tr.appendChild(teorDespachoCell);

            const tdLink = document.createElement("td");
            if (item.link) {
                const a = document.createElement("a");
                a.href = item.link;
                a.target = "_blank";
                a.textContent = "Ver";
                tdLink.appendChild(a);
            } else {
                tdLink.textContent = "-";
            }
            tr.appendChild(tdLink);

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

    // 🔹 Adiciona um pequeno atraso para garantir que o checkbox está no DOM antes de adicionar o evento
    setTimeout(() => {
        const selecionarTodosCheckbox = document.getElementById("selecionarTodosHistorico");
        if (selecionarTodosCheckbox) {
            selecionarTodosCheckbox.addEventListener("change", function () {
                const checkboxes = document.querySelectorAll(".historico-checkbox");
                checkboxes.forEach(checkbox => checkbox.checked = this.checked);
            });
        } else {
            console.error("❌ Erro: Checkbox 'Selecionar Todos' do modal histórico não encontrado!");
        }
    }, 100); // Aguarda um pequeno tempo para garantir que o elemento esteja no DOM
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
