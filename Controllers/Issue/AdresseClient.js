const modelRapport = require("../../Models/Rapport");
const modelPlainte = require("../../Models/Issue/Appel_Issue");
const modelDelai = require("../../Models/Issue/Delai");
const asyncLab = require("async");
const moment = require("moment");
const { return_time_Delai } = require("../../Static/Static_Function");
const regularisation = "Regularisation";
const repo_volontaire = "Repossession volontaire";
const downgrade = "Downgrade";
const desengagement = "Desengagement";
const upgrade = "Upgrade";
const fermeture = "Complaint to close";
const customer_Info = "Customer Information";
const Refresh = "Refreshing channels";

module.exports = {
  updatedAdresse: (req, res) => {
    try {
      const { id, valeur, idPlainte } = req.body;
      if (!id || !valeur || !idPlainte) {
        return res.status(201).json("Error");
      }
      const io = req.io;
      modelRapport
        .findByIdAndUpdate(
          id,
          {
            $set: {
              confirmeAdresse: {
                value: valeur,
                idPlainte,
              },
            },
          },
          { new: true }
        )
        .then((result) => {
          if (result) {
            return res.status(200).json(result);
          } else {
            return res.status(201).json("please try again");
          }
        })
        .catch(function (err) {
          return res.status(201).json("Error " + err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  Desengagement: (req, res) => {
    try {
      const io = req.io;
      const {
        raison,
        codeclient,
        shop,
        contact,
        nomClient,
        plainteSelect,
        typePlainte,
      } = req.body;
      const property = req.user.plainte_callcenter ? "callcenter" : "shop";
      const { filename } = req.file;

      const date = new Date();
      const { nom } = req.user;
      if (
        !raison ||
        !codeclient ||
        !shop ||
        !contact ||
        !filename ||
        !nomClient ||
        !plainteSelect ||
        !typePlainte
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelDelai
              .find({})
              .lean()
              .then((deedline) => {
                const tab = return_time_Delai("escalade", deedline);
                done(null, tab);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (time_delai, done) {
            const periode = moment(new Date()).format("MM-YYYY");
            modelPlainte
              .create({
                submitedBy: nom,
                codeclient,
                nomClient,
                time_delai,
                contact,
                typePlainte,
                periode,
                type: "support",
                plainteSelect,
                statut: desengagement,
                fullDateSave: date,
                property,
                shop,
                operation: "backoffice",
                idPlainte: new Date().getTime(),
                desangagement: { raison, filename },
                dateSave: date.toISOString().split("T")[0],
              })
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
            io.emit("plainte", response);
            return res.status(200).json(response);
          } else {
            return res.status(201).json("Error");
          }
        }
      );
    } catch (error) {
      return res.status(201).json("Error " + error);
    }
  },
  Repo_Volontaire: (req, res) => {
    try {
      const io = req.io;
      const {
        codeclient,
        shop,
        contact,
        nomClient,
        plainteSelect,
        typePlainte,
        num_synchro,
        materiel,
      } = req.body;
      const property = req.user.plainte_callcenter ? "callcenter" : "shop";
      const date = new Date();
      const { nom } = req.user;
      if (
        !materiel ||
        !num_synchro ||
        !plainteSelect ||
        !typePlainte ||
        !codeclient
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelDelai
              .find({})
              .lean()
              .then((deedline) => {
                const tab = return_time_Delai("escalade", deedline);
                done(null, tab);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (time_delai, done) {
            const periode = moment(new Date()).format("MM-YYYY");
            modelPlainte
              .create({
                submitedBy: nom,
                codeclient,
                nomClient,
                periode,
                time_delai,
                contact,
                typePlainte,
                type: "support",
                plainteSelect,
                statut: repo_volontaire,
                fullDateSave: date,
                property,
                shop,
                operation: "backoffice",
                idPlainte: new Date().getTime(),
                repo_volontaire: { num_synchro, materiel },
                dateSave: new Date().toISOString().split("T")[0],
              })
              .then((result) => {
                done(result);
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
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
  Regularisation: (req, res) => {
    try {
      const io = req.io;
      const periode = moment(new Date()).format("MM-YYYY");
      const {
        codeclient,
        shop,
        contact,
        nomClient,
        plainteSelect,
        typePlainte,
        jours,
        cu,
        date_coupure,
        raison,
      } = req.body;
      const date = new Date();

      if (
        !codeclient ||
        !shop ||
        !contact ||
        !nomClient ||
        !plainteSelect ||
        !typePlainte ||
        !jours ||
        !cu ||
        !date_coupure ||
        !raison
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      const property = req.user.plainte_callcenter ? "callcenter" : "shop";
      const { nom } = req.user;
      asyncLab.waterfall(
        [
          function (done) {
            modelDelai
              .find({})
              .lean()
              .then((deedline) => {
                const tab = return_time_Delai("escalade", deedline);
                done(null, tab);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (time_delai, done) {
            modelPlainte
              .create({
                submitedBy: nom,
                codeclient,
                nomClient,
                time_delai,
                contact,
                periode,
                typePlainte,
                type: "support",
                plainteSelect,
                statut: regularisation,
                fullDateSave: date,
                property,
                shop,
                operation: "backoffice",
                idPlainte: new Date().getTime(),
                regularisation: { jours, cu, date_coupure, raison },
                dateSave: new Date().toISOString().split("T")[0],
              })
              .then((result) => {
                done(result);
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
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
  Downgrade: (req, res) => {
    try {
      const io = req.io;
      const {
        codeclient,
        shop,
        contact,
        nomClient,
        plainteSelect,
        typePlainte,
        kit,
        num_synchro,
      } = req.body;
      const property = req.user.plainte_callcenter ? "callcenter" : "shop";
      const date = new Date();

      if (
        !codeclient ||
        !shop ||
        !contact ||
        !nomClient ||
        !plainteSelect ||
        !typePlainte ||
        !kit ||
        !num_synchro
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      const { nom } = req.user;
      asyncLab.waterfall(
        [
          function (done) {
            modelDelai
              .find({})
              .lean()
              .then((deedline) => {
                const tab = return_time_Delai("escalade", deedline);
                done(null, tab);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (time_delai, done) {
            const periode = moment(new Date()).format("MM-YYYY");
            modelPlainte
              .create({
                submitedBy: nom,
                codeclient,
                periode,
                nomClient,
                time_delai,
                contact,
                typePlainte,
                type: "support",
                plainteSelect,
                statut: downgrade,
                fullDateSave: date,
                property,
                shop,
                operation: "backoffice",
                idPlainte: date.getTime(),
                downgrade: { kit, num_synchro },
                dateSave: date.toISOString().split("T")[0],
              })
              .then((result) => {
                done(result);
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
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
  Upgrade: (req, res) => {
    try {
      const io = req.io;
      const {
        codeclient,
        shop,
        contact,
        nomClient,
        plainteSelect,
        typePlainte,
        materiel,
      } = req.body;
      const property = req.user.plainte_callcenter ? "callcenter" : "shop";
      const date = new Date();

      if (
        !codeclient ||
        !shop ||
        !contact ||
        !nomClient ||
        !plainteSelect ||
        !typePlainte ||
        !materiel
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      const { nom } = req.user;
      asyncLab.waterfall(
        [
          function (done) {
            modelDelai
              .find({})
              .lean()
              .then((deedline) => {
                const tab = return_time_Delai("escalade", deedline);
                done(null, tab);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (time_delai, done) {
            const periode = moment(new Date()).format("MM-YYYY");
            modelPlainte
              .create({
                submitedBy: nom,
                codeclient,
                periode,
                nomClient,
                time_delai,
                contact,
                typePlainte,
                type: "support",
                plainteSelect,
                statut: upgrade,
                fullDateSave: date,
                property,
                shop,
                operation: "backoffice",
                idPlainte: new Date().getTime(),
                upgrade: materiel,
                dateSave: date.toISOString().split("T")[0],
              })
              .then((result) => {
                done(result);
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
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
  Demande_FermeturePlainte: (req, res) => {
    try {
      const { idPlainte, raison } = req.body;
      const { nom } = req.user;
      const date = new Date();
      const io = req.io;
      if (!idPlainte || !raison) {
        return res
          .status(201)
          .json("Veuillez renseigner la raison de fermeture");
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelPlainte
              .findOne({ idPlainte })
              .lean()
              .then((result) => {
                if (result) {
                  done(null, result);
                } else {
                  return res.status(201).json("Error");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (ticket, done) {
            modelDelai
              .find({})
              .lean()
              .then((deedline) => {
                const tab = return_time_Delai("escalade", deedline);
                done(null, ticket, tab);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (plainte, time_delai, done) {
            modelPlainte
              .findOneAndUpdate(
                { idPlainte },
                {
                  $set: {
                    statut: fermeture,
                    operation: "backoffice",
                    time_delai,
                  },
                  $push: {
                    resultat: {
                      nomAgent: nom,
                      fullDate: date,
                      dateSave: date.toISOString().split("T")[0],
                      laststatus: plainte.statut,
                      changeto: fermeture,
                      commentaire: raison,
                    },
                  },
                },
                { new: true }
              )
              .then((data) => {
                done(data);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
        ],
        function (data) {
          if (data) {
            io.emit("plainte", data);
            return res.status(200).json(data);
          } else {
            return res.status(201).json("Error");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  Info_Client: (req, res) => {
    try {
      const io = req.io;
      const {
        codeclient,
        shop,
        contact,
        nomClient,
        plainteSelect,
        typePlainte,
        adresse,
      } = req.body;
      const property = req.user.plainte_callcenter ? "callcenter" : "shop";
      if (
        !codeclient ||
        !shop ||
        !contact ||
        !nomClient ||
        !plainteSelect ||
        !typePlainte ||
        !adresse
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      const { nom } = req.user;
      const periode = moment(new Date()).format("MM-YYYY");
      asyncLab.waterfall([
        function (done) {
          modelDelai
            .find({})
            .lean()
            .then((deedline) => {
              const tab = return_time_Delai("escalade", deedline);
              done(null, tab);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (time_delai, done) {
          modelPlainte
            .create({
              submitedBy: nom,
              codeclient,
              operation: "backoffice",
              nomClient,
              time_delai,
              contact,
              statut: customer_Info,
              periode,
              typePlainte,
              shop,
              idPlainte: new Date().getTime(),
              plainteSelect,
              dateSave: new Date().toISOString().split("T")[0],
              fullDateSave: new Date(),
              property,
              adresse,
              type: "support",
            })
            .then((result) => {
              if (result) {
                io.emit("plainte", result);
                return res.status(200).json(result);
              } else {
                return res.status(201).json("Error");
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
  AddPlainteSupport: (req, res) => {
    try {
      const io = req.io;
      const {
        codeclient,
        shop,
        contact,
        nomClient,
        plainteSelect,
        typePlainte,
      } = req.body;
      const property = req.user.plainte_callcenter ? "callcenter" : "shop";

      if (
        !codeclient ||
        !shop ||
        !contact ||
        !nomClient ||
        !plainteSelect ||
        !typePlainte
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      const { nom } = req.user;
      asyncLab.waterfall(
        [
          function (done) {
            modelDelai
              .find({})
              .lean()
              .then((deedline) => {
                const tab = return_time_Delai("escalade", deedline);
                done(null, tab);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (time_delai, done) {
            const date = new Date();
            const periode = moment(date).format("MM-YYYY");
            let data = req.body;
            data.periode = periode;
            data.idPlainte = date.getTime();
            data.submitedBy = nom;
            data.time_delai = time_delai;
            data.fullDateSave = date;
            data.statut = Refresh;
            data.dateSave = new Date().toISOString().split("T")[0];

            modelPlainte
              .create(data)
              .then((result) => {
                done(result);
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
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
};
