const ModelObjectif = require("../../Models/DefaultTracker/Objectif");
const ModelAgent = require("../../Models/Agent");
const asyncLab = require("async");

const moment = require("moment");

const AddObjectif = async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || data.length === 0) {
      return "Veuillez selectionner le fichier contenant les objectifs";
    }
    let month = moment(new Date()).format("MM-YYYY");
    let clients = data.map(function (x) {
      return {
        ...x,
        month,
      };
    });
    ModelObjectif.insertMany(clients)
      .then(() => {
        return res.status(200).json("Done");
      })
      .catch(function (err) {
        return res.status(201).json(JSON.stringify(err));
      });
  } catch (error) {
    return res.status(201).json(JSON.stringify(error));
  }
};
const EditObjectif = async (req, res) => {
  try {
    let month = moment(new Date()).format("MM-YYYY");
    const { codeclient, shop_client, codeAgent } = req.body;

    if (!codeclient || !codeAgent) {
      return res.status(201).json("Veuillez renseigner les champs");
    }
    asyncLab.waterfall(
      [
        function (done) {
          ModelAgent.aggregate([
            { $match: { codeAgent, active: true } },
            {
              $lookup: {
                from: "shops",
                localField: "idShop",
                foreignField: "idShop",
                as: "shop",
              },
            },
            { $unwind: "$shop" },
          ])
            .then((agent) => {
              if (agent.length > 0) {
                done(null, agent[0]);
              } else {
                return res.status(201).json("Agent introuvable");
              }
            })
            .catch(function (err) {
              return res.status(201).json(JSON.stringify(err));
            });
        },
        function (agent, done) {
          if (agent.shop.shop !== shop_client) {
            return res
              .status(201)
              .json("Le shop du client n'est pas conforme à celui de l'agent");
          } else {
            done(null, agent);
          }
        },
        function (agent, done) {
          ModelObjectif.findOneAndUpdate(
            { codeclient, month },
            { $set: { codeAgent: agent.codeAgent } },
            { new: true }
          )
            .then((new_agent) => {
              done(new_agent);
            })
            .catch(function (err) {
              return res.status(201).json(JSON.stringify(err));
            });
        },
      ],
      function (result) {
        if (result) {
          return res.status(200).json(result);
        } else {
          return res.status(201).json("Ce client n'est pas dans les objectifs");
        }
      }
    );
  } catch (error) {
    return res.status(201).json(JSON.stringify(error));
  }
};
module.exports = { AddObjectif, EditObjectif };
