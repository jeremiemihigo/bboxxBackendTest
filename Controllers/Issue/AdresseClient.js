const modelRapport = require("../../Models/Rapport");
const modelPlainte = require("../../Models/Issue/Appel_Issue");
const asyncLab = require("async");
const moment = require("moment");
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
            io.emit("plainte", result);
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
        fullDate,
        codeclient,
        shop,
        property,
        contact,
        nomClient,
        plainteSelect,
        typePlainte,
        time_delai,
      } = req.body;
      const { filename } = req.file;
      const { nom } = req.user;
      if (
        !raison ||
        !codeclient ||
        !shop ||
        !contact ||
        !time_delai ||
        !filename ||
        !nomClient ||
        !plainteSelect ||
        !typePlainte ||
        !fullDate ||
        !property
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      asyncLab.waterfall([
        function (done) {
          modelPlainte
            .findOne({
              codeclient: codeclient.toUpperCase().trim(),
              statut: { $not: { $in: ["resolved", "closed"] } },
            })
            .lean()
            .then((result) => {
              if (result) {
                return res
                  .status(201)
                  .json(
                    "Une autre plainte est en cours de traitement pour ce client"
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
              fullDateSave: fullDate,
              property,
              shop,
              operation: "backoffice",
              idPlainte: new Date().getTime(),
              desangagement: { raison, filename },
              dateSave: new Date(fullDate).toISOString().split("T")[0],
            })
            .then((response) => {
              if (response) {
                io.emit("plainte", response);

                return res.status(200).json(response);
              } else {
                return res.status(201).json("Error");
              }
            })
            .catch(function (err) {
              console.log(err);
              return res.status(201).json("Error " + err);
            });
        },
      ]);
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
        time_delai,
        nomClient,
        plainteSelect,
        typePlainte,
        fullDate,
        property,
        num_synchro,
        materiel,
      } = req.body;

      const { nom } = req.user;
      asyncLab.waterfall([
        function (done) {
          modelPlainte
            .findOne({
              codeclient: codeclient.toUpperCase().trim(),
              statut: { $not: { $in: ["resolved", "closed"] } },
            })
            .then((result) => {
              if (result) {
                return res
                  .status(201)
                  .json(
                    "Un autre plainte est en cours de traitement pour ce client"
                  );
              } else {
                done(null, result);
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (r, done) {
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
              fullDateSave: fullDate,
              property,
              shop,
              operation: "backoffice",
              idPlainte: new Date().getTime(),
              repo_volontaire: { num_synchro, materiel },
              dateSave: new Date(fullDate).toISOString().split("T")[0],
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
              return res.status(201).json("Error " + err);
            });
        },
      ]);
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
        time_delai,
        nomClient,
        plainteSelect,
        typePlainte,
        fullDate,
        property,
        jours,
        cu,
        date_coupure,
        raison,
      } = req.body;

      if (
        !codeclient ||
        !shop ||
        !contact ||
        !time_delai ||
        !nomClient ||
        !plainteSelect ||
        !typePlainte ||
        !fullDate ||
        !property ||
        !jours ||
        !cu ||
        !date_coupure ||
        !raison
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      const { nom } = req.user;
      asyncLab.waterfall([
        function (done) {
          modelPlainte
            .findOne({
              codeclient: codeclient.toUpperCase().trim(),
              statut: { $not: { $in: ["resolved", "closed"] } },
            })
            .then((result) => {
              if (result) {
                return res
                  .status(201)
                  .json(
                    "Un autre plainte est en cours de traitement pour ce client"
                  );
              } else {
                done(null, result);
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (r, done) {
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
              fullDateSave: fullDate,
              property,
              shop,
              operation: "backoffice",
              idPlainte: new Date().getTime(),
              regularisation: { jours, cu, date_coupure, raison },
              dateSave: new Date(fullDate).toISOString().split("T")[0],
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
              return res.status(201).json("Error " + err);
            });
        },
      ]);
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
        time_delai,
        nomClient,
        plainteSelect,
        typePlainte,
        fullDate,
        property,
        kit,
        num_synchro,
      } = req.body;

      if (
        !codeclient ||
        !shop ||
        !contact ||
        !time_delai ||
        !nomClient ||
        !plainteSelect ||
        !typePlainte ||
        !fullDate ||
        !property ||
        !kit ||
        !num_synchro
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      const { nom } = req.user;
      asyncLab.waterfall([
        function (done) {
          modelPlainte
            .findOne({
              codeclient: codeclient.toUpperCase().trim(),
              statut: { $not: { $in: ["resolved", "closed"] } },
            })
            .then((result) => {
              if (result) {
                return res
                  .status(201)
                  .json(
                    "Un autre plainte est en cours de traitement pour ce client"
                  );
              } else {
                done(null, result);
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (r, done) {
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
              fullDateSave: fullDate,
              property,
              shop,
              operation: "backoffice",
              idPlainte: new Date().getTime(),
              downgrade: { kit, num_synchro },
              dateSave: new Date(fullDate).toISOString().split("T")[0],
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
              return res.status(201).json("Error " + err);
            });
        },
      ]);
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
        time_delai,
        nomClient,
        plainteSelect,
        typePlainte,
        fullDate,
        property,
        materiel,
      } = req.body;

      if (
        !codeclient ||
        !shop ||
        !contact ||
        !time_delai ||
        !nomClient ||
        !plainteSelect ||
        !typePlainte ||
        !fullDate ||
        !property ||
        !materiel
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      const { nom } = req.user;
      asyncLab.waterfall([
        function (done) {
          modelPlainte
            .findOne({
              codeclient: codeclient.toUpperCase().trim(),
              statut: { $not: { $in: ["resolved", "closed"] } },
            })
            .then((result) => {
              if (result) {
                return res
                  .status(201)
                  .json(
                    "Un autre plainte est en cours de traitement pour ce client"
                  );
              } else {
                done(null, result);
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (r, done) {
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
              fullDateSave: fullDate,
              property,
              shop,
              operation: "backoffice",
              idPlainte: new Date().getTime(),
              upgrade: materiel,
              dateSave: new Date(fullDate).toISOString().split("T")[0],
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
              return res.status(201).json("Error " + err);
            });
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  },
  Demande_FermeturePlainte: (req, res) => {
    try {
      const { idPlainte, raison } = req.body;
      const { nom } = req.user;
      const date = new Date();
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
          function (plainte, done) {
            modelPlainte
              .findOneAndUpdate(
                { idPlainte },
                {
                  $set: {
                    statut: fermeture,
                    operation: "backoffice",
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
        time_delai,
        nomClient,
        plainteSelect,
        typePlainte,
        property,
        adresse,
      } = req.body;
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
        time_delai,
        nomClient,
        plainteSelect,
        typePlainte,
        fullDateSave,
        property,
      } = req.body.data;

      if (
        !codeclient ||
        !shop ||
        !contact ||
        !time_delai ||
        !nomClient ||
        !plainteSelect ||
        !typePlainte ||
        !fullDateSave ||
        !property
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      const { nom } = req.user;
      asyncLab.waterfall([
        function (done) {
          modelPlainte
            .findOne({
              codeclient: codeclient.toUpperCase().trim(),
              type: "support",
            })
            .then((result) => {
              if (result) {
                return res
                  .status(201)
                  .json(
                    "Un autre plainte est en cours de traitement pour ce client"
                  );
              } else {
                done(null, result);
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (r, done) {
          const periode = moment(new Date()).format("MM-YYYY");
          let data = req.body.data;
          data.periode = periode;
          data.idPlainte = new Date().getTime();
          data.submitedBy = nom;
          data.statut = Refresh;
          data.dateSave = new Date(fullDateSave).toISOString().split("T")[0];

          modelPlainte
            .create(data)
            .then((result) => {
              if (result) {
                io.emit("plainte", result);

                return res.status(200).json(result);
              } else {
                return res.status(201).json("Error");
              }
            })
            .catch(function (err) {
              return res.status(201).json("Error " + err);
            });
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  },
};
