const modelAppel = require("../../Models/Issue/Appel_Issue");
const asyncLab = require("async");
const modelMessage = require("../../Models/Issue/Message");
const modelParametre = require("../../Models/Parametre");
const moment = require("moment");
const modelDelai = require("../../Models/Issue/Delai");
const {
  return_time_Delai,
  generateString,
} = require("../../Static/Static_Function");
const mongoose = require("mongoose");

module.exports = {
  Appel: (req, res) => {
    const io = req.io;
    const { nom } = req.user;
    try {
      const {
        codeclient,
        contact,
        shop,
        open,
        raisonOngoing,
        adresse,
        operation,
        typePlainte,
        plainteSelect,
        recommandation,
        nomClient,
        statut,
        priorite,
      } = req.body;
      if (
        !codeclient ||
        !typePlainte ||
        !plainteSelect ||
        !nomClient ||
        !contact ||
        !statut ||
        !shop
      ) {
        return res.status(201).json("Veuillez renseigner les champs vides");
      }
      const property = req.user.plainte_callcenter ? "callcenter" : "shop";
      if (plainteSelect === "autre" && !recommandation) {
        return res
          .status(201)
          .json("Le commentaire est obligatoire pour cette option");
      }
      const date = new Date().toISOString();
      asyncLab.waterfall(
        [
          function (done) {
            modelDelai
              .find({})
              .lean()
              .then((deedline) => {
                const tab = return_time_Delai(statut, deedline);
                done(null, tab);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (time_delai, done) {
            const periodes = moment(new Date()).format("MM-YYYY");
            modelAppel
              .create({
                typePlainte,
                plainteSelect,
                recommandation,
                contact,
                raisonOngoing,
                operation,
                type: "appel",
                codeclient,
                dateSave: date.split("T")[0],
                nomClient,
                periode: periodes,
                dateClose: new Date(),
                fullDateSave: new Date(),
                property,
                open,
                adresse,
                time_delai,
                shop,
                submitedBy: nom,
                statut,
                priorite,
                delai: "IN SLA",
                idPlainte: new Date().getTime(),
              })
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
            let d = result;
            d.message = [];
            io.emit("plainte", d);
            return res.status(200).json(d);
          } else {
            return res.status(201).json("Error");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  AppelToday: (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      modelAppel
        .aggregate([
          { $match: { dateSave: new Date(today) } },
          {
            $lookup: {
              from: "messages",
              localField: "idPlainte",
              foreignField: "idPlainte",
              as: "message",
            },
          },
          {
            $project: {
              submitedBy: 1,
              codeclient: 1,
              dateSave: 1,
              fullDateSave: 1,
              time_delai: 1,
              message: 1,
              statut: 1,
              idPlainte: 1,
              dateClose: 1,
              delai: 1,
              plainteSelect: 1,
              recommandation: 1,
              typePlainte: 1,
              nomClient: 1,
            },
          },
        ])
        .then((result) => {
          return res.status(200).json(result.reverse());
        });
    } catch (error) {
      console.log(error);
    }
  },
  UpdateAppel: (req, res) => {
    try {
      const io = req.io;
      const { id, data } = req.body;
      asyncLab.waterfall(
        [
          function (done) {
            if (data.statut) {
              modelDelai
                .find({})
                .lean()
                .then((deedline) => {
                  const tab = return_time_Delai(
                    data.operation === "backoffice" ? "escalade" : data.statut,
                    deedline
                  );
                  done(null, tab);
                })
                .catch(function (err) {
                  console.log(err);
                });
            } else {
              done(null, 0);
            }
          },
          function (time_delai, done) {
            data.time_delai = time_delai;
            data.fullDateSave = new Date();

            modelAppel
              .findOneAndUpdate(
                { _id: new mongoose.Types.ObjectId(id), open: true },
                { $set: data },
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
            io.emit("plainte", result);
            return res.status(200).json(result);
          } else {
            return res.status(201).json("La plainte n'est plus ouverte");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  Message: (request, response, next) => {
    try {
      const { nom } = request.user;
      const { idPlainte, content, lastMessage, lastAgent } = request.body;

      if (!idPlainte || !content) {
        return response.status(201).json("Veuillez renseigner les champs");
      }
      const date = new Date().toISOString();
      asyncLab.waterfall([
        function (done) {
          modelAppel
            .findOne({ idPlainte })
            .lean()
            .then((plainte) => {
              if (plainte) {
                done(null, plainte);
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (plainte, done) {
          modelMessage
            .create({
              content,
              idPlainte,
              agent: nom,
              lastMessage,
              dateSave: date.split("T")[0],
              codeclient: plainte.codeclient,
              lastAgent,
              idMessage: `${idPlainte}-${generateString(10)}`,
            })
            .then((result) => {
              if (result) {
                request.recherche = result.idMessage;
                next();
              } else {
                return response.status(200).json(result);
              }
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
  ReadMy_Notification: (req, res) => {
    try {
      const io = req.io;
      const users = req.users;
      const { nom } = req.user;

      const dates = new Date().toISOString().split("T")[0];
      const match1 = req.recherche
        ? { idMessage: req.recherche }
        : {
            $or: [
              {
                dateSave: { $lte: new Date(dates), $gte: new Date(dates) },
              },
            ],
          };
      modelMessage
        .aggregate([
          { $match: match1 },
          {
            $lookup: {
              from: "appels",
              localField: "idPlainte",
              foreignField: "idPlainte",
              as: "plainte",
            },
          },
          { $unwind: "$plainte" },
          { $match: { "plainte.open": true } },
        ])
        .then((result) => {
          if (req.recherche) {
            const user = users.filter(
              (x) => x.nom === result[0].plainte?.submitedBy && x.nom !== nom
            );
            let backoffice = users.filter((x) => x.backoffice === true);
            for (let i = 0; i < backoffice.length; i++) {
              io.to(backoffice[0]?.socketId).emit("message", result[0]);
            }
            if (user.length > 0) {
              io.to(user[0]?.socketId).emit("message", result[0]);
              return res.status(200).json(result[0]);
            } else {
              return res.status(200).json(result[0]);
            }
          } else {
            return res.status(200).json(result);
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  InfoClient: (req, res) => {
    try {
      const { codeclient } = req.params;
      function executionParallele_Client(callback) {
        asyncLab.parallel(
          {
            // Recherche info
            info: function (callback) {
              asyncLab.waterfall(
                [
                  function (callback) {
                    modelParametre
                      .aggregate([
                        {
                          $match: { customer: codeclient.toUpperCase().trim() },
                        },
                        {
                          $lookup: {
                            from: "zones",
                            localField: "region",
                            foreignField: "idZone",
                            as: "region",
                          },
                        },
                        {
                          $unwind: "$region",
                        },
                        {
                          $lookup: {
                            from: "shops",
                            localField: "shop",
                            foreignField: "idShop",
                            as: "shop",
                          },
                        },
                        {
                          $unwind: "$shop",
                        },
                      ])
                      .then((result) => {
                        callback(null, result);
                      })
                      .catch(function (err) {
                        console.log(err);
                      });
                  },
                ],
                callback
              );
            },
            // Recherche de ses appels
            appel: function (callback) {
              asyncLab.waterfall(
                [
                  function (callback) {
                    modelAppel
                      .find({ codeclient })
                      .limit(6)
                      .then((result) => {
                        callback(null, result.reverse());
                      })
                      .catch(function (err) {
                        console.log(err);
                      });
                  },
                ],
                callback
              );
            },
            //ses tickets
          },
          function (err, results) {
            if (err) {
              return callback(err);
            }
            callback(null, results);
          }
        );
      }

      // Executer le parallel
      executionParallele_Client(function (err, results) {
        if (err) {
          console.error("Error:", err);
        } else {
          return res.status(200).json(results);
        }
      });
    } catch (error) {
      console.log(error);
    }
  },
};
