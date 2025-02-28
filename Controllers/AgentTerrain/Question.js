const ModelQuestion = require("../../Models/AgentTerrain/Question");

const AddQuestion = async (req, res) => {
  try {
    const { question, type_reponse, item, idServey } = req.body;
    if (!question || !idServey) {
      return res.status(201).json("Veuillez renseigner les champs vides");
    }
    const date = new Date().getTime();
    ModelQuestion.create({
      question,
      type_reponse,
      idServey,
      item,
      idQuestion: `${idServey}-${date}`,
    })
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (error) {
        console.log(error);
        return res.status(201).json(JSON.stringify(error));
      });
  } catch (error) {
    return res.status(201).json(JSON.stringify(error));
  }
};
module.exports = { AddQuestion };
