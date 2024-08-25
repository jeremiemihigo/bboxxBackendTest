const modelDelai = require("../../Models/Issue/Delai");
const asyncLab = require("async");
const _ = require("lodash");

module.exports = {
  Delai: (req, res) => {
    try {
      const { plainte, jour, debut, minutes } = req.body;
      if (!plainte || !jour || !debut || !minutes) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      asyncLab.waterfall([
        function (done) {
          modelDelai
            .findOne({ plainte })
            .lean()
            .then((result) => {
              if (result) {
                if (_.filter(result.critere, { jour }).length > 0) {
                  done(null, "existe", result);
                } else {
                  done(null, "ajouter", result);
                }
              } else {
                done(null, "creer", "rien");
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (result, existe, done) {
          if (result === "creer") {
            modelDelai
              .create({
                plainte,
                defaut: minutes,
                critere: {
                  jour,
                  debut,
                  delai: minutes,
                },
              })
              .then((creer) => {
                if (creer) {
                  return res.status(200).json(result);
                } else {
                  return res.status(201).json("Erreur d'enregistrement");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          }
          if (result === "existe") {
            let supprimer = existe.critere.filter((x) => x.jour !== jour);
            supprimer.push({
              jour,
              debut,
              delai: minutes,
            });
            modelDelai
              .findByIdAndUpdate(
                existe._id,
                {
                  $set: {
                    critere: supprimer,
                  },
                },
                { new: true }
              )
              .then((updated) => {
                if (updated) {
                  return res.status(200).json(updated);
                } else {
                  return res.status(201).json("Error");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          }
          if (result === "ajouter") {
            let ajouter = existe.critere;
            ajouter.push({
              jour,
              debut,
              delai: minutes,
            });
            modelDelai
              .findByIdAndUpdate(
                existe._id,
                {
                  $set: {
                    critere: ajouter,
                  },
                },
                { new: true }
              )
              .then((updated) => {
                if (updated) {
                  return res.status(200).json(updated);
                } else {
                  return res.status(201).json("Error");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          }
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  },
  ReadDelai: (req, res) => {
    try {
      modelDelai
        .find({}, { plainte: 1, critere: 1, defaut: 1, _id: 1 })
        .lean()
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
  Default_Delai: (req, res) => {
    try {
      const { statut, minutes } = req.body;
      if (!statut || !minutes) {
        return res.status(201).json("Error");
      }
      asyncLab.waterfall([
        function (done) {
          modelDelai
            .findOne({ plainte: statut })
            .lean()
            .then((result) => {
              if (result) {
                done(null, result);
              } else {
                done(null, false);
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (result, done) {
          if (result) {
            modelDelai
              .findByIdAndUpdate(
                result._id,
                {
                  $set: {
                    defaut: minutes,
                  },
                },
                { new: true }
              )
              .then((donner) => {
                return res.status(200).json(donner);
              })
              .catch(function (err) {
                console.log(err);
              });
          } else {
            modelDelai
              .create({
                plainte: statut,
                critere: [],
                defaut: minutes,
              })
              .then((donner) => {
                return res.status(200).json(donner);
              })
              .catch(function (err) {
                console.log(err);
              });
          }
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  },
};
