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

                row.innerHTML = `
                    <td>${processo.numero}</td>
                    <td>${processo.status || "N/A"}</td>
                    <td>${processo.ultima_pesquisa ? new Date(processo.ultima_pesquisa).toLocaleDateString() : "N/A"}</td>
                    <td>${processo.ultima_movimentacao || "N/A"}</td>
                    <td>${processo.teor_ultima_movimentacao || "N/A"}</td>
                    <td>${processo.ultimo_despacho || "N/A"}</td>
                    <td>${processo.teor_ultimo_despacho || "N/A"}</td>
                    <td>
                        ${processo.novo_despacho === "Sim" ? 
                            '<button class="btn-sim">✔ Sim</button>' : 
                            '<button class="btn-nao">❌ Não</button>'}
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
    const formProcesso = document.getElementById("formProcesso");
    if (formProcesso) {
        formProcesso.addEventListener("submit", async function (event) {
            event.preventDefault();

            const numero = document.getElementById("numeroProcesso").value;
            const ultima_movimentacao = document.getElementById("ultimaMovimentacao").value;
            const teor_ultima_movimentacao = document.getElementById("teorUltimaMovimentacao").value;
            const ultimo_despacho = document.getElementById("ultimoDespacho").value;
            const teor_ultimo_despacho = document.getElementById("teorUltimoDespacho").value;

            if (!numero || !ultima_movimentacao || !teor_ultima_movimentacao) {
                alert("Preencha os campos obrigatórios.");
                return;
            }

            const novoProcesso = {
                numero,
                ultima_movimentacao,
                teor_ultima_movimentacao,
                ultimo_despacho,
                teor_ultimo_despacho
            };

            await salvarProcessoNoBackend(novoProcesso);
            formProcesso.reset();
        });
    } else {
        console.error("❌ O formulário 'formProcesso' não foi encontrado no HTML.");
    }
});


// Carregar os processos ao iniciar
document.addEventListener("DOMContentLoaded", carregarProcessosDoBackend);
