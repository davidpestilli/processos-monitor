const API_URL = "https://processos-monitor-production.up.railway.app/processos";

// Função para carregar os processos do backend
function carregarProcessosDoBackend() {
    fetch("https://processos-monitor-production.up.railway.app/processos")
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro ao carregar processos.");
            }
            return response.json();
        })
        .then(processos => {
            const tabelaBody = document.querySelector("#tabelaProcessos tbody");

            // Limpa apenas as linhas existentes, sem remover o cabeçalho
            tabelaBody.innerHTML = "";

            processos.forEach(processo => {
                const row = document.createElement("tr");

            // Exemplo na montagem da linha:
            row.innerHTML = `
                <td>${processo.numero}</td>
                <td>${processo.status || "N/A"}</td>
                <td>${processo.ultima_pesquisa ? new Date(processo.ultima_pesquisa).toLocaleDateString() : "N/A"}</td>
                <td>${processo.ultima_movimentacao || "N/A"}</td>
                <td class="fixed">${processo.teor_ultima_movimentacao || "N/A"}</td>
                <td>${processo.ultimo_despacho || "N/A"}</td>
                <td class="fixed">
                ${processo.teor_ultimo_despacho || "N/A"}
                </td>
                <td>
                    ${processo.novo_despacho === "Sim" ? '<button class="btn-sim">✔ Sim</button>' : '<button class="btn-nao">❌ Não</button>'}
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

