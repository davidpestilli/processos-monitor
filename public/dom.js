// dom.js
import { formatDate, limitarTexto, salvarResumo, buscarResumos } from "./api.js";

// Cria uma linha da tabela para exibir um processo
//console.log(`📌 Criando linha para o processo ${processo.numero}`);

export function createProcessRow(processo) {
  if (!processo || !processo.numero) {
    console.error("❌ ERRO: Tentativa de criar linha para um processo indefinido ou sem número:", processo);
    return null;
  }

  // Obtém o histórico cadastrado, se existir
  const ultimoHistorico = (processo.historico && processo.historico.length)
    ? processo.historico[processo.historico.length - 1]
    : {};

  // Obtém o último resumo cadastrado, se existir
  const ultimoResumo = (processo.resumos && processo.resumos.length > 0)
    ? processo.resumos[processo.resumos.length - 1].texto
    : null;

  console.log(`📌 Criando linha para o processo ${processo.numero}`);

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
  const numeroLink = document.createElement("a"); // 🔹 Armazenamos numeroLink
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
  teorMovLink.textContent = ultimoHistorico.teor_ultima_movimentacao
    ? limitarTexto(ultimoHistorico.teor_ultima_movimentacao, 100)
    : "-";
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
  const btnNovoDespacho = document.createElement("button"); // 🔹 Armazenamos btnNovoDespacho
  btnNovoDespacho.textContent = processo.novo_despacho === "Sim" ? "✔ Sim" : "❌ Não";
  btnNovoDespacho.className = processo.novo_despacho === "Sim" ? "btn-sim" : "btn-nao";
  btnNovoDespacho.dataset.teorDespacho = ultimoHistorico.teor_ultimo_despacho || "";
  novoDespachoCell.appendChild(btnNovoDespacho);
  row.appendChild(novoDespachoCell);

  // Célula GAP
  const gapCell = document.createElement("td");
  gapCell.classList.add("gap-cell");
  gapCell.dataset.numero = processo.numero;
  gapCell.textContent = processo.gap || "—";
  gapCell.addEventListener("click", () => {
    console.log(`🟢 Clicado na célula GAP do processo ${processo.numero}`);
    abrirModalGAP(processo);
  });
  row.appendChild(gapCell);

  // Criar a célula de Resumo
  const resumoCell = document.createElement("td");
  resumoCell.classList.add("resumo-cell");
  resumoCell.style.cursor = "pointer";
  resumoCell.dataset.processo = JSON.stringify(processo);

  // 🔹 Se houver um resumo, exibe os primeiros 50 caracteres
  if (ultimoResumo) {
    resumoCell.textContent = ultimoResumo.length > 50 ? ultimoResumo.substring(0, 50) + "..." : ultimoResumo;
    resumoCell.classList.add("clicavel"); // 🔹 Aplica a classe para usar o CSS correto
  } else {
    resumoCell.textContent = "-"; // Se não houver resumos, exibe um traço
    resumoCell.style.color = "black"; // 🔹 Mantém cor padrão para indicar que não há nada a ser clicado
    resumoCell.style.cursor = "default"; // Remove indicação de clique se não houver resumos
  }

  console.log(`✅ Célula de resumo criada para processo ${processo.numero}:`, resumoCell.textContent);


  // 🔹 O modal sempre será aberto, mesmo sem resumos
  resumoCell.addEventListener("click", () => {
    if (!processo || !processo.numero) {
      console.error("❌ ERRO: Processo indefinido ao clicar na célula de resumo.", processo);
      return;
    }

    // 🔹 Atualiza a variável global antes de abrir o modal
    window.currentProcesso = processo; 
    console.log(`🟢 Clicado na célula de resumo do processo ${processo.numero}`);

    openModalResumos(processo);
  });

  row.appendChild(resumoCell);

  return { row, numeroLink, btnNovoDespacho, resumoCell }; // 🔹 Agora retorna todas as variáveis necessárias
}


export function openModalTexto(text, title, link = null) {
  const modal = document.getElementById("modalGenerico");
  const modalTitulo = document.getElementById("modalTituloGenerico");
  const modalTexto = document.getElementById("modalTextoGenerico");
  const modalLink = document.getElementById("modalLinkGenerico");

  console.log(`🟢 Abrindo modal: ${title}`);

  // Define o título e o texto do modal
  modalTitulo.textContent = title;
  modalTexto.textContent = text || "Nenhum conteúdo disponível.";

  // Exibe o link se existir
  if (link) {
      modalLink.href = link;
      modalLink.style.display = "block";
  } else {
      modalLink.style.display = "none";
  }

  modal.style.display = "block";
}

// Fecha o modal ao clicar no "X"
document.getElementById("fecharModalGenerico").addEventListener("click", () => {
  console.log("🔴 Fechando modal genérico.");
  document.getElementById("modalGenerico").style.display = "none";
});

// Fecha o modal ao clicar fora dele
window.addEventListener("click", (event) => {
  const modal = document.getElementById("modalGenerico");
  if (event.target === modal) {
      console.log("🔴 Fechando modal genérico ao clicar fora.");
      modal.style.display = "none";
  }
});


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



//funções para manipular modais da coluna resumo
export function openModalResumos(processo) {
  if (!processo || !processo.numero) {
    console.error("❌ ERRO: Processo indefinido ao abrir modal de resumos.", processo);
    return;
  }

  console.log(`🟢 Abrindo modal de resumos para o processo ${processo.numero}`);

  // 🔹 NÃO alteramos `window.currentProcesso` aqui, apenas usamos o processo correto
  const modal = document.getElementById("modalResumos");
  const tabelaBody = document.querySelector("#tabelaResumos tbody");
  tabelaBody.innerHTML = ""; // Limpa a tabela antes de adicionar novos dados

  buscarResumos(processo.numero)
    .then(resumos => {
      console.log(`📜 Resumos recebidos para o processo ${processo.numero}:`, resumos);

      if (!resumos || resumos.length === 0) {
        console.warn(`⚠️ Nenhum resumo encontrado para o processo ${processo.numero}.`);
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 3;
        td.textContent = "Nenhum resumo encontrado.";
        td.style.textAlign = "center";
        tr.appendChild(td);
        tabelaBody.appendChild(tr);
        return;
      }

      resumos.forEach(resumo => {
        const tr = document.createElement("tr");

        const tdAssistente = document.createElement("td");
        tdAssistente.textContent = resumo.assistente || "Desconhecido";
        tr.appendChild(tdAssistente);

        const tdResumo = document.createElement("td");
        tdResumo.textContent = resumo.texto.length > 50 ? resumo.texto.substring(0, 50) + "..." : resumo.texto;
        tdResumo.classList.add("clicavel");
        tdResumo.addEventListener("click", () => openModalResumoDetalhado(resumo.texto));
        tr.appendChild(tdResumo);

        const tdData = document.createElement("td");
        tdData.textContent = resumo.data ? formatDate(resumo.data) : "Data desconhecida";
        tr.appendChild(tdData);

        tabelaBody.appendChild(tr);
      });
    })
    .catch(error => {
      console.error("❌ Erro ao buscar resumos:", error);

      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 3;
      td.textContent = "Erro ao carregar resumos.";
      td.style.color = "red";
      td.style.textAlign = "center";
      tr.appendChild(td);
      tabelaBody.appendChild(tr);
    });

  modal.style.display = "block";
}


export function openModalIncluirResumo(processo) {
  if (!processo || !processo.numero) {
    console.error("❌ ERRO: Processo indefinido ao tentar incluir um resumo.", processo);
    return;
  }

  console.log(`📌 Abrindo modal para incluir resumo no processo ${processo.numero}`);

  const modal = document.getElementById("modalIncluirResumo");
  const inputTextoResumo = document.getElementById("novoResumoTexto");
  const inputNomeAssistente = document.getElementById("nomeAssistente");
  const btnSalvarResumo = document.getElementById("btnSalvarResumo");

  // 🔹 Limpa os campos antes de abrir
  inputTextoResumo.value = "";
  inputNomeAssistente.value = "";

  // 🔹 Armazena o número do processo no botão para evitar que ele se perca
  btnSalvarResumo.dataset.numeroProcesso = processo.numero;
  console.log(`✅ Botão "Salvar Tudo" recebeu o número do processo: ${btnSalvarResumo.dataset.numeroProcesso}`);

  // 🔹 Adiciona evento para salvar resumo
  btnSalvarResumo.onclick = async () => {
    const texto = inputTextoResumo.value.trim();
    const assistente = inputNomeAssistente.value.trim();
    const numeroProcesso = btnSalvarResumo.dataset.numeroProcesso; // 🔹 Obtém o número correto do processo

    if (!texto || !assistente) {
      alert("Preencha todos os campos antes de salvar!");
      return;
    }

    console.log(`📨 Salvando novo resumo para o processo ${numeroProcesso}`);

    try {
      await salvarResumo(numeroProcesso, texto, assistente);
      alert("Resumo salvo com sucesso!");

      // 🔹 Atualiza a lista de resumos após salvar
      openModalResumos({ numero: numeroProcesso });

      modal.style.display = "none";
    } catch (error) {
      console.error("❌ Erro ao salvar resumo:", error);
      alert("Erro ao salvar resumo.");
    }
  };

  modal.style.display = "block";
}

export function openModalResumoDetalhado(texto) {
  console.log("🟢 Exibindo resumo detalhado");
  document.getElementById("textoResumoDetalhado").textContent = texto;
  document.getElementById("modalResumoDetalhado").style.display = "block";
}

// 🔹 Evento para fechar o modal "Incluir Novo Resumo" ao clicar no "X"
document.getElementById("fecharModalResumo").addEventListener("click", () => {
  closeModal("modalIncluirResumo");
});

// 🔹 Evento para fechar o modal "Resumo Detalhado" ao clicar no "X"
document.getElementById("fecharModalResumoDetalhado").addEventListener("click", () => {
  closeModal("modalResumoDetalhado");
});
