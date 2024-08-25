const asyncLab = require("async");
const modelReclamation = require("../Models/Reclamation");
const modelPeriode = require("../Models/Periode");
const modelDemande = require("../Models/Demande");
const { ObjectId } = require("mongodb");

module.exports = {
  Reclamation: (req, res) => {
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
  },
  ReadMessage: (req, res) => {
    try {
      const recherche = req.recherche;
      const { codeAgent } = req.params;
      let match = recherche
        ? { $match: { _id: recherche } }
        : { $match: { codeAgent } };

      modelReclamation
        .aggregate([
          match,
          {
            $lookup: {
              from: "demandes",
              localField: "code",
              foreignField: "_id",
              as: "demandeId",
            },
          },
          {
            $lookup: {
              from: "reponses",
              localField: "code",
              foreignField: "_id",
              as: "reponseId",
            },
          },
        ])
        .then((response) => {
          return res.status(200).json(response);
        });
    } catch (error) {
      console.log(error);
    }
  },
  DeleteReclamation: (req, res) => {
    try {
      const { id } = req.params;
      modelReclamation
        .findByIdAndRemove(id)
        .then((response) => {
          if (response) {
            return res.status(200).json(id);
          } else {
            return res.status(201).json("");
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  demandeIncorrect: (req, res) => {
    try {
      asyncLab.waterfall(
        [
          function (done) {
            modelPeriode
              .findOne({})
              .then((response) => {
                if (response) {
                  done(null, response);
                } else {
                  return res.status(201).json("Erreur");
                }
              })
              .catch(function (err) {
                return res.status(201).json("Erreur " + err);
              });
          },
          function (periode, done) {
            modelDemande
              .aggregate([
                {
                  $match: {
                    lot: periode.periode,
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
            if (result.length > 0) {
              return res.status(200).json(result.reverse());
            } else {
              return res.status(201).json("Erreur");
            }
          } catch (error) {}
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
};
