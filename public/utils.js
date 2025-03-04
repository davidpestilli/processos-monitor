// utils.js

/**
 * Normaliza o número do processo, extraindo-o se houver conteúdo extra.
 */
export function normalizeNumero(numero) {
    if (typeof numero !== "string") return numero;
    if (numero.trim().startsWith('[{')) {
      const match = numero.match(/"numero":"([^"]+)"/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return numero.trim();
  }
  
  /**
   * Normaliza um texto, removendo quebras de linha e escapando barras indevidamente.
   */
  export function normalizeText(text) {
    if (typeof text !== "string") return text;
    let normalized = text.replace(/[\r\n]+/g, " ").trim();
    normalized = normalized.replace(/\\(?![\\\/"bfnrt])/g, "\\\\");
    return normalized;
  }
  
  /**
   * Calcula a distância de Levenshtein entre duas strings.
   */
  export function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substituição
            matrix[i][j - 1] + 1,     // inserção
            matrix[i - 1][j] + 1      // deleção
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
  
  /**
   * Calcula a porcentagem de diferença entre duas strings com base na distância de Levenshtein.
   */
  export function computeDifferencePercentage(a, b) {
    if (!a || !b) return 100;
    const distance = levenshtein(a, b);
    const maxLength = Math.max(a.length, b.length);
    return (distance / maxLength) * 100;
  }
  
  /**
   * Remove acentos de uma string.
   */
  export function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  