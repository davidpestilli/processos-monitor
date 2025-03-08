// dom.js
import { formatDate, limitarTexto } from "./api.js";

// Cria uma linha da tabela para exibir um processo
export function createProcessRow(processo) {
  const ultimoHistorico = (processo.historico && processo.historico.length)
    ? processo.historico[processo.historico.length - 1]
    : {};

  const row = document.createElement("tr");

  // Célula com checkbox para seleção
  const checkboxCell = document.createElement("td");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("processo-checkbox");
  checkbox.dataset.numero = processo.numero;
  checkboxCell.appendChild(checkbox);
  row.appendChild(checkboxCell);

  // Célula com número do processo (link)
  const numeroCell = document.createElement("td");
  const numeroLink = document.createElement("a");
  numeroLink.href = "#";
  numeroLink.textContent = processo.numero;
  numeroLink.dataset.processo = JSON.stringify(processo);
  numeroLink.classList.add("numeroLink");
  numeroCell.appendChild(numeroLink);
  row.appendChild(numeroCell);

  // Célula com status
  const statusCell = document.createElement("td");
  statusCell.textContent = processo.status || "-";
  if (processo.status && ["baixa", "decurso", "trânsito", "origem"].includes(processo.status.toLowerCase())) {
    statusCell.classList.add("status-alerta");
  }
  row.appendChild(statusCell);

  // Célula com última pesquisa
  const pesquisaCell = document.createElement("td");
  pesquisaCell.textContent = processo.ultima_pesquisa ? formatDate(processo.ultima_pesquisa) : "-";
  row.appendChild(pesquisaCell);

  // Célula com última movimentação
  const movCell = document.createElement("td");
  movCell.textContent = ultimoHistorico.ultima_movimentacao || "-";
  row.appendChild(movCell);

  // Célula com teor da última movimentação (link para modal)
  const teorMovCell = document.createElement("td");
  const teorMovLink = document.createElement("a");
  teorMovLink.href = "#";
  teorMovLink.classList.add("teor-movimentacao");
  const teorMovText = ultimoHistorico.teor_ultima_movimentacao
    ? limitarTexto(ultimoHistorico.teor_ultima_movimentacao, 100)
    : "-";
  teorMovLink.textContent = teorMovText;
  teorMovLink.addEventListener("click", (e) => {
    e.preventDefault();
    openModalTexto(ultimoHistorico.teor_ultima_movimentacao || "-", "Teor da Última Movimentação");
  });
  teorMovCell.appendChild(teorMovLink);
  row.appendChild(teorMovCell);

  // Célula com último despacho
  const despachoCell = document.createElement("td");
  despachoCell.textContent = ultimoHistorico.ultimo_despacho || "-";
  row.appendChild(despachoCell);

  // Célula com teor do último despacho (link para modal)
  const teorDespachoCell = document.createElement("td");
  const teorDespachoLink = document.createElement("a");
  teorDespachoLink.href = "#";
  teorDespachoLink.classList.add("teor-despacho");
  teorDespachoLink.textContent = limitarTexto(ultimoHistorico.teor_ultimo_despacho, 100);
  teorDespachoLink.addEventListener("click", (e) => {
    e.preventDefault();
    openModalTexto(ultimoHistorico.teor_ultimo_despacho || "-", "Teor do Último Despacho", ultimoHistorico.link || null);
  });
  teorDespachoCell.appendChild(teorDespachoLink);
  row.appendChild(teorDespachoCell);

  // Célula com botão de "Novo Despacho"
  const novoDespachoCell = document.createElement("td");
  const btnNovoDespacho = document.createElement("button");
  if (processo.novo_despacho === "Sim") {
    btnNovoDespacho.innerHTML = `<span class="icon-check">✔</span> Sim`;
    btnNovoDespacho.className = "btn-sim";
  } else {
    btnNovoDespacho.innerHTML = `<span class="icon-cross">✖</span> Não`;
    btnNovoDespacho.className = "btn-nao";
  }
  btnNovoDespacho.dataset.teorDespacho = ultimoHistorico.teor_ultimo_despacho || "";
  novoDespachoCell.appendChild(btnNovoDespacho);
  row.appendChild(novoDespachoCell);



  // Célula GAP
  const gapCell = document.createElement("td");
  gapCell.classList.add("gap-cell"); // Aplica a classe para estilização
  gapCell.dataset.numero = processo.numero; // Adiciona o número do processo para referência
  gapCell.textContent = processo.gap || "—"; // Se não houver assistente, mostra "—"

  // Adiciona evento de clique para abrir o modal
  gapCell.addEventListener("click", () => {
    console.log(`🟢 Clicado na célula GAP do processo ${processo.numero}`);
    abrirModalGAP(processo);
  });

  row.appendChild(gapCell);


  // Célula Resumo
  const resumoCell = document.createElement("td");
  resumoCell.textContent = processo.resumo || "-";
  row.appendChild(resumoCell);

  return { row, numeroLink, btnNovoDespacho, checkbox };

}

// Função para abrir o modal genérico (para exibir textos completos)
export function openModalTexto(text, title, link = null) {
  document.getElementById("modalTextoGenerico").textContent = text;
  document.getElementById("modalTituloGenerico").textContent = title;
  const modalLink = document.getElementById("modalLinkGenerico");
  if (link) {
    modalLink.href = link;
    modalLink.style.display = "block";
  } else {
    modalLink.style.display = "none";
  }
  document.getElementById("modalGenerico").style.display = "block";
}

// Função para abrir o modal de histórico de um processo
export function openModalHistorico(processo) {
    // Armazena o processo atual para uso futuro (por exemplo, após exclusão)
    window.currentHistoricoProcesso = processo;
  const modalConteudo = document.getElementById("modalConteudoHistorico");
  modalConteudo.innerHTML = "";
  const table = document.createElement("table");
  table.classList.add("historico-table");

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const thCheckbox = document.createElement("th");
  const selectAllCheckbox = document.createElement("input");
  selectAllCheckbox.type = "checkbox";
  selectAllCheckbox.id = "selecionarTodosHistorico";
  thCheckbox.appendChild(selectAllCheckbox);
  headerRow.appendChild(thCheckbox);

  const headers = ["Última Pesquisa", "Movimentação", "Teor Movimentação", "Despacho", "Teor Despacho", "Link"];
  headers.forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  if (processo.historico && processo.historico.length > 0) {
    processo.historico.forEach(item => {
      const tr = document.createElement("tr");

      const tdCheckbox = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.classList.add("historico-checkbox");
      checkbox.dataset.numero = processo.numero;
      checkbox.dataset.data = item.data;
      tdCheckbox.appendChild(checkbox);
      tr.appendChild(tdCheckbox);

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
      teorMovLink.addEventListener("click", (e) => {
        e.preventDefault();
        openModalTexto(item.teor_ultima_movimentacao || "-", "Teor da Movimentação");
      });
      tdTeorMov.appendChild(teorMovLink);
      tr.appendChild(tdTeorMov);

      const tdDespacho = document.createElement("td");
      tdDespacho.textContent = item.ultimo_despacho || "-";
      tr.appendChild(tdDespacho);

      const tdTeorDesp = document.createElement("td");
      const teorDespLink = document.createElement("a");
      teorDespLink.href = "#";
      teorDespLink.classList.add("teor-despacho");
      teorDespLink.textContent = item.teor_ultimo_despacho || "-";
      teorDespLink.addEventListener("click", (e) => {
        e.preventDefault();
        openModalTexto(item.teor_ultimo_despacho || "-", "Teor do Último Despacho");
      });
      tdTeorDesp.appendChild(teorDespLink);
      tr.appendChild(tdTeorDesp);

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

  setTimeout(() => {
    const selecionarTodosCheckbox = document.getElementById("selecionarTodosHistorico");
    if (selecionarTodosCheckbox) {
      selecionarTodosCheckbox.addEventListener("change", function () {
        const checkboxes = document.querySelectorAll(".historico-checkbox");
        checkboxes.forEach(cb => cb.checked = this.checked);
      });
    }
  }, 100);
}

// Função para fechar um modal, dado o ID do elemento
export function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}
