const modelDemande = require("../Models/Demande");
const modelAgentAdmin = require("../Models/Agent");
const asyncLab = require("async");
const { ObjectId } = require("mongodb");
const modelRapport = require("../Models/Rapport");
const ModelCorbeille = require("../Models/Corbeille");
const moment = require("moment");

let periode = moment(new Date()).format("MM-YYYY");

const demande = async (req, res) => {
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
      itemswap,
      sector, //placeholder = Sector/constituency
      cell, //placeholder = Cell/Ward
      reference, //placeholder = Reference
      sat, //placeholder = SAT
    } = req.body;
    const { filename } = req.file;

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

    const io = req.io;
    const dates = new Date().toISOString();
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
              itemswap,
              jours,
              sector,
              dateSave: dates.split("T")[0],
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
                done(demande);
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
        // function (demande, done) {
        //   const path = `ImagesController/${demande.file}`;
        //   const pathdelete = `./ImagesController/${demande.file}`;

        //   sharp(path)
        //     .png({ quality: 30 })
        //     .toFile(`./Images/${demande.file}`)
        //     .then((result) => {
        //       fs.unlink(pathdelete, (err) => {
        //         console.log(err);
        //       });
        //       done(demande);
        //     })
        //     .catch(function (err) {
        //       console.log(err);
        //     });
        // },
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
};
const DemandeAttente = async (req, res) => {
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
};
const ToutesDemande = async (req, res) => {
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
};
const ToutesDemandeAgent = async (req, res) => {
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
};
const lectureDemandeBd = async (req, res) => {
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
                  dateSave: {
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
};
const lectureDemandeMobile = async (req, res) => {
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
};
const ToutesDemandeAttente = async (req, res) => {
  try {
    const { limit } = req.params;
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
              if (response.length > 0) {
                done(response);
              } else {
                done([]);
              }
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
  } catch (error) {
    console.log(error);
  }
};
const updateDemandeAgent = async (req, res) => {
  try {
    const { id, data } = req.body;
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
            .findByIdAndUpdate(id, data, { new: true })
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
};
const updateDemandeAgentFile = async (req, res, next) => {
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
      typeImage,
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
                  typeImage,
                  sat,
                  file: filename,
                  commune,
                  feedback: "new",
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
          } catch (error) {
            console.log(error);
          }
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
};
const R_Insert_Updated = async (req, res) => {
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
};

module.exports = {
  demande,
  ToutesDemandeAttente,
  R_Insert_Updated,
  updateDemandeAgentFile,
  updateDemandeAgent,
  DemandeAttente,
  lectureDemandeBd,
  lectureDemandeMobile,
  ToutesDemande,
  ToutesDemandeAgent,
};
