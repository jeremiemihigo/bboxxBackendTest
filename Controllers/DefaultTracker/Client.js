const ModelClient = require("../../Models/DefaultTracker/TableClient");
const asyncLab = require("async");
const { default: mongoose } = require("mongoose");
const lodash = require("lodash");
const moment = require("moment");
const ModelRole = require("../../Models/DefaultTracker/Role");

module.exports = {
  AddClientDT: (req, res) => {
    try {
      const { data } = req.body;
      const client = data.map((x) => {
        return x.codeclient;
      });
      if (client.length <= 0) {
        return res.status(201).json("Aucun client renseigné");
      }
      asyncLab.waterfall(
        [
          function (done) {
            ModelClient.find({
              codeclient: { $in: client },
              actif: true,
            })
              .then((result) => {
                if (result.length > 0) {
                  return res
                    .status(201)
                    .json(
                      `${result.length} client(s) sont en cours de processus`
                    );
                } else {
                  done(null, result);
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (result, done) {
            ModelClient.insertMany(data)
              .then((response) => {
                done(response);
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
              });
          },
        ],
        function (response) {
          if (response) {
            return res.status(200).json("Opération effectuée");
          } else {
            return res.status(201).json("Erreur");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  ChangeStatus: (req, res, next) => {
    try {
      const { role, nom } = req.user;
      const { id, lastFeedback, nextFeedback, commentaire } = req.body;
      if (!id || !lastFeedback || !nextFeedback) {
        return res.status(404).json("Veuillez renseigner les champs");
      }
      asyncLab.waterfall(
        [
          function (done) {
            ModelClient.findOneAndUpdate(
              {
                _id: new mongoose.Types.ObjectId(id),
                currentFeedback: lastFeedback,
              },
              {
                $set: {
                  currentFeedback: nextFeedback,
                  dateupdate: new Date(),
                },
                $push: {
                  feedback: {
                    newFeedback: nextFeedback,
                    lasFeedback: lastFeedback,
                    deedline: "IN SLA",
                    doBy: nom,
                    commentaire,
                    role,
                  },
                },
              },

              { new: true }
            )
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
            req.recherche = result.codeclient;
            next();
          } else {
            return res.status(404).json(`Le client n'est plus à votre niveau`);
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  ChangeByFile: (req, res) => {
    try {
      const { data } = req.body;
      //Data : codeclient, nextFeedback,lasFeedback
      const { role, nom } = req.user;
      const clients = data.map((x) => {
        return x.codeclient;
      });
      const customers = lodash.uniq(clients);
      asyncLab.waterfall(
        [
          function (done) {
            ModelClient.find({
              codeclient: { $in: customers },
              actif: true,
            })
              .then((result) => {
                if (result.length - data.length !== 0) {
                  return res
                    .status(201)
                    .json(
                      "Error :  Veuillez vérifier les clients qui figurent sur votre tableau de bord"
                    );
                } else {
                  done(null, result);
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (result, done) {
            let nombre = 0;
            for (let i = 0; i < data.length; i++) {
              ModelClient.findOneAndUpdate(
                {
                  codeclient: data[i].codeclient,
                  actif: true,
                },
                {
                  $set: {
                    currentFeedback: data[i].nextFeedback,
                    dateupdate: new Date(),
                  },
                  $push: {
                    feedback: {
                      newFeedback: data[i].nextFeedback,
                      lasFeedback: data[i].lasFeedback,
                      deedline: "IN SLA",
                      doBy: nom,
                      role,
                    },
                  },
                },
                { new: true }
              )
                .then((response) => {
                  if (response) {
                    nombre = nombre + 1;
                  }
                })
                .catch(function (err) {
                  console.log(err);
                });
            }
            done(nombre);
          },
        ],
        function (nombre) {
          return res.status(200).json("Operation effectuée");
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  ReadClient: (req, res) => {
    try {
      const { role, valueFilter } = req.user;

      asyncLab.waterfall([
        //Read role
        function (done) {
          ModelRole.findOne({
            idRole: role,
          })
            .lean()
            .then((result) => {
              if (result) {
                done(null, result);
              } else {
                return res
                  .status(404)
                  .json("Vos accès ne sont pas affectés dans un département");
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (departement, done) {
          const { filterBy } = departement;
          let defaults = [
            {
              $lookup: {
                from: "tfeedbacks",
                localField: "currentFeedback",
                foreignField: "idFeedback",
                as: "tfeedback",
              },
            },

            {
              $lookup: {
                from: "rapports",
                localField: "codeclient",
                foreignField: "codeclient",
                as: "visites",
              },
            },
          ];
          if (filterBy === "currentFeedback") {
            defaults.push(
              { $unwind: "$tfeedback" },
              {
                $unwind: "$tfeedback.idRole",
              },
              { $match: { actif: true, "tfeedback.idRole": role } }
            );
          }
          if (filterBy === "all") {
            defaults.push({ $match: { actif: true } });
          }
          if (filterBy === "shop") {
            defaults.push({
              $match: { shop: { $in: valueFilter }, actif: true },
            });
          }
          if (filterBy === "region") {
            defaults.push({
              $match: { region: { $in: valueFilter }, actif: true },
            });
          }
          done(null, defaults);
        },
        function (defaults, done) {
          ModelClient.aggregate(defaults)
            .then((result) => {
              return res.status(200).json(result);
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
  Appel: (req, res) => {
    try {
      const { data } = req.body;
      let month = moment(new Date()).format("MM-YYYY");
      if (data.length === 0) {
        return res.status(201).json("Error");
      }
      for (let i = 0; i < data.length; i++) {
        ModelClient.findOneAndUpdate(
          {
            codeclient: data[i].codeclient,
            actif: true,
            month,
          },
          {
            $set: {
              appel: data[i].feedback,
            },
          }
        ).then((result) => {
          console.log(result);
        });
      }
      return res.status(200).json("Done");
    } catch (error) {}
  },
  ReadClientAfterChange: (req, res) => {
    try {
      const recherche = req.recherche;
      ModelClient.aggregate([
        { $match: { codeclient: recherche, actif: true } },
        {
          $lookup: {
            from: "tfeedbacks",
            localField: "currentFeedback",
            foreignField: "idFeedback",
            as: "tfeedback",
          },
        },
        { $unwind: "$tfeedback" },
        {
          $unwind: "$tfeedback.idRole",
        },
        {
          $lookup: {
            from: "rapports",
            localField: "codeclient",
            foreignField: "codeclient",
            as: "visites",
          },
        },
      ])
        .then((result) => {
          if (result.length > 0) {
            return res.status(200).json(result[0]);
          } else {
            return res.status(200).json({});
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  Visited_Called: (req, res) => {
    try {
      const { client } = req.body;
      const mois = moment(new Date()).format("MM-YYYY");
      ModelClient.aggregate([
        { $match: { codeclient: { $in: client }, actif: true } },
        {
          $lookup: {
            from: "rapports",
            let: { codeclient: "$codeclient" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$codeclient", "$$codeclient"] },
                      { $eq: ["$demande.lot", mois] },
                    ],
                  },
                },
              },
            ],
            as: "visites",
          },
        },
      ]).then((result) => {
        return res.status(200).json(result);
      });
    } catch (error) {}
  },
};
