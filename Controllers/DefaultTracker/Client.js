const ModelClient = require("../../Models/DefaultTracker/TableClient");
const asyncLab = require("async");
const { ObjectId } = require("mongodb");
const lodash = require("lodash");
const moment = require("moment");

let month = moment(new Date()).format("MM-YYYY");
let initialeSearch = [
  {
    $lookup: {
      from: "tfeedbacks",
      localField: "currentFeedback",
      foreignField: "idFeedback",
      as: "tfeedback",
    },
  },
  {
    $lookup: {
      from: "rapports",
      localField: "codeclient",
      foreignField: "codeclient",
      as: "visites",
    },
  },
  {
    $addFields: {
      derniereVisite: {
        $arrayElemAt: [
          {
            $reverseArray: "$visites", // Renverse l'ordre du tableau
          },
          0,
        ],
      },
    },
  },
  { $unwind: "$tfeedback" },

  {
    $lookup: {
      from: "roles",
      localField: "tfeedback.idRole",
      foreignField: "idRole",
      as: "incharge",
    },
  },
  {
    $lookup: {
      from: "objectifs",
      let: { codeclient: "$codeclient", month },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$codeclient", "$$codeclient"] },
                { $eq: ["$month", "$$month"] },
              ],
            },
          },
        },
      ],
      as: "objectif",
    },
  },
  {
    $project: {
      codeclient: 1,
      nomclient: 1,
      decision: 1,
      month: 1,
      id: 1,
      shop: 1,
      region: 1,
      action: 1,
      par: 1,
      objectif: 1,
      currentFeedback: 1,
      tfeedback: 1,
      derniereVisite: 1,
      appel: 1,
      fullDate: 1,
      statut_decision: 1,
      incharge: 1,
      statut: 1,
      feedback: 1,
    },
  },
];

let searchData = [
  {
    $lookup: {
      from: "tfeedbacks",
      localField: "currentFeedback",
      foreignField: "idFeedback",
      as: "tfeedback",
    },
  },

  { $unwind: "$tfeedback" },
];
let searchData2 = [
  {
    $lookup: {
      from: "rapports",
      localField: "codeclient",
      foreignField: "codeclient",
      as: "visites",
    },
  },
  {
    $addFields: {
      derniereVisite: {
        $arrayElemAt: [
          {
            $reverseArray: "$visites", // Renverse l'ordre du tableau
          },
          0,
        ],
      },
    },
  },
  {
    $lookup: {
      from: "objectifs",
      let: { codeclient: "$codeclient", month },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$codeclient", "$$codeclient"] },
                { $eq: ["$month", "$$month"] },
              ],
            },
          },
        },
      ],
      as: "objectif",
    },
  },
  {
    $lookup: {
      from: "roles",
      localField: "tfeedback.idRole",
      foreignField: "idRole",
      as: "incharge",
    },
  },
  {
    $project: {
      codeclient: 1,
      nomclient: 1,
      decision: 1,
      month: 1,
      id: 1,
      shop: 1,
      region: 1,
      action: 1,
      par: 1,
      objectif: 1,
      currentFeedback: 1,
      tfeedback: 1,
      derniereVisite: 1,
      appel: 1,
      fullDate: 1,
      statut_decision: 1,
      incharge: 1,
      statut: 1,
      feedback: 1,
    },
  },
];

const AddClientDT = async (req, res) => {
  try {
    const { data } = req.body;
    const { nom } = req.user;
    let month = moment(new Date()).format("MM-YYYY");
    const client = data.map((x) => {
      return {
        ...x,
        month,
        submitedBy: nom,
      };
    });
    if (client.length <= 0) {
      return res.status(201).json("Aucun client renseigné");
    }
    asyncLab.waterfall(
      [
        function (done) {
          ModelClient.insertMany(client)
            .then((response) => {
              done(response);
            })
            .catch(function (err) {
              return res.status(201).json("Error " + err);
            });
        },
      ],
      function (response) {
        if (response) {
          return res.status(200).json("Opération effectuée");
        } else {
          return res.status(201).json("Erreur");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const ChangeStatus = async (req, res, next) => {
  try {
    const { nom } = req.user;
    const { id, lastFeedback, nextFeedback, commentaire } = req.body;

    if (!id || !lastFeedback || !nextFeedback) {
      return res.status(404).json("Veuillez renseigner les champs");
    }
    asyncLab.waterfall(
      [
        function (done) {
          ModelClient.findOneAndUpdate(
            {
              _id: new ObjectId(id),
              currentFeedback: lastFeedback,
            },
            {
              $set: {
                //currentFeedback: nextFeedback,

                feedback: "Pending",
                changeto: nextFeedback,
                submitedBy: nom,
              },
            },

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
          req.recherche = result.codeclient;
          next();
        } else {
          return res.status(404).json(`Le client n'est plus à votre niveau`);
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const ChangeByFile = async (req, res) => {
  try {
    const { data } = req.body;
    //Data : codeclient, nextFeedback,lasFeedback
    const { role, nom } = req.user;
    const clients = data.map((x) => {
      return x.codeclient;
    });
    const customers = lodash.uniq(clients);
    const month = moment(new Date()).format("MM-YYYY");

    asyncLab.waterfall([
      function (done) {
        ModelClient.aggregate([
          {
            $match: { codeclient: { $in: customers }, actif: true, month },
          },
          {
            $lookup: {
              from: "tfeedbacks",
              localField: "currentFeedback",
              foreignField: "idFeedback",
              as: "feedback",
            },
          },
          { $unwind: "$feedback" },
          { $unwind: "$feedback.idRole" },
          {
            $match: { "feedback.idRole": role },
          },
        ])
          .then((result) => {
            if (result.length - data.length !== 0) {
              return res.status(201).json({
                result,
                message: "Some customers are not on your dashboard",
              });
            } else {
              //codeclient, idFeedback, nextFeedback
              let donner = result.map((client) => {
                return {
                  codeclient: client.codeclient,
                  idFeedback: client.currentFeedback,
                  nextFeedback: data.filter(
                    (x) => x.codeclient === client.codeclient
                  )[0]?.idFeedback,
                };
              });
              done(null, donner);
            }
          })
          .catch(function (err) {
            console.log(err);
          });
      },
      function (result, done) {
        async function updateClientsWithBulk() {
          const bulkOperations = result.map((client) => ({
            updateOne: {
              filter: {
                codeclient: client.codeclient,
                currentFeedback: client.idFeedback,
                actif: true,
              },
              update: {
                $set: {
                  feedback: "Pending",
                  changeto: client.nextFeedback,
                  submitedBy: nom,
                },
              },
            },
          }));

          try {
            const result = await ModelClient.bulkWrite(bulkOperations);

            return res
              .status(200)
              .json(`Mises à jour réussies : ${result.modifiedCount} clients`);
          } catch (err) {
            return res
              .status(201)
              .json("Error during updates : " + err.message);
          }
        }
        updateClientsWithBulk();
      },
    ]);
  } catch (error) {
    console.log(error);
  }
};
const ReadFilterClient = async (req, res) => {
  try {
    const { data, defaultv } = req.body;
    let month = moment(new Date()).format("MM-YYYY");
    let filtre = data;
    filtre.month = month;
    filtre.action = { $in: ["No_Action", "Rejected"] };
    filtre.statut_decision = "Tracking_Ongoing";
    filtre.feedback = { $in: ["Rejected", "Approved", "success"] };
    filtre.actif = true;

    asyncLab.waterfall(
      [
        //Read role
        function (done) {
          ModelClient.aggregate(
            defaultv
              ? [{ $match: filtre }, { $limit: 50 }, ...initialeSearch]
              : [...searchData, { $match: filtre }, ...searchData2]
          )
            .then((result) => {
              done(null, result);
            })
            .catch(function (err) {
              return res.status(404).json(err);
            });
        },
        function (result, done) {
          done(result);
        },
      ],
      function (result) {
        return res.status(200).json({
          client: result,
          dateServer: new Date(),
        });
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const Appel = async (req, res) => {
  try {
    const { data } = req.body;
    let month = moment(new Date()).format("MM-YYYY");
    if (data.length === 0) {
      return res.status(201).json("Error");
    }
    for (let i = 0; i < data.length; i++) {
      ModelClient.findOneAndUpdate(
        {
          codeclient: data[i].codeclient,
          actif: true,
          month,
        },
        {
          $set: {
            appel: data[i].feedback,
          },
        }
      ).then(() => {});
    }
    return res.status(200).json("Done");
  } catch (error) {}
};
const ReadClientAfterChange = async (req, res) => {
  try {
    const recherche = req.recherche;
    ModelClient.aggregate([
      { $match: { codeclient: recherche, actif: true } },
      {
        $lookup: {
          from: "tfeedbacks",
          localField: "currentFeedback",
          foreignField: "idFeedback",
          as: "tfeedback",
        },
      },
      { $unwind: "$tfeedback" },
      {
        $unwind: "$tfeedback.idRole",
      },
      {
        $lookup: {
          from: "rapports",
          localField: "codeclient",
          foreignField: "codeclient",
          as: "visites",
        },
      },
    ])
      .then((result) => {
        if (result.length > 0) {
          return res.status(200).json(result[0]);
        } else {
          return res.status(200).json({});
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
};
const ReadCertainClient = async (req, res) => {
  try {
    const { data } = req.body;
    let month = moment(new Date()).format("MM-YYYY");
    ModelClient.aggregate([
      { $match: { codeclient: { $in: data }, month } },
      {
        $lookup: {
          from: "tfeedbacks",
          localField: "currentFeedback",
          foreignField: "idFeedback",
          as: "tfeedback",
        },
      },
      {
        $lookup: {
          from: "rapports",
          localField: "codeclient",
          foreignField: "codeclient",
          as: "visites",
        },
      },
    ])
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
};
//Modification
const EditFeedbackAppel = async (req, res) => {
  try {
    let month = moment(new Date()).format("MM-YYYY");
    const { codeclient, appel } = req.body;
    if (!appel || !codeclient) {
      return res.status(201).json("Veuillez renseigner les champs");
    }

    ModelClient.findOneAndUpdate(
      { codeclient, month },
      { $set: { appel } },
      { new: true }
    ).then((result) => {
      if (result.appel === appel) {
        return res.status(200).json("Done");
      } else {
        return res.status(201).json("Error");
      }
    });
  } catch (error) {
    return res.status(200).json(JSON.stringify(error));
  }
};
module.exports = {
  AddClientDT,
  ChangeStatus,
  Appel,
  EditFeedbackAppel,
  ReadClientAfterChange,
  ReadCertainClient,
  ChangeByFile,
  ReadFilterClient,
};
