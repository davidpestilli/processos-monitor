// Importações do Firebase e Firestore
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCj0uSE-M0-DGVHPV-qCWIzplMCZI2UMjE",
  authDomain: "monitoramento-stf.firebaseapp.com",
  projectId: "monitoramento-stf",
  storageBucket: "monitoramento-stf.firebasestorage.app",
  messagingSenderId: "1049926033015",
  appId: "1:1049926033015:web:03703aaaa72c73362b7072",
  measurementId: "G-M24D4DS4M5"
};

// Inicializa o Firebase e o Firestore
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Função para salvar um processo no Firebase
async function salvarProcesso(processData) {
  try {
    await addDoc(collection(db, "processes"), processData);
    console.log(`Processo ${processData.processNumber} salvo com sucesso.`);
  } catch (error) {
    console.error(`Erro ao salvar processo ${processData.processNumber}:`, error);
  }
}

// Listener do formulário de upload e inserção manual
document.getElementById("uploadForm").addEventListener("submit", async function(event) {
  event.preventDefault();
  const fileInput = document.getElementById("csvFile");
  const manualInput = document.getElementById("processoManual");

  // Verifica se há um arquivo CSV selecionado
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
      const text = e.target.result;
      // Supondo que cada linha do CSV contenha apenas o número do processo
      const linhas = text.split("\n");
      for (const linha of linhas) {
        const processNumber = linha.trim();
        if (processNumber) {
          const processData = {
            processNumber,
            status: "Em trâmite",  // Classificação inicial conforme o fluxo
            createdAt: new Date().toISOString()
          };
          await salvarProcesso(processData);
        }
      }
    };

    reader.readAsText(file);
  } else if (manualInput.value.trim()) {
    // Se não houver arquivo, verifica a entrada manual
    const processNumber = manualInput.value.trim();
    const processData = {
      processNumber,
      status: "Em trâmite",
      createdAt: new Date().toISOString()
    };
    await salvarProcesso(processData);
  } else {
    console.log("Nenhum dado foi inserido.");
  }
});
