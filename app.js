// URL do backend no Railway
const BACKEND_URL = "https://seu-backend-railway.app";

// Evento para registro do usuário
document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    try {
        const response = await fetch(`${BACKEND_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) throw new Error("Erro ao registrar usuário.");
        console.log("Usuário registrado com sucesso:", email);
    } catch (error) {
        console.error("Erro ao registrar usuário:", error);
    }
});

// Evento para login do usuário
document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${BACKEND_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) throw new Error("Login ou senha inválidos.");
        console.log("Usuário logado:", email);
        document.getElementById("loginError").textContent = "";
    } catch (error) {
        console.error("Erro de login:", error);
        document.getElementById("loginError").textContent = "Login ou senha inválidos. Por favor, tente novamente.";
    }
});

// Função para salvar processos no backend
async function salvarProcessoNoBackend(processos) {
    try {
        const response = await fetch(`${BACKEND_URL}/processos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ processos }),
        });

        if (!response.ok) throw new Error("Erro ao enviar processos.");
        console.log("Processos salvos com sucesso.");
        carregarProcessosDoBackend(); // Atualiza a tabela após salvar
    } catch (error) {
        console.error("Erro:", error);
    }
}

// Listener do formulário de upload e inserção manual
document.getElementById("uploadForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const fileInput = document.getElementById("csvFile");
    const manualInput = document.getElementById("processoManual");

    let processos = [];

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = async function(e) {
            const text = e.target.result;
            const linhas = text.split(/\r?\n/);

            processos = linhas
                .flatMap(linha => linha.split(/[;,]+/))
                .map(valor => valor.trim())
                .filter(valor => valor)
                .map(processNumber => ({ processNumber }));

            if (processos.length > 0) {
                await salvarProcessoNoBackend(processos);
            }

            fileInput.value = "";
        };

        reader.readAsText(file);
    } else if (manualInput.value.trim()) {
        processos.push({ processNumber: manualInput.value.trim() });

        await salvarProcessoNoBackend(processos);
        manualInput.value = "";
    } else {
        console.log("Nenhum dado foi inserido.");
    }
});

// Função para buscar processos no backend e atualizar a tabela
async function carregarProcessosDoBackend() {
    try {
        const response = await fetch(`${BACKEND_URL}/processos`);
        if (!response.ok) throw new Error("Erro ao carregar processos.");

        const processos = await response.json();
        atualizarTabela(processos);
    } catch (error) {
        console.error("Erro ao buscar processos:", error);
    }
}

// Função para atualizar a tabela de processos no frontend
function atualizarTabela(processos) {
    const tabela = document.getElementById("processesTable").getElementsByTagName("tbody")[0];
    tabela.innerHTML = "";

    processos.forEach(processo => {
        const row = tabela.insertRow();
        row.innerHTML = `
            <td>${processo.numero}</td>
            <td>${processo.status}</td>
            <td>${new Date(processo.criado_em).toLocaleString()}</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
        `;
    });
}

// Chamar a função ao carregar a página
document.addEventListener("DOMContentLoaded", carregarProcessosDoBackend);
