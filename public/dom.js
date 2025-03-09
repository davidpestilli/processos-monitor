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
        td.colSpan = 4;
        td.textContent = "Nenhum resumo encontrado.";
        td.style.textAlign = "center";
        tr.appendChild(td);
        tabelaBody.appendChild(tr);
        return;
      }

      resumos.forEach(resumo => {
        const tr = document.createElement("tr");

        // 🔹 Adiciona o checkbox para seleção múltipla
        const tdCheckbox = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("resumo-checkbox");
        checkbox.dataset.processo = processo.numero;
        checkbox.dataset.texto = resumo.texto; // 🔹 Armazena o resumo no dataset para exclusão
        tdCheckbox.appendChild(checkbox);
        tr.appendChild(tdCheckbox);

        // 🔹 Assistente
        const tdAssistente = document.createElement("td");
        tdAssistente.textContent = resumo.assistente || "Desconhecido";
        tr.appendChild(tdAssistente);

        // 🔹 Resumo
        const tdResumo = document.createElement("td");
        tdResumo.textContent = resumo.texto.length > 50 ? resumo.texto.substring(0, 50) + "..." : resumo.texto;
        tdResumo.classList.add("clicavel");

        tdResumo.addEventListener("click", () => {
          console.log(`📜 Clicado no resumo do processo ${processo.numero}, abrindo modal detalhado.`);
          openModalResumoDetalhado(resumo.texto, processo); // 🔹 Passando corretamente o processo e o texto do resumo
        });
        
        tr.appendChild(tdResumo);

        // 🔹 Data
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
      td.colSpan = 4;
      td.textContent = "Erro ao carregar resumos.";
      td.style.color = "red";
      td.style.textAlign = "center";
      tr.appendChild(td);
      tabelaBody.appendChild(tr);
    });

  modal.style.display = "block";
}

export function openModalIncluirResumo(processo, textoExistente = "") {
  if (!processo || !processo.numero) {
    console.error("❌ ERRO: Processo indefinido ao tentar incluir um resumo.", processo);
    return;
  }

  console.log(`📌 Abrindo modal para incluir resumo no processo ${processo.numero}`);

  // Obtém os elementos do modal
  const modal = document.getElementById("modalIncluirResumo");
  const inputTextoResumo = document.getElementById("novoResumoTexto");
  const inputNomeAssistente = document.getElementById("nomeAssistente");
  const btnSalvarResumo = document.getElementById("btnSalvarResumo");
  const mensagemFeedback = document.getElementById("mensagemResumo");

  // 🔹 Preenche os campos (se for edição, mantém o texto existente)
  inputTextoResumo.value = textoExistente || "";
  inputNomeAssistente.value = "";
  mensagemFeedback.textContent = "";

  // 🔹 Armazena o número do processo no botão para referência
  btnSalvarResumo.dataset.numeroProcesso = processo.numero;
  console.log(`✅ Botão "Salvar" recebeu o número do processo: ${btnSalvarResumo.dataset.numeroProcesso}`);

  // 🔹 Define a função de clique para salvar o resumo
  btnSalvarResumo.onclick = async () => {
    const texto = inputTextoResumo.value.trim();
    const assistente = inputNomeAssistente.value.trim();
    const numeroProcesso = btnSalvarResumo.dataset.numeroProcesso; // Obtém o número correto do processo

    // Validação: impede o salvamento se algum campo estiver vazio
    if (!texto || !assistente) {
      mensagemFeedback.textContent = "⚠️ Preencha todos os campos antes de salvar!";
      mensagemFeedback.style.color = "red";
      console.warn("⚠️ Tentativa de salvar resumo com campos vazios.");
      return;
    }

    console.log(`📨 Enviando resumo para o processo ${numeroProcesso}...`);

    try {
      // Chama a API para salvar o resumo
      await salvarResumo(numeroProcesso, texto, assistente);

      // Exibe feedback de sucesso no modal
      mensagemFeedback.textContent = "✅ Resumo salvo com sucesso!";
      mensagemFeedback.style.color = "green";

      // 🔹 Aguarda um pequeno tempo antes de atualizar a célula na tabela principal
      setTimeout(() => {
        // 🔍 Seleciona todas as células de resumo
        const resumoCells = document.querySelectorAll("td.resumo-cell.clicavel");
        let resumoCellEncontrada = null;

        resumoCells.forEach(cell => {
          // 🔹 Extrai o conteúdo do atributo `data-processo`
          const dataProcesso = cell.getAttribute("data-processo");

          if (dataProcesso) {
            try {
              // 🔹 Converte a string JSON para um objeto JavaScript
              const processoObj = JSON.parse(dataProcesso.replace(/&quot;/g, '"'));

              // 🔹 Verifica se o número do processo corresponde ao esperado
              if (processoObj.numero === numeroProcesso) {
                resumoCellEncontrada = cell;
              }
            } catch (error) {
              console.error("❌ Erro ao converter `data-processo` para JSON:", error);
            }
          }
        });

        // 🔹 Atualiza a célula de resumo correta
        if (resumoCellEncontrada) {
          resumoCellEncontrada.textContent = texto.length > 50 ? texto.substring(0, 50) + "..." : texto;
          console.log(`✅ Célula de resumo atualizada na tabela principal para o processo ${numeroProcesso}`);
        } else {
          console.warn(`⚠️ A célula de resumo para o processo ${numeroProcesso} ainda não foi encontrada.`);
        }

      }, 500); // 🔹 Pequeno atraso para garantir que a célula foi renderizada antes da atualização

      // 🔹 Atualiza o objeto `processo` localmente para refletir o novo resumo
      processo.resumos = processo.resumos || [];
      processo.resumos.push({ texto, assistente, data: new Date() });

      console.log(`✅ Novo resumo adicionado localmente ao processo ${numeroProcesso}`);

      // 🔹 Fecha o modal após um pequeno delay para permitir que o usuário veja o feedback
      setTimeout(() => {
        modal.style.display = "none";
      }, 1000);

      // 🔹 Atualiza o modal de Histórico de Resumos para refletir a nova entrada
      openModalResumos(processo);

    } catch (error) {
      console.error("❌ Erro ao salvar resumo:", error);
      mensagemFeedback.textContent = "❌ Erro ao salvar resumo.";
      mensagemFeedback.style.color = "red";
    }
  };

  // 🔹 Exibe o modal com uma pequena animação
  modal.style.display = "block";
  modal.classList.add("modal-aberto");
}


export function openModalResumoDetalhado(texto, processo) {
  console.log("🟢 Exibindo resumo detalhado");

  document.getElementById("textoResumoDetalhado").textContent = texto;
  document.getElementById("modalResumoDetalhado").style.display = "block";

  // Verifica se o botão "Editar" existe no DOM
  const btnEditarResumo = document.getElementById("btnEditarResumo");

  if (!btnEditarResumo) {
    console.error("❌ ERRO: Botão 'Editar' não encontrado no DOM.");
    return;
  }
  // Garantindo que o evento seja redefinido corretamente
  btnEditarResumo.onclick = () => {
    console.log(`🟢 Botão 'Editar' clicado. Chamando openModalIncluirResumo com texto: "${texto}"`);
    openModalIncluirResumo(processo, texto); // 🔹 Certifique-se de que "texto" está sendo passado
  };
}


// 🔹 Evento para fechar o modal "Incluir Novo Resumo" ao clicar no "X"
document.getElementById("fecharModalResumo").addEventListener("click", () => {
  closeModal("modalIncluirResumo");
});

// 🔹 Evento para fechar o modal "Resumo Detalhado" ao clicar no "X"
document.getElementById("fecharModalResumoDetalhado").addEventListener("click", () => {
  closeModal("modalResumoDetalhado");
});


//Função para Excluir Resumos Selecionados
export function excluirResumosSelecionados() {
  console.log("🟢 Iniciando exclusão de resumos selecionados...");

  // Seleciona todos os checkboxes marcados na tabela de resumos
  const checkboxes = document.querySelectorAll(".resumo-checkbox:checked");

   // Se nenhum resumo foi selecionado, exibe um alerta e encerra a função
  if (checkboxes.length === 0) {
    console.warn("⚠️ Nenhum resumo foi selecionado para exclusão.");
    alert("Nenhum resumo selecionado.");
    return;
  }

  // Confirma com o usuário antes de excluir os resumos selecionados
  if (!confirm(`Tem certeza que deseja excluir ${checkboxes.length} resumos?`)) {
    return;
  }

  // Mapeia os resumos selecionados para extrair os dados necessários (número do processo e texto)
  const resumosParaExcluir = Array.from(checkboxes).map(cb => ({
    numero: cb.dataset.processo,
    texto: cb.dataset.texto
  }));

  console.log(`📌 Resumos a serem excluídos:`, resumosParaExcluir);


  // Envia uma requisição POST para excluir os resumos no backend
  fetch("/processos/excluir-resumos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumos: resumosParaExcluir })
  })

  .then(response => {
    console.log("🔄 Enviando solicitação de exclusão para o servidor...");
    if (!response.ok) {
      throw new Error("Erro ao excluir resumos.");
    }
    return response.json();
  })

  .then(() => {
    console.log("✅ Resumos excluídos com sucesso!");
    alert("Resumos excluídos com sucesso!");

    // Atualiza a lista de resumos no modal se houver um processo em exibição
    if (window.currentProcesso) {
      openModalResumos(window.currentProcesso); // 🔹 Atualiza a tabela após exclusão
    }
  })

  .catch(error => {
    console.error("❌ Erro ao excluir resumos:", error);
    alert("Erro ao excluir resumos.");
  });
}

//Event Listener ao Botão de Exclusão
document.getElementById("btnExcluirSelecionadosResumos").addEventListener("click", excluirResumosSelecionados);

document.getElementById("selecionarTodosResumos").addEventListener("change", function () {
  console.log(`🔄 Checkbox "Selecionar Todos" alterado. Estado: ${this.checked}`);

  // Seleciona todos os checkboxes de resumos
  const checkboxes = document.querySelectorAll(".resumo-checkbox");
  
  checkboxes.forEach(cb => {
    cb.checked = this.checked; // Define o estado de cada checkbox com base no principal
  });

  console.log(`✅ Todos os checkboxes foram ${this.checked ? "marcados" : "desmarcados"}.`);
});
