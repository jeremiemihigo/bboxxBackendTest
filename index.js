const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

// DB connection
const connectDB = require("./config/Connection");
connectDB();
// Création du serveur HTTP
const server = http.createServer(app);
// Initialisation de Socket.io avec CORS activé
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});
// Variables pour stocker les utilisateurs en ligne
let onlineuser = [];
let onlineuserTerrain = [];
// Fonction pour ajouter un nouvel utilisateur
const addNewUser = (codeAgent, nom, socketId, fonction, backOffice) => {
  if (fonction === "admin") {
    const userIndex = onlineuser.findIndex(
      (user) => user.codeAgent === codeAgent
    );
    if (userIndex === -1) {
      onlineuser.push({
        codeAgent,
        nom,
        backOffice,
        socketId,
      });
    } else {
      onlineuser[userIndex] = { codeAgent, nom, backOffice, socketId };
    }
  } else {
    const userIndex = onlineuserTerrain.findIndex(
      (user) => user.codeAgent === codeAgent
    );
    if (userIndex === -1) {
      onlineuserTerrain.push({
        codeAgent,
        socketId,
      });
    } else {
      onlineuserTerrain[userIndex] = { codeAgent, socketId };
    }
  }
};

// Fonction pour retirer un utilisateur
const removeUser = (socketId) => {
  onlineuser = onlineuser.filter((user) => user.socketId !== socketId);
  onlineuserTerrain = onlineuserTerrain.filter(
    (user) => user.socketId !== socketId
  );
};

// Socket.io événement de connexion
io.on("connection", (socket) => {
  socket.on("newUser", (data) => {
    const { codeAgent, nom, fonction, backOffice } = data;
    addNewUser(codeAgent, nom, socket.id, fonction, backOffice);
    io.emit("userConnected", onlineuser);
  });

  // Gestion de la déconnexion
  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("userConnected", onlineuser);
  });
});

// Middleware pour ajouter `io` et `users` à chaque requête
app.use((req, res, next) => {
  req.io = io;
  req.users = onlineuser;
  next();
});

// Routes
app.use("/bboxx/support", require("./Routes/Route"));
app.use("/issue", require("./Routes/Issue"));
app.use("/dt", require("./Routes/DefaultTracker"));
app.use("/bboxx/image", express.static(path.resolve(__dirname, "Images")));
app.use("/bboxx/file", express.static(path.resolve(__dirname, "Fichiers")));
app.use("/audio", require("./Routes/testaudio"));

// Route de test
const ModelClient = require("./Models/Rapport");
const ModelZone = require("./Models/Zone");
const ModelShop = require("./Models/Shop");
const ModelAgent = require("./Models/Agent");

app.post("/insert", async (req, res) => {
  const { data } = req.body;
  try {
    let table = [];
    for (let i = 0; i < data.length; i++) {
      table.push({
        codeclient: data[i].codeclient,
        codeCu: data[i].codeCu,
        clientStatut: data[i].clientStatut,
        PayementStatut: data[i].PayementStatut,
        consExpDays: data[i].consExpDays,
        idDemande: data[i].idDemande,
        dateSave: data[i].dateSave.id,
        codeAgent: data[i].codeAgent,
        nomClient: data[i].nomClient,
        idZone: data[i].idZone,
        idShop: data[i].idShop,
        adresschange: data[i].adresschange,
        agentSave: data[i].agentSave,
        demandeur: data[i].demandeur,
        demande: {
          typeImage: data[i].demande.typeImage,
          numero: data[i].demande.numero,
          commune: data[i].demande.commune,
          updatedAt: data[i].demande.updatedAt.id,
          statut: data[i].demande.statut,
          sector: data[i].demande.sector,
          lot: data[i].demande.lot,
          cell: data[i].demande.cell,
          reference: data[i].demande.reference,
          sat: data[i].demande.sat,
          raison: data[i].demande.raison,
          jours: data[i].demande.jours,
          file: data[i].demande.file,
        },
        coordonnee: data[i].coordonnee,
        createdAt: data[i].createdAt.id,
        updatedAt: data[i].updatedAt.id,
      });
    }
    // Multiple documents insert
    ModelClient.insertMany(table)
      .then((result) => {
        return res.status(200).json({ success: result });
      })
      .catch(function (err) {
        return res.status(200).json({ error: err });
      });
  } catch (error) {
    return res.status(200).json({ error });
  }
});
app.post("/insert_zone", async (req, res) => {
  const { data } = req.body;
  try {
    let table = [];
    for (let i = 0; i < data.length; i++) {
      table.push({
        idZone: data[i].idZone,
        denomination: data[i].denomination,
        id: i,
      });
    }
    // Multiple documents insert
    ModelZone.insertMany(table)
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
});
app.post("/insert_shop", async (req, res) => {
  const { data } = req.body;
  try {
    let table = [];
    for (let i = 0; i < data.length; i++) {
      table.push({
        shop: data[i].shop,
        adresse: data[i].adresse,
        idShop: data[i].idShop,
        idZone: data[i].idZone,
        id: i,
      });
    }
    // Multiple documents insert
    ModelShop.insertMany(table)
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
});
app.post("/insert_agent", async (req, res) => {
  const { data } = req.body;
  try {
    let table = [];
    for (let i = 0; i < data.length; i++) {
      table.push({
        nom: data[i].nom,
        codeAgent: data[i].codeAgent,
        codeZone: data[i].codeZone,
        fonction: data[i].fonction,
        idShop: data[i].idShop,
        telephone: data[i].telephone,
        active: data[i].active,
        id: i,
        first: data[i].first,
        password: data[i].password,
      });
    }
    // Multiple documents insert
    ModelAgent.insertMany(table)
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
});

// Démarrage du serveur
const port = process.env.PORT || 60000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
