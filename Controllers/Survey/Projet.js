const modelProjet = require("../../Models/Survey/Projet");
const { generateString } = require("../../Static/Static_Function");

module.exports = {
  AddProjet: (req, res) => {
    const idProjet = generateString(6);
    const { name, customers, intervenant, date } = req.body;
    const save_by = req.user.nom;
    if (intervenant.length === 0 || !name || !date || customers.length === 0) {
      return res.status(201).json("Veuillez renseigner les champs");
    }

    modelProjet
      .create({ name, save_by, intervenant, customers, id: idProjet, date })
      .then((result) => {
        if (result) {
          return res.status(200).json(result);
        } else {
          return res.status(201).json("Erreur");
        }
      })
      .catch(function (err) {
        return res.status(201).json("Erreur " + err);
      });
    try {
    } catch (error) {
      console.log(error);
    }
  },
  ReadProjet: (req, res) => {
    try {
      modelProjet
        .find({ active: true })
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
  ReadFormulaire: (req, res) => {
    try {
      const id = req.params;
      modelProjet
        .aggregate([
          { $match: { id } },
          {
            $lookup: {
              from: "questions",
              localField: "id",
              foreignField: "idProjet",
              as: "questions",
            },
          },
          { $unwind: "$questions" },
        ])
        .then((questions) => {
          return res.status(200).json(questions);
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
};
