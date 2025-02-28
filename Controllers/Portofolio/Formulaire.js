const ModelFormulaire = require("../../Models/Portofolio/PFormulaire");
const ModelQuestion = require("../../Models/Portofolio/PQuestion");
const { generateNumber } = require("../../Static/Static_Function");

const AddFormulaire = async (req, res) => {
  try {
    const idFormulaire = `F${generateNumber(5)}`;
    const { titre } = req.body;
    const { codeAgent } = req.user;
    if (!titre) {
      return res.status(201).json("Veuillez renseigner le titr");
    }
    ModelFormulaire.create({ titre, idFormulaire, savedBy: codeAgent })
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (error) {
        return res.status(404).json("Error " + error.message);
      });
  } catch (error) {
    return res.status(404).json("Error " + error.message);
  }
};
const ReadFormulaire = async (req, res) => {
  try {
    ModelFormulaire.aggregate([
      {
        $lookup: {
          from: "pquestions",
          localField: "id",
          foreignField: "idFormulaire",
          as: "questions",
        },
      },
    ])
      .then((result) => {
        return res.status(200).json(result.reverse());
      })
      .catch(function (error) {
        return res.status(404).json("Error " + error.message);
      });
  } catch (error) {
    return res.status(404).json("Error " + error.message);
  }
};
const AddQuestion = async (req, res) => {
  try {
    const { data } = req.body;

    ModelQuestion.insertMany(data)
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (error) {
        return res.status(201).json("Error " + error.message);
      });
  } catch (error) {
    return res.status(201).json("Error " + error.message);
  }
};
const ReadQuestionProjet = async (req, res) => {
  try {
    const { idFormulaire } = req.params;
    ModelQuestion.find(
      { idFormulaire },
      { question: 1, id: 1, type: 1, valueSelect: 1 }
    )
      .lean()
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (error) {
        return res.status(201).json("Error " + error.message);
      });
  } catch (error) {
    return res.status(201).json("Error " + error.message);
  }
};
const EditQuestion = async (req, res) => {
  try {
    const { id, data } = req.body;

    ModelFormulaire.findByIdAndUpdate(id, { $set: data }, { new: true })
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (error) {
        return res.status(201).json(error.message);
      });
  } catch (error) {}
};
module.exports = {
  AddFormulaire,
  ReadQuestionProjet,
  AddQuestion,
  ReadFormulaire,
  EditQuestion,
};
