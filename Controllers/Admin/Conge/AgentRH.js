const modelAgent = require("../../../Models/AgentRH");
const asyncLab = require("async");
var ObjectId = require("mongodb").ObjectId;

module.exports = {
  AddAgent_RH: (req, res, next) => {
    try {
      const { nom, id_fonction, all_days, supervisor } = req.body;
      const savedBy = req.user.nom;
      if (!nom || !id_fonction || !all_days || !supervisor) {
        return res.status(404).json("Veuillez renseigner les champs");
      }

      asyncLab.waterfall(
        [
          function (done) {
            modelAgent
              .findOne({ nom: nom.toUpperCase().trim() })
              .then((agent) => {
                if (agent) {
                  return res.status(404).json("L'agent existe deja");
                } else {
                  done(null, agent);
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (agent, done) {
            modelAgent
              .create({ id_fonction, nom, all_days, supervisor, savedBy })
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
            req.recherche = result._id;
            next();
          } else {
            return res.status(404).json("Error");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  Associer: (req, res) => {
    try {
      const { id, codeAgent } = req.body;
      if (!id || !codeAgent) {
        return res.status(201).json("Error");
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelAgent
              .findById(id)
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
          function (agent, done) {
            modelAgent
              .findByIdAndUpdate(
                agent._id,
                { $set: { codeAgent } },
                { new: true }
              )
              .then((result) => {
                done(result);
              })
              .catch(function (err) {
                console.log(err);
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
  ReadOneAgentRH: (req, res) => {
    try {
      const { id } = req.params;
      const recherche = req.recherche;
      let code = recherche ? recherche : id;
      let match =
        id || recherche
          ? { $match: { _id: new ObjectId(code) } }
          : { $match: {} };
      modelAgent
        .aggregate([
          match,
          {
            $lookup: {
              from: "sessions",
              localField: "codeAgent",
              foreignField: "codeAgent",
              as: "session",
            },
          },
          {
            $lookup: {
              from: "fonctions",
              localField: "id_fonction",
              foreignField: "codeFonction",
              as: "fonctions",
            },
          },
          { $unwind: "$fonctions" },
          {
            $lookup: {
              from: "departements",
              localField: "fonctions.codeDepartement",
              foreignField: "codeDepartement",
              as: "departements",
            },
          },
          { $unwind: "$departements" },
          {
            $project: {
              _id: 1,
              nom: 1,
              savedBy: 1,
              codeAgent: 1,
              "fonctions.fonction": 1,
              "departements.departement": 1,
              session: 1,
            },
          },
        ])
        .then((result) => {
          return res.status(200).json(result);
        });
    } catch (error) {
      console.log(error);
    }
  },
};
