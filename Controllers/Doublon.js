const { ObjectId } = require("mongodb");
const modelDoublon = require("../Models/Doublon");
const modelConversation = require("../Models/Reclamation");
const asyncLab = require("async");
const modelDemande = require("../Models/Demande");
const moment = require("moment");

let periode = moment(new Date()).format("MM-YYYY");

const Doublon = async (req, res) => {
  try {
    const { precedent, agentCo, present, message, _idDemande } = req.recherche;
    asyncLab.waterfall(
      [
        function (done) {
          modelDoublon
            .create({
              present,
              precedent,
              periode,
            })
            .then((result) => {
              done(null, result);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (result, done) {
          modelConversation
            .create({
              message: message,
              codeAgent: agentCo,
              sender: "co",
              code: new ObjectId(_idDemande),
            })
            .then((response) => {
              if (response) {
                done(response);
              }
            });
        },
      ],
      function (response) {
        if (response) {
          return res.status(200).json(present);
        } else {
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const ReadDoublon = async (req, res) => {
  try {
    let match = {
      $match: { periode },
    };
    modelDoublon
      .aggregate([
        match,
        {
          $lookup: {
            from: "rapports",
            localField: "precedent",
            foreignField: "idDemande",
            as: "precedent",
          },
        },
        { $unwind: "$precedent" },
        {
          $lookup: {
            from: "demandes",
            localField: "present",
            foreignField: "idDemande",
            as: "presents",
          },
        },
        { $unwind: "$presents" },
        //Look agent précédent

        //Look agent present
        {
          $lookup: {
            from: "agents",
            localField: "presents.codeAgent",
            foreignField: "codeAgent",
            as: "agentPresent",
          },
        },
        {
          $unwind: "$agentPresent",
        },

        {
          $lookup: {
            from: "shops",
            localField: "agentPresent.idShop",
            foreignField: "idShop",
            as: "PresentShop",
          },
        },
      ])
      .then((response) => {
        console.log(response);
        if (response.length > 0) {
          return res.status(200).json(response.reverse());
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
};
const NonConformes = async (req, res) => {
  try {
    const { dataTosearch } = req.body;
    asyncLab.waterfall(
      [
        function (done) {
          //let periode = "10-2024";
          let match = dataTosearch.key
            ? {
                $match: {
                  lot: periode,
                  valide: false,
                  feedback: "chat",
                  [dataTosearch.key]: dataTosearch.value,
                },
              }
            : {
                $match: {
                  lot: periode,
                  valide: false,
                  feedback: "chat",
                },
              };
          modelDemande
            .aggregate(
              [
                match,
                {
                  $lookup: {
                    from: "conversations",
                    localField: "_id",
                    foreignField: "code",
                    as: "conversation",
                  },
                },
                {
                  $lookup: {
                    from: "agents",
                    localField: "codeAgent",
                    foreignField: "codeAgent",
                    as: "agent",
                  },
                },
                { $unwind: "$agent" },

                {
                  $lookup: {
                    from: "shops",
                    localField: "idShop",
                    foreignField: "idShop",
                    as: "shop",
                  },
                },
                {
                  $lookup: {
                    from: "zones",
                    localField: "codeZone",
                    foreignField: "idZone",
                    as: "zone",
                  },
                },
                { $unwind: "$zone" },
                {
                  $project: {
                    codeAgent: 1,
                    sector: 1,
                    cell: 1,
                    sat: 1,
                    idDemande: 1,
                    file: 1,
                    commune: 1,
                    shop: 1,
                    "agent.nom": 1,
                    conversation: 1,
                    createdAt: 1,
                    zone: 1,
                  },
                },
              ],
              { allowDiskUse: true }
            )
            .then((response) => {
              console.log(response);
              done(response);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ],
      function (response) {
        if (response.length > 0) {
          return res.status(200).json(response.reverse());
        } else {
          return res.status(200).json([]);
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};

module.exports = { Doublon, ReadDoublon, NonConformes };
