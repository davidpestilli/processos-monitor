// server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProcessosRouter } from './routes/processos.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Rota raiz para servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configuração do MongoDB
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017";
const dbName = "processos_db";
let db;

// Conectar ao MongoDB e, em seguida, montar as rotas
MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    console.log("✅ Conectado ao MongoDB");
    db = client.db(dbName);
    // Monta as rotas relacionadas aos processos
    app.use('/processos', createProcessosRouter(db));
    
    // Inicia o servidor
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch(error => {
    console.error("❌ Erro ao conectar ao MongoDB:", error);
  });
