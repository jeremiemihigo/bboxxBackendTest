const ModelFeedback = require("../../Models/Portofolio/PFeedback");

const AddFeedback = async (req, res) => {
  try {
    const {
      codeclient,
      idProjet,
      feedback,
      shop,
      region,
      type,
      statut,
      date_to_recall,
      contact,
    } = req.body;
    if (
      !codeclient ||
      !type ||
      !statut ||
      !contact ||
      !idProjet ||
      !shop ||
      !region
    ) {
      return res
        .status(201)
        .json("Veuillez renseigner les champs ayant l'asterisque");
    }
    const dateSave = new Date().getTime();
    ModelFeedback.create({
      codeclient,
      idProjet,
      feedback,
      codeAgent,
      shop,
      region,
      dateSave,
      type,
      statut,
      date_to_recall,
      contact,
    })
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (error) {
        return res.status(201).json("" + error.message);
      });
  } catch (error) {
    return res.status(201).json("" + error.message);
  }
};

module.exports = { AddFeedback };
