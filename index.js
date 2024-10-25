const express = require("express");
const app = express();
//const path = require("path");
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
const Routes = require("./Routes/Route");
app.use("/bboxx/support", Routes);
// app.use("/admin/rh", require("./Routes/RessourceH"));
// app.use("/issue", require("./Routes/Issue"));
// app.use("/servey", require("./Routes/servey"));
// app.use("/bboxx/image", express.static(path.resolve(__dirname, "Images")));
// app.use("/bboxx/file", express.static(path.resolve(__dirname, "")));

// Route de test
app.get("/", (req, res) => {
  return res.status(200).json({
    nom: "PRINCE",
    age: 10,
  });
});

app.get("/lien", (req, res) => {
  return res.status(200).json({
    nom: "PRINCE DEUX",
    age: 20,
  });
});

// Démarrage du serveur
const port = process.env.PORT || 60000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
