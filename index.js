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

let onlineuser = [];
let onlineuserTerrain = [];

const addNewUser = (codeAgent, nom, socketId, fonction, backoffice) => {
  if (fonction === "admin") {
    if (
      onlineuser.filter((user) => user.codeAgent === codeAgent).length === 0
    ) {
      onlineuser.push({
        codeAgent,
        nom,
        backoffice,
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
    const { codeAgent, nom, fonction, backOffice } = donner;
    addNewUser(codeAgent, nom, socket.id, fonction, backOffice);
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
app.use("/admin/rh", require("./Routes/RessourceH"));
app.use("/issue", require("./Routes/Issue"));
app.use("/servey", require("./Routes/servey"));
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

// const modelRapport = require("./Models/Rapport");
// const AsyncLab = require("async");

// app.post("/arranger", (req, res) => {
//   try {
//     AsyncLab.waterfall([
//       function (done) {
//         modelRapport
//           .aggregate([
//             { $match: { "demandeur.codeAgent": "b.nadine" } },
//             {
//               $lookup: {
//                 from: "agents",
//                 localField: "demandeur.nom",
//                 foreignField: "nom",
//                 as: "agent",
//               },
//             },
//             { $unwind: "$agent" },
//           ])
//           .then((result) => {
//             done(null, result);
//           });
//       },
//       function (result, done) {
//         for (let i = 0; i < result.length; i++) {
//           modelRapport
//             .findByIdAndUpdate(result[i]._id, {
//               $set: {
//                 "demandeur.codeAgent": result[i].agent.codeAgent,
//                 updatedAt: result[i].updatedAt,
//               },
//             })
//             .then((response) => {
//               console.log(response);
//             });
//           console.log(i);
//         }
//       },
//     ]);
//   } catch (error) {
//     console.log(error);
//   }
// });

// // Socket.IO
