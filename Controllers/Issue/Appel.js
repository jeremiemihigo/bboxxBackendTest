const modelAppel = require("../../Models/Issue/Appel_Issue");
const asyncLab = require("async");
const modelMessage = require("../../Models/Issue/Message");
const modelParametre = require("../../Models/Parametre");
const moment = require("moment");
const modelDelai = require("../../Models/Issue/Delai");
const { return_time_Delai } = require("../../Static/Static_Function");

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
  // ThisMonth: (req, res) => {
  //   try {
  //     asyncLab.waterfall(
  //       [
  //         function (done) {
  //           modelPeriode
  //             .findOne({}, { periode: 1 })
  //             .lean()
  //             .then((periode) => {
  //               if (periode) {
  //                 done(null, periode);
  //               }
  //             })
  //             .catch(function (err) {
  //               console.log(err);
  //             });
  //         },
  //         function (periode, done) {
  //           modelAppel
  //             .aggregate([
  //               {
  //                 $match: {
  //                   periode: periode.periode,
  //                   statut: { $not: { $in: ["resolved", "closed"] } },
  //                 },
  //               },
  //               {
  //                 $lookup: {
  //                   from: "messages",
  //                   localField: "idPlainte",
  //                   foreignField: "idPlainte",
  //                   as: "message",
  //                 },
  //               },
  //               {
  //                 $project: {
  //                   openBy: 1,
  //                   codeclient: 1,
  //                   dateSave: 1,
  //                   message: 1,
  //                   contact: 1,
  //                   fullDateSave: 1,
  //                   statut: 1,
  //                   idPlainte: 1,
  //                   dateClose: 1,
  //                   time_delai: 1,
  //                   delai: 1,
  //                   plainteSelect: 1,
  //                   recommandation: 1,
  //                   typePlainte: 1,
  //                   nomClient: 1,
  //                   priorite: 1,
  //                 },
  //               },
  //             ])
  //             .then((result) => {
  //               done(result);
  //             })
  //             .catch(function (err) {
  //               console.log(err);
  //             });
  //         },
  //       ],
  //       function (result) {
  //         return res.status(200).json(result.reverse());
  //       }
  //     );
  //   } catch (error) {
  //     console.log(error);
  //   }
  // },
  // BackOffice: (req, res) => {
  //   try {
  //     const { statut } = req.params;
  //     modelAppel
  //       .aggregate([
  //         { $match: { statut } },
  //         {
  //           $lookup: {
  //             from: "messages",
  //             localField: "idPlainte",
  //             foreignField: "idPlainte",
  //             as: "message",
  //           },
  //         },
  //         {
  //           $project: {
  //             openBy: 1,
  //             codeclient: 1,
  //             message: 1,
  //             dateSave: 1,
  //             fullDateSave: 1,
  //             statut: 1,
  //             idPlainte: 1,
  //             dateClose: 1,
  //             time_delai: 1,
  //             delai: 1,
  //             plainteSelect: 1,
  //             recommandation: 1,
  //             typePlainte: 1,
  //             nomClient: 1,
  //             priorite: 1,
  //           },
  //         },
  //       ])
  //       .then((result) => {
  //         console.log(result);
  //         return res.status(200).json(result.reverse());
  //       })
  //       .catch(function (err) {
  //         console.log(err);
  //       });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // },
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
              .findByIdAndUpdate(id, { $set: data }, { new: true })
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
            return res.status(201).json("Error");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  Message: (request, response) => {
    try {
      const io = request.io;
      const users = request.users;
      const { nom } = request.user;
      const { idPlainte, content } = request.body;
      if (!idPlainte || !content) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
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
            })
            .then((result) => {
              const user = users.filter((x) => x.nom === plainte.submitedBy);

              if (user.length > 0) {
                io.to(user[0]?.socketId).emit("message", result);
                return response.status(200).json(result);
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
      const { nom } = req.user;

      modelAppel
        .aggregate([
          { $match: { submitedBy: nom, open: true } },
          {
            $lookup: {
              from: "messages",
              localField: "idPlainte",
              foreignField: "idPlainte",
              as: "messages",
            },
          },
          { $unwind: "$messages" },
          { $project: { messages: 1 } },
        ])
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
