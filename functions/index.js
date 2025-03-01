const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.getProcessosPendentes = onRequest(async (req, res) => {
  try {
    const snapshot = await db
        .collection("processos")
        .where("status", "==", "Em Trâmite")
        .get();

    const processos = [];
    snapshot.forEach((doc) => {
      processos.push({id: doc.id, ...doc.data()});
    });

    res.status(200).json(processos);
  } catch (error) {
    console.error("Erro ao buscar processos:", error);
    res.status(500).json({error: error.toString()});
  }
});

