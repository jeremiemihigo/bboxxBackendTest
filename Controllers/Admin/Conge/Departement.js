const modelDepartement = require("../../../Models/Admin/Departement");
const asyncLab = require("async");
const { generateNumber } = require("../../../Static/Static_Function");
const ModelFonction = require("../../../Models/Admin/Fonction");
const { ObjectId } = require("mongodb");
const _Empty_Field = "Please fill in the fields";

module.exports = {
  AddDepartement: (req, res) => {
    try {
      const { departement } = req.body;
      if (!departement) {
        return res.status(404).json(_Empty_Field);
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelDepartement
              .findOne({
                departement: departement.toUpperCase(),
              })
              .then((departmt) => {
                if (departmt) {
                  return res.status(404).json("Ce departement existe deja");
                } else {
                  done(null, true);
                }
              });
          },
          function (departmt, done) {
            modelDepartement
              .create({
                departement,
                codeDepartement: generateNumber(6),
              })
              .then((depar) => {
                done(depar);
              });
          },
        ],
        function (result) {
          if (result) {
            return res.status(200).json(result);
          } else {
            return res.status(404).json("Erreur d'enregistrement");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  ReadDepartement: (req, res) => {
    try {
      const recherche = req.recherche;
      let match = recherche ? { _id: new ObjectId(recherche) } : {};
      modelDepartement
        .aggregate([
          { $match: match },
          {
            $lookup: {
              from: "fonctions",
              localField: "codeDepartement",
              foreignField: "codeDepartement",
              as: "fonction",
            },
          },
        ])
        .then((result) => {
          if (result.length > 0) {
            let data = recherche ? result[0] : result;
            return res.status(200).json(data);
          }
        })
        .catch(function (err) {
          return res.status(404).json("Erreur" + err);
        });
    } catch (error) {
      return res.status(404).json("Erreur" + error);
    }
  },
  AddFonction: (req, res) => {
    try {
      const { fonction, codeDepartement } = req.body;
      const codeFonction = generateNumber(9);
      if (!fonction || !codeDepartement) {
        return res.status(201).json(_Empty_Field);
      }
      asyncLab.waterfall(
        [
          function (done) {
            ModelFonction.findOne({ fonction })
              .lean()
              .then((result) => {
                if (result) {
                  return res.status(201).json("This function already exists");
                } else {
                  done(null, true);
                }
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
              });
          },
          function (resu, done) {
            ModelFonction.create({ codeFonction, codeDepartement, fonction })
              .then((result) => {
                done(result);
              })
              .catch(function (err) {
                return res.status(201).json("Erreur " + err);
              });
          },
        ],
        function (result) {
          if (result) {
            return res.status(200).json(result);
          } else {
            return res.status(201).json("Erreur d'enregistrement");
          }
        }
      );
    } catch (error) {
      return res.status(201).json("Erreur " + error);
    }
  },
  ReadFonction: (req, res) => {
    try {
      ModelFonction.aggregate([
        {
          $lookup: {
            from: "departements",
            localField: "codeDepartement",
            foreignField: "codeDepartement",
            as: "departement",
          },
        },
        { $unwind: "$departement" },
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
};
