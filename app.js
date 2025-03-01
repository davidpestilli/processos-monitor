// Importações do Firebase utilizando a CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged  
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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

// Evento para registro do usuário
document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Usuário registrado com sucesso:", userCredential.user);
      // Opcional: exibir mensagem de sucesso ou ocultar o formulário de registro
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      // Opcional: exibir mensagem de erro para o usuário
    }
  });


// Inicializa o Firebase e o Firestore
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
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
        // Divide o texto em linhas (considerando \n ou \r\n)
        const linhas = text.split(/\r?\n/);
        for (const linha of linhas) {
          // Divide por vírgula ou ponto e vírgula
          const valores = linha.split(/[;,]+/);
          for (const valor of valores) {
            const processNumber = valor.trim();
            if (processNumber) {
              const processData = {
                processNumber,
                status: "Em trâmite",
                createdAt: new Date().toISOString()
              };
              await salvarProcesso(processData);
            }
          }
        }
        // Limpa o campo de arquivo após o processamento
        fileInput.value = "";
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
      // Limpa o campo de entrada manual após o envio
      manualInput.value = "";
    } else {
      console.log("Nenhum dado foi inserido.");
    }
  });
  

// Lógica para realizar login com e-mail e senha
document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Login bem-sucedido
        console.log("Usuário logado:", userCredential.user);
        // Oculta a mensagem de erro, se existir
        document.getElementById("loginError").textContent = "";        
        // Aqui você pode ocultar o formulário de login e exibir a interface principal
      })
      .catch((error) => {
        console.error("Erro de login:", error);
        // Exiba uma mensagem de erro para o usuário
        document.getElementById("loginError").textContent = "Login ou senha inválidos. Por favor, tente novamente.";
      });
  });
  
  // Monitorar alterações no estado de autenticação
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Usuário autenticado:", user.email);
      // Permite o acesso às funções que interagem com o Firestore
    } else {
      console.log("Nenhum usuário autenticado.");
      // Redirecione para o login ou bloqueie o acesso às funções protegidas
    }
  });
  