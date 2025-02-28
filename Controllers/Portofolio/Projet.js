const ModelProjet = require("../../Models/Portofolio/PProjet");
const { generateNumber } = require("../../Static/Static_Function");

const AddProjet = async (req, res) => {
  try {
    //savedBy, id
    const id = `P${generateNumber(5)}`;
    const { codeAgent } = req.user;
    const { title, intervenant, idFormulaire } = req.body;
    if (!title || !intervenant || !idFormulaire) {
      return res.status(404).json("Veuillez renseigner les champs");
    }
    ModelProjet.create({
      title,
      savedBy: codeAgent,
      id,
      intervenant,
      idFormulaire,
    })
      .then((result) => {
        if (result) {
          return res.status(200).json(result);
        } else {
          return res.status(404).json("Error");
        }
      })
      .catch(function (error) {
        return res.status(404).json("Error " + error.message);
      });
  } catch (error) {
    return res.status(404).json("Error " + error.message);
  }
};
const ReadProjet = async (req, res) => {
  try {
    const { fonction, codeAgent } = req.user;
    let match = fonction === "superUser" ? {} : { intervenant: codeAgent };
    ModelProjet.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "agentadmins",
          localField: "intervenant",
          foreignField: "codeAgent",
          as: "agents",
        },
      },
      {
        $lookup: {
          from: "pdatabases",
          localField: "id",
          foreignField: "idProjet",
          as: "database",
        },
      },
      {
        $lookup: {
          from: "pfeedback_calls",
          localField: "id",
          foreignField: "idProjet",
          as: "feedback",
        },
      },
      {
        $lookup: {
          from: "pformulaires",
          localField: "idFormulaire",
          foreignField: "idFormulaire",
          as: "formulaire",
        },
      },
      {
        $project: {
          feedback: 1,
          database: 1,
          formulaire: 1,
          agents: 1,
          title: 1,
        },
      },
    ]).then((result) => {
      return res.status(200).json(result);
    });
  } catch (error) {
    return res.status(404).json("Error " + error.message);
  }
};
module.exports = { AddProjet, ReadProjet };
