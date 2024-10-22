const modelDemande = require("../Models/Demande");
const modelAgentAdmin = require("../Models/Agent");
const asyncLab = require("async");
const { generateNumber } = require("../Static/Static_Function");
const { ObjectId } = require("mongodb");
const modelRapport = require("../Models/Rapport");
const fs = require("fs");
const sharp = require("sharp");
const _ = require("lodash");
const moment = require("moment");
const ModelCorbeille = require("../Models/Corbeille");

module.exports = {
  demande: (req, res) => {
    try {
      const {
        codeclient,
        typeImage,
        codeAgent,
        jours,
        codeZone,
        commune,
        numero,
        latitude, // si la photo est prise dans l'appli ce champs est obligatoire sinon il n'est pas obligatoire
        altitude, // si la photo est prise dans l'appli ce champs est obligatoire sinon il n'est pas obligatoire
        longitude, // si la photo est prise dans l'appli ce champs est obligatoire sinon il n'est pas obligatoire
        statut,
        raison,
        sector, //placeholder = Sector/constituency
        cell, //placeholder = Cell/Ward
        reference, //placeholder = Reference
        sat, //placeholder = SAT
      } = req.body;
      const { filename } = req.file;
      let annee = new Date().getFullYear().toString();

      const idDemande = new Date().getTime();
      if (
        !codeAgent ||
        !codeZone ||
        !statut ||
        !commune ||
        !sector ||
        !cell ||
        !reference ||
        !sat
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      if (statut === "eteint" && raison === "undefined") {
        return res
          .status(201)
          .json("Veuillez renseigner la raison de non payement");
      }
      const periode = moment(new Date()).format("MM-YYYY");
      const io = req.io;
      asyncLab.waterfall(
        [
          function (done) {
            modelAgentAdmin
              .findOne({ codeAgent, active: true })
              .lean()
              .then((agentFound) => {
                if (agentFound) {
                  done(null, agentFound);
                } else {
                  return res.status(201).json("Agent introuvable");
                }
              })
              .catch(function (err) {
                return res.status(201).json("Erreur");
              });
          },

          function (agent, done) {
            modelDemande
              .create({
                codeAgent: agent.codeAgent,
                codeZone,
                typeImage,
                coordonnes: { latitude, altitude, longitude },
                statut,
                raison: raison === "undefined" ? "" : raison,
                codeclient,
                lot: periode,
                idDemande,
                jours,
                sector,
                cell,
                reference,
                idShop: ["PO", "ZBM"].includes(agent.fonction)
                  ? ""
                  : agent.idShop,
                sat,
                file: filename,
                commune,
                numero,
              })
              .then((demande) => {
                if (demande) {
                  done(null, demande);
                } else {
                  return res
                    .status(201)
                    .json("Erreur d'enregistrement de la demande");
                }
              })
              .catch(function (err) {
                if (err.message) {
                  return res.status(201).json("" + err.message);
                } else {
                  return res.status(201).json("Erreur");
                }
              });
          },
          //compress image
          function (demande, done) {
            const path = `ImagesController/${demande.file}`;
            const pathdelete = `./ImagesController/${demande.file}`;

            sharp(path)
              .png({ quality: 30 })
              .toFile(`./Images/${demande.file}`)
              .then((result) => {
                fs.unlink(pathdelete, (err) => {
                  console.log(err);
                });
                done(demande);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          //delete Image
        ],
        function (demande) {
          io.emit("demande", demande);
          return res.status(200).json(demande);
        }
      );
    } catch (error) {
      console.log(error);
      return res.status(201).json("Erreur");
    }
  },
  DemandeAttente: (req, res) => {
    try {
      const { id, valide } = req.params;
      let value = valide === "1" ? true : false;

      modelDemande
        .aggregate([
          { $match: { codeAgent: id, valide: value } },
          {
            $lookup: {
              from: "agents",
              localField: "codeAgent",
              foreignField: "codeAgent",
              as: "agent",
            },
          },
          {
            $lookup: {
              from: "zones",
              localField: "codeZone",
              foreignField: "idZone",
              as: "zone",
            },
          },
          { $unwind: "$agent" },
          { $unwind: "$zone" },
        ])
        .then((response) => {
          return res.status(200).json(response);
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  ToutesDemande: (req, res) => {
    const periode = moment(new Date()).format("MM-YYYY");
    try {
      asyncLab.waterfall([
        function (done) {
          modelRapport
            .aggregate([
              { $match: { "demande.lot": periode } },
              {
                $group: {
                  _id: "$agentSave.nom",
                  nombre: { $sum: 1 },
                },
              },
              { $sort: { nombre: -1 } },
            ])
            .limit(5)
            .then((response) => {
              return res.status(200).json(response);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  },
  ToutesDemandeAgent: (req, res) => {
    try {
      const { id } = req.params;
      modelDemande
        .aggregate([
          { $match: { codeAgent: id } },
          {
            $lookup: {
              from: "reponses",
              localField: "idDemande",
              foreignField: "idDemande",
              as: "reponse",
            },
          },
          {
            $lookup: {
              from: "reclamation",
              localField: "idDemande",
              foreignField: "idDemande",
              as: "conversation",
            },
          },
        ])
        .then((response) => {
          return res.status(200).json(response);
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  lectureDemandeBd: (req, res) => {
    try {
      const { data, debut, fin } = req.body;
      let match = {
        $match: data,
      };
      const finDate = new Date(fin);
      finDate.setDate(finDate.getDate() + 1);
      const { nom } = req.user;

      asyncLab.waterfall(
        [
          function (done) {
            ModelCorbeille.create({
              name: nom,
              date: new Date().toISOString().split("T")[0],
              texte: `Statistique allant du ${debut} au ${fin}`,
            })
              .then((corbeille) => {
                done(null, corbeille);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (corbeille, done) {
            modelDemande
              .aggregate([
                match,
                {
                  $match: {
                    createdAt: {
                      $gte: new Date(debut),
                      $lte: finDate,
                    },
                  },
                },
                {
                  $lookup: {
                    from: "rapports",
                    localField: "idDemande",
                    foreignField: "idDemande",
                    as: "reponse",
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
                  $lookup: {
                    from: "zones",
                    localField: "codeZone",
                    foreignField: "idZone",
                    as: "zone",
                  },
                },
                {
                  $unwind: "$agent",
                },
                {
                  $unwind: "$zone",
                },
              ])
              .then((response) => {
                done(response);
              });
          },
        ],
        function (response) {
          if (response) {
            return res.status(200).json(response.reverse());
          } else {
            return;
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  lectureDemandeMobile: (req, res) => {
    try {
      const { lot, codeAgent } = req.params;
      let match = {
        $match: { lot, codeAgent },
      };
      modelDemande
        .aggregate([
          match,
          {
            $lookup: {
              from: "reponses",
              localField: "idDemande",
              foreignField: "idDemande",
              as: "reponse",
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
        ])
        .then((response) => {
          if (response) {
            return res.status(200).json(response.reverse());
          }
        });
    } catch (error) {
      console.log(error);
    }
  },
  ToutesDemandeAttente: (req, res) => {
    try {
      const { limit } = req.params;
      const periode = moment(new Date()).format("MM-YYYY");
      asyncLab.waterfall(
        [
          function (done) {
            modelDemande
              .aggregate([
                {
                  $match: {
                    valide: false,
                    lot: periode,
                    feedback: "new",
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
                { $limit: parseInt(limit) },
              ])
              .then((response) => {
                if (response) {
                  done(response);
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
        ],
        function (result) {
          try {
            return res.status(200).json(result);
          } catch (error) {}
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  updateDemandeAgent: (req, res) => {
    try {
      const {
        codeclient,
        commune,
        numero,
        latitude, // si la photo est prise dans l'appli ce champs est obligatoire sinon il n'est pas obligatoire
        altitude, // si la photo est prise dans l'appli ce champs est obligatoire sinon il n'est pas obligatoire
        longitude, // si la photo est prise dans l'appli ce champs est obligatoire sinon il n'est pas obligatoire
        statut,
        raison,
        sector, //placeholder = Sector/constituency
        cell, //placeholder = Cell/Ward
        reference, //placeholder = Reference
        sat,
        id, //placeholder = SAT
      } = req.body;
      asyncLab.waterfall(
        [
          function (done) {
            modelDemande
              .findById(id)
              .then((demande) => {
                if (demande) {
                  done(null, demande);
                } else {
                  return res.status(201).json("Visite introuvable");
                }
              })
              .catch(function (err) {
                return res.status(201).json("Erreur : " + err);
              });
          },
          function (demande, done) {
            modelDemande
              .findByIdAndUpdate(
                id,
                {
                  coordonnes: { latitude, altitude, longitude },
                  statut,
                  raison,
                  codeclient,
                  sector,
                  cell,
                  reference,
                  feedback: "new",
                  sat,
                  commune,
                  numero,
                },
                { new: true }
              )
              .then((response) => {
                done(response);
              })
              .catch(function (err) {
                console.log(err);
                return res.status(201).json("Erreur 3");
              });
          },
        ],
        function (result) {
          if (result) {
            return res.status(200).json(result);
          } else {
            return res.status(201).json("Erreur");
          }
        }
      );

      // const { filename } = req.file
    } catch (error) {
      console.log(error);
    }
  },
  updateDemandeAgentFile: (req, res, next) => {
    try {
      const {
        codeclient,
        commune,
        numero,
        latitude, // si la photo est prise dans l'appli ce champs est obligatoire sinon il n'est pas obligatoire
        altitude, // si la photo est prise dans l'appli ce champs est obligatoire sinon il n'est pas obligatoire
        longitude, // si la photo est prise dans l'appli ce champs est obligatoire sinon il n'est pas obligatoire
        statut,
        raison,
        sector, //placeholder = Sector/constituency
        cell, //placeholder = Cell/Ward
        reference, //placeholder = Reference
        sat,
        id, //placeholder = SAT
      } = req.body;
      const { filename } = req.file;
      asyncLab.waterfall(
        [
          function (done) {
            modelDemande
              .findOne({ _id: new ObjectId(id), valide: false })
              .then((demande) => {
                if (demande) {
                  done(null, demande);
                } else {
                  return res.status(201).json("Erreur 1");
                }
              })
              .catch(function (err) {
                console.log(err);
                return res.status(201).json("Erreur 2");
              });
          },
          function (demande, done) {
            try {
              modelDemande
                .findByIdAndUpdate(
                  id,
                  {
                    coordonnes: { latitude, altitude, longitude },
                    statut,
                    raison,
                    codeclient,
                    sector,
                    cell,
                    reference,
                    sat,
                    file: filename,
                    commune,
                    feedback: "new",
                    numero,
                  },
                  { new: true }
                )
                .then((response) => {
                  done(null, response);
                })
                .catch(function (err) {
                  console.log(err);
                  return res.status(201).json("Erreur 3");
                });
            } catch (error) {
              console.log(error);
            }
          },
          function (demande, done) {
            const path = `ImagesController/${demande.file}`;
            const pathdelete = `./ImagesController/${demande.file}`;

            sharp(path)
              .png({ quality: 30 })
              .toFile(`./Images/${demande.file}`)
              .then((result) => {
                fs.unlink(pathdelete, (err) => {
                  console.log(err);
                });
                done(demande);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
        ],
        function (result) {
          return res.status(200).json(result);
        }
      );

      // const { filename } = req.file
    } catch (error) {
      console.log(error);
    }
  },

  R_Insert_Updated: (req, res) => {
    try {
      const idDemande = req.recherche;
      const io = req.io;
      modelDemande
        .aggregate([
          {
            $match: {
              idDemande,
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
            $lookup: {
              from: "zones",
              localField: "codeZone",
              foreignField: "idZone",
              as: "zone",
            },
          },
          {
            $lookup: {
              from: "reponses",
              localField: "idDemande",
              foreignField: "idDemande",
              as: "reponse",
            },
          },
          { $unwind: "$agent" },
          { $unwind: "$zone" },
          {
            $lookup: {
              from: "shops",
              localField: "agent.idShop",
              foreignField: "idShop",
              as: "shopAgent",
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
        ])
        .then((response) => {
          if (response) {
            io.emit("demande", response);
            return res.status(200).json(response);
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {}
  },
};
