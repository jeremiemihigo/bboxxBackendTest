const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

const bodyParser = require("body-parser");
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

const { PeriodeDemande } = require("./Controllers/Parametre");

const connectDB = require("./config/Connection");

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

require("dotenv").config();
connectDB();
app.use(PeriodeDemande);

let onlineuser = [];
let onlineuserTerrain = [];

const addNewUser = (codeAgent, nom, socketId, fonction) => {
  if (fonction === "admin") {
    if (
      onlineuser.filter((user) => user.codeAgent === codeAgent).length === 0
    ) {
      onlineuser.push({
        codeAgent,
        nom,
        socketId,
      });
    } else {
      const agents = onlineuser.filter((x) => x.codeAgent !== codeAgent);
      agents.push({
        codeAgent,
        nom,
        socketId,
      });
    }
  } else {
    if (
      onlineuserTerrain.filter((user) => user.codeAgent === codeAgent)
        .length === 0
    ) {
      onlineuserTerrain.push({
        codeAgent,
        socketId,
      });
    } else {
      const agents = onlineuserTerrain.filter((x) => x.codeAgent !== codeAgent);
      agents.push({
        codeAgent,
        socketId,
      });
    }
  }
};
const removeUser = (socketId) => {
  if (onlineuser.length > 0) {
    onlineuser = onlineuser.filter((user) => user.socketId !== socketId);
  }
};

io.on("connection", (socket) => {
  socket.on("newUser", (donner) => {
    const { codeAgent, nom, fonction } = donner;
    addNewUser(codeAgent, nom, socket.id, fonction);
    io.emit("userConnected", onlineuser);
  });
  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("userConnected", onlineuser);
  });
});

app.use((req, res, next) => {
  req.io = io;
  req.users = onlineuser;
  return next();
});

app.use("/bboxx/support", require("./Routes/Route"));
app.use("/admin/conge", require("./Routes/Conge"));
app.use("/issue", require("./Routes/Issue"));
app.use("/bboxx/image", express.static(path.resolve(__dirname, "Images")));
app.use("/bboxx/file", express.static(path.resolve(__dirname, "Fichiers")));

const fs = require("fs");
app.post("/deleteImage", (req, res) => {
  try {
    const { demandes } = req.body;
    for (let i = 0; i < demandes.length; i++) {
      const pathdelete = `./Images/${demandes[i].file}`;
      fs.unlink(pathdelete, (err) => {
        console.log(err);
      });
    }
  } catch (error) {
    console.log(error);
  }
});
//Start server
const port = process.env.PORT || 40002;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// // Socket.IO
