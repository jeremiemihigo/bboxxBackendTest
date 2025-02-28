const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const http = require("http");
require("dotenv").config();
// const bodyParser = require("body-parser");

// Middlewares
app.use(cors());
// app.use(bodyParser.urlencoded());
// app.use(bodyParser.json());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

// DB connection

// Création du serveur HTTP
const server = http.createServer(app);
// Initialisation de Socket.io avec CORS activé

// Routes
server.get("/", (req, res) => {
  return res.status(200).json("Done");
});
// Démarrage du serveur
const port = process.env.PORT || 60000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
