// api.js

export const API_URL = "https://processos-monitor-production.up.railway.app/processos";

// Função utilitária para formatação de data
export function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
}

// Função utilitária para limitar o tamanho do texto
export function limitarTexto(texto, limite = 80) {
  if (!texto || texto.trim() === "-") return "-";
  return texto.length > limite ? texto.substring(0, limite) + "..." : texto;
}

// Função para buscar os processos na API com melhor tratamento de erros
export async function fetchProcessos() {
  const cacheBuster = new Date().getTime();
  try {
    console.log(`🔍 Buscando processos da API: ${API_URL}?_=${cacheBuster}`);
    
    const response = await fetch(`${API_URL}?_=${cacheBuster}`, { cache: "no-store" });

    console.log(`📡 Resposta da API: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`Erro ao buscar processos: ${response.statusText}`);
    }

    const processos = await response.json();
    
    console.log("📊 Processos recebidos do backend:", processos);

    return processos;
  } catch (error) {
    console.error("❌ Erro ao buscar processos:", error);
    return [];
  }
}

// 🚀 Teste a função chamando-a diretamente
fetchProcessos().then(processos => {
  console.log("🟢 Teste direto no navegador - Processos recebidos:", processos);
});



// Função para atualizar o campo "Novo Despacho"
export async function updateNovoDespacho(numero, novoValor) {
  const response = await fetch(`${API_URL}/atualizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      processos: [{ numero, novo_despacho: novoValor }]
    })
  });
  if (!response.ok) throw new Error("Erro ao atualizar despacho.");
  return response;
}

// Função para salvar um novo processo
export async function salvarProcesso(processo) {
  const response = await fetch(`${API_URL}/atualizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ processos: [processo] })
  });
  if (!response.ok) throw new Error("Erro ao enviar processo.");
  return response;
}

// Função para excluir múltiplos processos
export async function excluirProcessos(numeros) {
  const response = await fetch("/processos/excluir-multiplos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numeros })
  });
  if (!response.ok) throw new Error("Erro ao excluir processos.");
  return response.json();
}

// Função para excluir múltiplas entradas do histórico
export async function excluirHistorico(entradas) {
  const response = await fetch("/processos/excluir-historico-multiplos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entradas })
  });
  if (!response.ok) throw new Error("Erro ao excluir entradas do histórico.");
  return response.json();
}

// Função para enviar os processos extraídos de um CSV
export async function uploadCSV(processos) {
  const response = await fetch(`${API_URL}/atualizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ processos })
  });
  if (!response.ok) throw new Error("Erro ao enviar os processos.");
  return response;
}

//funções para coluna resumo
export async function buscarResumos(numero) {
  const response = await fetch(`${API_URL}/${numero}/resumos`);
  if (!response.ok) throw new Error("Erro ao buscar resumos.");
  return response.json();
}

export async function salvarResumo(numero, texto, assistente) {
  console.log(`📤 Enviando resumo para API...`);
  console.log(`📌 Processo: ${numero}`);
  console.log(`✏️ Texto: ${texto}`);
  console.log(`🧑 Assistente: ${assistente}`);

  const response = await fetch(`${API_URL}/${numero}/resumos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto, assistente })
  });

  if (!response.ok) {
    throw new Error(`Erro ao salvar resumo: ${response.statusText}`);
  }

  return response.json();
}

