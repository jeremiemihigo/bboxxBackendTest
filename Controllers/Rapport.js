const modelRapport = require("../Models/Rapport");
const modelAppel = require("../Models/Issue/Appel_Issue");
const asyncLab = require("async");
const { differenceDays } = require("../Static/Static_Function");
const modelCorbeille = require("../Models/Corbeille");

module.exports = {
  Rapport: (req, res) => {
    try {
      const { debut, fin, dataTosearch, followUp } = req.body;

      if (!debut || !fin) {
        return res
          .status(200)
          .json({ error: true, message: "Veuillez renseigner les dates" });
      }
      let match_followup = dataTosearch
        ? {
            dateSave: {
              $gte: new Date(debut),
              $lte: new Date(fin),
            },
            [dataTosearch.key]: dataTosearch.value,
            followup: followUp,
          }
        : {
            dateSave: {
              $gte: new Date(debut),
              $lte: new Date(fin),
            },
            followup: followUp,
          };
      let match_not_followup = dataTosearch
        ? {
            dateSave: {
              $gte: new Date(debut),
              $lte: new Date(fin),
            },
            [dataTosearch.key]: dataTosearch.value,
          }
        : {
            dateSave: {
              $gte: new Date(debut),
              $lte: new Date(fin),
            },
          };
      let match = followUp ? match_followup : match_not_followup;

      const project = {
        codeclient: 1,
        codeCu: 1,
        clientStatut: 1,
        PayementStatut: 1,
        consExpDays: 1,
        idDemande: 1,
        dateSave: 1,
        codeAgent: 1,
        nomClient: 1,
        idZone: 1,
        idShop: 1,
        "agentSave.nom": 1,
        "demandeur.nom": 1,
        "demandeur.codeAgent": 1,
        "demandeur.fonction": 1,
        "demande.typeImage": 1,
        "demande.createdAt": 1,
        "demande.numero": 1,
        "demande.commune": 1,
        "demande.updatedAt": 1,
        "demande.statut": 1,
        "demande.sector": 1,
        "demande.lot": 1,
        "demande.cell": 1,
        "demande.reference": 1,
        "demande.sat": 1,
        "demande.raison": 1,
        "coordonnee.longitude": 1,
        "coordonnee.latitude": 1,
        "coordonnee.altitude": 1,
        createdAt: 1,
        updatedAt: 1,
        adresschange: 1,
        time_followup: 1,
      };
      const { nom } = req.user;
      asyncLab.waterfall([
        function (done) {
          modelCorbeille
            .create({
              name: nom,
              date: new Date().toISOString().split("T")[0],
              texte: `Extraction du rapport allant du ${debut} au ${fin}`,
            })
            .then((corbeille) => {
              done(null, corbeille);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (corbei, done) {
          modelRapport
            .find(match, project)
            .lean()
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
  ContactClient: (req, res) => {
    try {
      const { codeclient } = req.body;
      if (!codeclient) {
        return res.status(201).json("Veuillez renseigner le code client");
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelRapport
              .find(
                {
                  codeclient,
                },
                { "demande.numero": 1, "demande.createdAt": 1 }
              )
              .sort({ "demande.createdAt": -1 })
              .then((result) => {
                done(null, result);
              });
          },
          function (visite, done) {
            modelAppel
              .find({ codeclient }, { contact: 1, fullDateSave: 1 })
              .sort({ fullDateSave: -1 })
              .then((result) => {
                done(null, visite, result);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (visite, call, done) {
            const table = [];
            for (let i = 0; i < visite.length; i++) {
              if (
                visite[i].demande.numero !== "undefined" &&
                visite[i].demande.numero.length < 14 &&
                table.filter((x) => x.numero === visite[i].demande.numero)
                  .length === 0
              ) {
                table.push({
                  numero: visite[i].demande.numero,
                  date: visite[i].demande.createdAt,
                  provenance: "visite menage",
                });
              }
            }
            for (let i = 0; i < call.length; i++) {
              if (
                call[i].contact &&
                table.filter((x) => x.numero !== call[i].contact)
              ) {
                table.push({
                  numero: call[i].contact,
                  date: call[i].fullDateSave,
                  provenance: "call",
                });
              }
            }
            done(table);
          },
        ],
        function (result) {
          return res.status(200).json(result);
        }
      );
    } catch (error) {}
  },
  Technical: (req, res) => {
    try {
      const { debut, fin, provenance } = req.body;
      const prov = provenance.split(",");

      const debut_Date = new Date(debut);
      const fin_Date = new Date(fin);
      const lastDebut = new Date(
        debut_Date.setMonth(debut_Date.getMonth() - 1)
      ).toISOString();
      const lastfin = new Date(
        fin_Date.setMonth(fin_Date.getMonth() - 1)
      ).toISOString();

      if (!debut || !fin) {
        return res
          .status(200)
          .json({ error: true, message: "Veuillez renseigner les dates" });
      }
      modelAppel
        .aggregate([
          {
            $match: {
              $or: [
                {
                  dateSave: {
                    $gte: new Date(debut),
                    $lte: new Date(fin),
                  },
                  property: { $in: prov },
                },
                {
                  dateSave: {
                    $gte: new Date(lastDebut),
                    $lte: new Date(lastfin),
                  },
                  property: { $in: prov },
                },
              ],
            },
          },
          {
            $addFields: {
              isValide: {
                $cond: {
                  if: {
                    $and: [
                      { $gte: ["$dateSave", new Date(debut)] },
                      { $lte: ["$dateSave", new Date(fin)] },
                    ],
                  },
                  then: "new_value",
                  else: "old_value",
                },
              },
            },
          },
        ])
        .then((result) => {
          console.log(result);
          return res.status(200).json(result);
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  Call_ToDay: (req, res) => {
    try {
      asyncLab.waterfall(
        [
          function (done) {
            modelRapport
              .find({
                "demande.jours": { $gt: 0 },
                paid: { $exists: false },
              })
              .then((result) => {
                if (result.length > 0) {
                  done(null, result);
                } else {
                  return res.status(200).json([]);
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (result, done) {
            let table = [];
            let today = new Date().toISOString().split("T")[0];
            for (let i = 0; i < result.length; i++) {
              if (
                differenceDays(
                  new Date(
                    new Date(result[i].dateSave).setDate(
                      new Date(result[i].dateSave).getDate() +
                        result[i].demande?.jours +
                        1
                    )
                  ),
                  today
                ) > 0
              ) {
                table.push(result[i]);
              }
            }
            done(table);
          },
        ],
        function (client) {
          return res.status(200).json(client);
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  Refresh_Payment: (req, res) => {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(201).json("Error");
      }
      modelRapport
        .updateMany({ idDemande: { $in: data } }, { $set: { paid: true } })
        .then((result) => {
          return res.status(200).json(result);
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
};
