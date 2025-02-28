const asyncLab = require("async");
const modelReclamation = require("../Models/Reclamation");
const modelDemande = require("../Models/Demande");
const { ObjectId } = require("mongodb");
const moment = require("moment");

let periode = moment(new Date()).format("MM-YYYY");

const Reclamation = async (req, res) => {
  try {
    const { _id, message, idDemande, sender, codeAgent } = req.body;
    if (!_id || !message || !sender || !codeAgent) {
      return res.status(201).json("Error");
    }
    const io = req.io;
    modelReclamation
      .create({
        message,
        codeAgent,
        sender,
        code: new ObjectId(_id),
      })
      .then((response) => {
        if (response) {
          io.emit("chat", { idDemande });
          return res.status(200).json("Done");
        }
      })
      .catch(function (errr) {
        if (errr) {
          return res.status(201).json("Try again");
        }
      });
  } catch (error) {
    console.log(error);
  }
};

const demandeIncorrect = async (req, res) => {
  try {
    asyncLab.waterfall(
      [
        function (done) {
          modelDemande
            .aggregate([
              {
                $match: {
                  lot: periode,
                  valide: false,
                  feedback: "chat",
                },
              },
              {
                $lookup: {
                  from: "conversations",
                  localField: "_id",
                  foreignField: "code",
                  as: "conversation",
                },
              },
              {
                $lookup: {
                  from: "agents",
                  localField: "codeAgent",
                  foreignField: "codeAgent",
                  as: "agent",
                },
              },
              {
                $unwind: "$agent",
              },
              {
                $lookup: {
                  from: "shops",
                  localField: "agent.idShop",
                  foreignField: "idShop",
                  as: "shopAgent",
                },
              },
            ])
            .then((result) => {
              done(result);
            });
        },
      ],
      function (result) {
        try {
          if (result) {
            return res.status(200).json(result);
          } else {
            return res.status(201).json("Erreur");
          }
        } catch (error) {}
      }
    );
  } catch (error) {
    console.log(error);
  }
};
module.exports = { Reclamation, demandeIncorrect };
