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

// Função para buscar os processos na API
export async function fetchProcessos() {
  const cacheBuster = new Date().getTime();
  const response = await fetch(`${API_URL}?_=${cacheBuster}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Erro ao buscar processos.");
  }
  const processos = await response.json();
  return processos;
}

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
