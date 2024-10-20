const modelQuestion = require("../../Models/Survey/Question");
const modelProjet = require("../../Models/Survey/Projet");
const asyncLab = require("async");

module.exports = {
  AddQuestion: (req, res) => {
    try {
      const { question_name, type, select, textField, idProjet } = req.body;
      if (!question_name || !type || !idProjet) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      if (type === "select" && !select) {
        return res
          .status(201)
          .json("Veuillez préciser le nombre de choix pour cette question");
      }
      if (type === "text" && !textField) {
        return res.status(201).json("Veuillez préciser le type de donnée");
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelProjet
              .findOne({ active: true, id: idProjet })
              .lean()
              .then((projet) => {
                if (projet) {
                  done(null, projet);
                } else {
                  return res.status(201).json("Le projet est introuvable");
                }
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
              });
          },
          function (projet, done) {
            modelQuestion
              .findOne({
                idProjet: projet.id,
                question_name: question_name.toUpperCase(),
              })
              .lean()
              .then((question) => {
                if (question) {
                  return res.status(201).json("Cette question existe deja");
                } else {
                  done(null, projet);
                }
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
              });
          },
          function (projet, done) {
            modelQuestion
              .create({
                question_name,
                type,
                select,
                textField,
                idQuestion: new Date().getTime(),
                idProjet: projet.id,
              })
              .then((question) => {
                done(question);
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
              });
          },
        ],
        function (result) {
          if (result) {
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
  Delete_Question: (req, res) => {
    try {
      const id = req.params;
      modelQuestion
        .findByIdAndDelete(id)
        .then((deleted) => {
          console.log(deleted);
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
};
