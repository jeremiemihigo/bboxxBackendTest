const modelConge = require("../../../Models/Admin/Conge");
const asyncLab = require("async");
const ModelAgent = require("../../AgentAdmin");

const Difference = (debut, fin) => {
  return (new Date(fin).getTime() - new Date(debut).getTime()) / 86400000;
};
module.exports = {
  AddConge: (req, res, next) => {
    try {
      const { codeAgent } = req.user;

      const { typeConge, codeConge, date_engagement, debut, fin } = req.body;
      if (!codeConge || !date_engagement || !typeConge || !debut || !fin) {
        return res.status(201).json("Please fill in the fields");
      }
      const jours = Difference(debut, fin);

      asyncLab.waterfall(
        [
          function (done) {
            ModelAgent.find({
              codeAgent,
              active: true,
              id_session: { $exists: true },
            })
              .lean()
              .then((agent) => {
                if (agent) {
                  done(null, agent);
                } else {
                  return res.status(201).json("Session not found");
                }
              })
              .catch(function (err) {
                return res.status(201).json("Erro " + err);
              });
          },
          function (agent) {
            modelConge
              .aggregate([
                {
                  $match: {
                    codeAgent,
                    id_session: agent.id_session,
                  },
                },
                { total: { $sum: "jours" } },
              ])
              .then((result) => {
                if (result.length > 0) {
                  done(null, 0, agent);
                } else {
                  done(null, result[0].total, agent);
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          //Test
          function (nombre_consomme, agent, done) {
            if (nombre_consomme + jours > agent?.all_days) {
              return res
                .status(201)
                .json(`You only have ${agent?.all_days} days of leave left`);
            } else {
              done(null, nombre_consomme, agent);
            }
          },
          function (days_consumed, agent, done) {
            modelConge
              .create({
                typeConge,
                debut,
                fin,
                codeConge,
                codeAgent,
                jours,
                date_engagement,
                days_consumed,
                id_session: agent?.id_session,
              })
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
            return res.status(201).json("Erreur d'enregistrement");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  ReadConge: (req, res) => {
    try {
      modelConge
        .aggregate([
          {
            $lookup: {
              from: "agentadmins",
              localField: "codeAgent",
              foreignField: "codeAgent",
              as: "agent",
            },
          },
          {
            $unwind: "$agent",
          },
          {
            $lookup: {
              from: "typeConges",
              localField: "typeConge",
              foreignField: "typeConge",
              as: "typeConge",
            },
          },
          {
            $unwind: "$typeConge",
          },
        ])
        .then((result) => {
          return res.status(200).json(result);
        });
    } catch (error) {
      return res.status(201).json("Erreur " + error);
    }
  },
};
