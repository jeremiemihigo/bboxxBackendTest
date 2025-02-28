const asyncLab = require("async");
const ModelDemande = require("../Models/Demande");
const dayjs = require("dayjs");
const Reclamation = require("../Models/Reclamation");
const modelRapport = require("../Models/Rapport");
const { ObjectId } = require("mongodb");
const moment = require("moment");

let periode = moment(new Date()).format("MM-YYYY");

const reponse = async (req, res, next) => {
  try {
    const {
      idDemande,
      codeClient,
      adresschange,
      codeCu,
      clientStatut,
      PayementStatut,
      nomDemandeur,
      consExpDays,
      nomClient,
      idZone,
      codeAgent,
      createdAt,
      demande,
      coordonnee,
      idShop,
      fonctionAgent,
      codeAgentDemandeur,
      _idDemande,
      nomAgentSave,
    } = req.body;
    if (
      !idDemande ||
      !codeAgent ||
      !codeClient ||
      !clientStatut ||
      adresschange === "" ||
      !PayementStatut ||
      !consExpDays ||
      !nomClient ||
      !idZone ||
      !demande ||
      !nomDemandeur ||
      !createdAt
    ) {
      return res.status(400).json("Veuillez renseigner les champs");
    }
    const dates = new Date().toISOString();
    const io = req.io;

    asyncLab.waterfall(
      [
        function (done) {
          modelRapport
            .findOne({
              "demande.lot": periode.toString(),
              codeclient: codeClient.trim(),
              "demandeur.fonction": fonctionAgent,
            })
            .lean()
            .then((doublon) => {
              if (doublon) {
                let doubleAgent =
                  doublon.demandeur.codeAgent === codeAgentDemandeur;
                if (doubleAgent) {
                  if (
                    new Date(doublon.demande.updatedAt).getDate() ===
                    new Date(createdAt).getDate()
                  ) {
                    done(null, "oneDay", doublon);
                  } else {
                    done(null, "followup", doublon);
                  }
                } else {
                  let double = {
                    precedent: doublon.idDemande,
                    agentCo: codeAgent,
                    present: idDemande,
                    type: "doublon",
                    message: `visite effectuée le ${dayjs(
                      doublon.demande.createdAt
                    ).format("DD/MM/YYYY")} par ${
                      doublon.demandeur.nom
                    } code : ${doublon.demandeur.codeAgent}`,
                    _idDemande,
                  };
                  io.emit("chat", { idDemande });
                  req.recherche = double;
                  next();
                }
              } else {
                done(null, "demande", doublon);
              }
            });
        },
        function (type, doublon, done) {
          if (type === "oneDay") {
            let double = {
              precedent: doublon.idDemande,
              present: idDemande,
              agentCo: codeAgent,
              type: "doublon",
              message: `Cette demande a déjà reçu une réponse`,
              _idDemande,
            };
            io.emit("chat", { idDemande });
            req.recherche = double;
            next();
          }
          if (type === "followup") {
            ModelDemande.findOneAndUpdate(
              { idDemande, valide: false },
              {
                $set: {
                  typeVisit: {
                    dateFollowup: doublon?.createdAt,
                    visiteFollowup: doublon.idDemande,
                  },
                  feedback: "followup",
                },
              }
            )
              .then((result) => {
                io.emit("chat", { idDemande });
                return res.status(200).json(idDemande);
              })
              .catch(function (err) {
                console.log(err);
              });
          }
          if (type === "demande") {
            done(null, "demande");
          }
        },

        function (demandes, done) {
          if (demandes === "demande") {
            modelRapport
              .create({
                idDemande,
                codeclient: codeClient,
                idShop,
                idZone,
                codeCu,
                clientStatut,
                PayementStatut,
                consExpDays,
                nomClient,
                codeAgent: codeAgent,
                dateSave: dates.split("T")[0],
                adresschange,
                agentSave: { nom: nomAgentSave },
                demandeur: {
                  nom: nomDemandeur,
                  codeAgent: codeAgentDemandeur,
                  fonction: fonctionAgent,
                },
                coordonnee,
                demande,
              })
              .then((response) => {
                if (response) {
                  done(null, response);
                } else {
                  done("Erreur d'enregistrement");
                }
              })
              .catch(function (err) {
                console.log(err);
                done("Erreur " + err);
              });
          }
        },
        function (response, done) {
          try {
            Reclamation.deleteMany({ code: _idDemande })
              .then((deleted) => {
                done(response);
              })
              .catch(function (err) {});
          } catch (error) {}
        },
      ],
      function (response) {
        if (response.codeclient) {
          io.emit("reponse", response);
          return res.status(200).json(idDemande);
        } else {
          return res.status(400).json("Error");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const OneReponse = async (req, res) => {
  try {
    const { id } = req.params;
    asyncLab.waterfall(
      [
        function (done) {
          modelRapport
            .find({ codeclient: id })
            .lean()
            .sort({ createdAt: -1 })
            .then((response) => {
              done(response);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ],
      function (visites) {
        return res.status(200).json(visites);
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const updateReponse = async (req, res) => {
  try {
    const { idReponse, data } = req.body;
    modelRapport
      .findOneAndUpdate(
        { _id: new ObjectId(idReponse), "demande.lot": periode },
        data,
        { new: true }
      )
      .then((response) => {
        if (response) {
          return res.status(200).json(response);
        } else {
          return res
            .status(201)
            .json("Cette visite n'est pas de ce mois en cours");
        }
      })
      .catch(function (err) {
        return res.status(201).json(err);
      });
  } catch (error) {}
};

const SupprimerReponse = async (req, res) => {
  try {
    const { id, message } = req.body;
    asyncLab.waterfall(
      [
        function (done) {
          ModelDemande.findOneAndUpdate(
            { idDemande: id, lot: periode },
            { $set: { valide: false, feedback: "chat" } },
            { new: true }
          )
            .then((demande) => {
              if (demande) {
                done(null, demande);
              } else {
                return res
                  .status(201)
                  .json("Cette demande n'est pas de ce mois en cours");
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (demande, done) {
          Reclamation.create({
            sender: "co",
            code: demande._id,
            message,
            codeAgent: req.user.codeAgent,
          })
            .then((message) => {
              if (message) {
                done(null, demande);
              } else {
                return res.status(201).json("Error");
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (demande, done) {
          modelRapport
            .findOneAndDelete({ idDemande: demande.idDemande })
            .then((result) => {
              done(result);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ],
      function (result) {
        if (result) {
          return res.status(200).json(result);
        } else {
          return res.status(201).json("Reponse introuvable");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
module.exports = { reponse, OneReponse, updateReponse, SupprimerReponse };
