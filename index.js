// Importation des modules
const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Initialisation d'Express
const app = express();

// Middlewares
app.use(cors());
// app.use(bodyParser.urlencoded());
// app.use(bodyParser.json());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

// Connexion à la base de données
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

// Fonction pour ajouter un nouvel utilisateur
const addNewUser = (codeAgent, nom, socketId, backOffice) => {
  const userIndex = onlineuser.findIndex(
    (user) => user.codeAgent === codeAgent
  );
  if (userIndex === -1) {
    onlineuser.push({ codeAgent, nom, backOffice, socketId });
  } else {
    onlineuser[userIndex] = { codeAgent, nom, backOffice, socketId };
  }
};

// Fonction pour retirer un utilisateur
const removeUser = (socketId) => {
  onlineuser = onlineuser.filter((user) => user.socketId !== socketId);
};

// Socket.io - Événement de connexion
io.on("connection", (socket) => {
  socket.on("newUser", (data) => {
    const { codeAgent, nom, backOffice } = data;
    addNewUser(codeAgent, nom, socket.id, backOffice);
    io.emit("userConnected", onlineuser);
  });

  // Gestion de la déconnexion
  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("userConnected", onlineuser);
  });
});

// Middleware pour injecter `io` et `users` dans les requêtes
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
app.use("/bboxx/terrain", require("./Routes/Terrain"));
app.use("/bboxx/dashboard", require("./Routes/dash_dt"));
// app.use("/bboxx/portofolio", require("./Routes/Portofolio"));

// Route spécifique pour récupérer des données de `Zone`
const modelZone = require("./Models/Zone");
app.get("/acceuil/log", (req, res) => {
  modelZone
    .find({})
    .then((response) => {
      return res.status(200).json(response.reverse());
    })
    .catch((err) => {
      return res.status(200).json(err);
    });
});

// Route d'accueil
app.get("/", (req, res) => {
  return res.status(200).json("Done");
});
// Démarrage du serveur
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
