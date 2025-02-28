const ModelClient = require("../../Models/DefaultTracker/TableClient");
const ModelRole = require("../../Models/DefaultTracker/Role");
const ModelShop = require("../../Models/Shop");
const ModelRegion = require("../../Models/Zone");
const asyncLab = require("async");
const moment = require("moment");
const { returnMoisLetter } = require("../../Static/Static_Function");
const lodash = require("lodash");
const modelPeriode = require("../../Models/Periode");
const ModelAgent = require("../../Models/Agent");

const visitedMonth = (visites) => {
  if (visites.length === 0) {
    return { visitMonth: "No visits", lastfeedback: "No visits" };
  } else {
    let table = [];
    let lastfeedback = undefined;
    for (let i = 0; i < visites.length; i++) {
      table.push(returnMoisLetter(visites[i].demande.lot.split("-")[0]));
    }
    lastfeedback = visites[visites.length - 1].demande.raison;
    return {
      visitMonth: `${lodash.uniq(table).join(" & ")}`,
      lastfeedback: lastfeedback ? lastfeedback : "",
    };
  }
};
const returnLastFirstDate = () => {
  const currentDate = new Date();
  const lastMonthDate = new Date(currentDate);
  lastMonthDate.setMonth(currentDate.getMonth() - 1);
  const l = lastMonthDate.toISOString().split("T")[0];
  const lastDate = new Date(l);
  lastMonthDate.setDate(1);
  const f = lastMonthDate.toISOString().split("T")[0];
  const firstDate = new Date(f);
  return { lastDate, firstDate };
};
const feedbackRole = (feedback, role) => {
  if (feedback.length === 0) {
    return "";
  } else {
    let feedbackRole = feedback.filter((x) => x.role === role);
    if (feedbackRole.length >= 1) {
      return feedbackRole[feedbackRole.length - 1].newFeedback;
    } else {
      return "";
    }
  }
};

const Rapport = async (req, res) => {
  try {
    asyncLab.waterfall(
      [
        function (done) {
          ModelRole.find({}, { idRole: 1, _id: 0 })
            .lean()
            .then((result) => {
              let roles = result.map((x) => x.idRole);
              done(null, roles);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (role, done) {
          ModelClient.aggregate([
            {
              $lookup: {
                from: "rapports",
                localField: "codeclient",
                foreignField: "codeclient",
                as: "visites",
              },
            },
          ]).then((result) => {
            let newData = result.map(function (x) {
              return {
                ...x,
                visiteMonth: visitedMonth(x.visites).visitMonth,
                last_feedback_VM: visitedMonth(x.visites).lastfeedback,
              };
            });
            for (let i = 0; i < role.length; i++) {
              for (let y = 0; y < newData.length; y++) {
                newData[y][role[i]] = feedbackRole(
                  newData[y].feedback,
                  role[i]
                );
              }
            }
            done(newData, role);
          });
        },
      ],
      function (result, role) {
        return res.status(200).json({ result, role });
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const ClientVisited = async (req, res) => {
  const mois = moment(new Date()).format("MM-YYYY");
  try {
    modelPeriode
      .aggregate([
        { $unwind: "$objectif.data" },
        {
          $addFields: {
            codeclient: "$objectif.data.codeclient",
            codeAgent: "$objectif.data.codeAgent",
          },
        },
        {
          $project: {
            codeclient: 1,
            codeAgent: 1,
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
          $addFields: {
            region: "$agent.codeZone",
            shop: "$agent.idShop",
          },
        },
        {
          $project: {
            codeclient: 1,
            codeAgent: 1,
            region: 1,
            shop: 1,
          },
        },
        {
          $lookup: {
            from: "rapports",
            let: { codeclient: "$codeclient" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$codeclient", "$$codeclient"] },
                      { $eq: ["$demande.lot", mois] },
                    ],
                  },
                },
              },
            ],
            as: "visite",
          },
        },
      ])
      .then((result) => {
        return res.status(200).json(result);
      });
  } catch (error) {
    console.log(error);
  }
};
const InformationCustomer = async (req, res) => {
  try {
    const { codeclient } = req.params;
    const month = moment(new Date()).format("MM-YYYY");
    ModelClient.aggregate([
      { $match: { codeclient, month } },

      {
        $lookup: {
          from: "actions",
          let: { codeclient: "$codeclient" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$codeclient", "$$codeclient"] },
                    { $eq: ["$month", month] },
                  ],
                },
              },
            },
          ],
          as: "actions",
        },
      },
      {
        $lookup: {
          from: "decisions",
          let: { codeclient: "$codeclient" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$codeclient", "$$codeclient"] },
                    { $eq: ["$month", month] },
                  ],
                },
              },
            },
          ],
          as: "decision",
        },
      },
      {
        $lookup: {
          from: "tfeedbacks",
          localField: "currentFeedback",
          foreignField: "idFeedback",
          as: "currentfeedback",
        },
      },
      { $unwind: "$currentfeedback" },
    ])
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (error) {}
};
const StatusDashboard = async (req, res) => {
  let month = moment(new Date()).format("MM-YYYY");
  try {
    ModelClient.aggregate([
      { $match: { month } },
      { $group: { _id: "$currentFeedback", total: { $sum: 1 } } },
      {
        $lookup: {
          from: "tfeedbacks",
          localField: "_id",
          foreignField: "idFeedback",
          as: "feedback",
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "feedback.idRole",
          foreignField: "idRole",
          as: "role",
        },
      },

      { $unwind: "$feedback" },
      {
        $addFields: {
          status: "$feedback.title",
        },
      },
      {
        $project: {
          feedback: 0,
        },
      },
    ])
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (err) {
        return res.status(201).json(JSON.stringify(err));
      });
  } catch (error) {
    console.log(error);
  }
};
const Graphique = async (req, res) => {
  try {
    const { result } = req.client;
    let table = [];
    let action = [];
    let visite = [];
    let appel = [];
    for (let i = 0; i < result.length; i++) {
      table.push(result[i]._id);
    }
    table.sort();
    for (let i = 0; i < table.length; i++) {
      action.push(result.filter((x) => x._id === table[i])[0]?.action);
      visite.push(result.filter((x) => x._id === table[i])[0]?.visite);
      appel.push(result.filter((x) => x._id === table[i])[0]?.appel);
    }

    return res.status(200).json({ appel, table, visite, action });
  } catch (error) {
    console.log(error);
  }
};
const GraphiqueClient = async (req, res, next) => {
  try {
    const month = moment(new Date()).format("MM-YYYY");
    asyncLab.waterfall([
      function (done) {
        ModelRole.findOne({ idRole: req.user.role })
          .then((result) => {
            done(null, result.filterBy);
          })
          .catch(function (error) {
            console.log(error);
          });
      },
      function (filterBy, done) {
        if (filterBy === "shop") {
          done(null, {
            shop: { $in: req.user.valueFilter },
            month,
          });
        }
        if (filterBy === "region") {
          done(null, {
            region: { $in: req.user.valueFilter },
            month,
          });
        }
        if (filterBy === "all") {
          done(null, { month });
        }
      },
      function (recherche, done) {
        ModelClient.aggregate([
          { $match: recherche },
          {
            $lookup: {
              from: "actions",
              let: { codeclient: "$codeclient", mois: month },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$codeclient", "$$codeclient"] },
                        { $eq: ["$month", "$$mois"] },
                      ],
                    },
                  },
                },
              ],
              as: "actions",
            },
          },
          {
            $lookup: {
              from: "rapports",
              let: { codeclient: "$codeclient", mois: "$month" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$codeclient", "$$codeclient"] },
                        { $eq: ["$demande.lot", "$$mois"] },
                      ],
                    },
                  },
                },
              ],
              as: "visite",
            },
          },
          {
            $addFields: {
              taille_action: { $size: "$actions" },
              taille_visite: { $size: "$visite" },
              appelExiste: {
                $cond: [
                  { $gt: [{ $type: "$appel" }, "missing"] }, // Condition : si 'appel' existe
                  1, // Valeur si vrai
                  0, // Valeur si faux
                ],
              },
            },
          },
          {
            $group: {
              _id: "$month", // Pas besoin de regrouper par un champ spécifique
              action: {
                $sum: {
                  $cond: [{ $gt: ["$taille_action", 0] }, 1, 0],
                },
              },
              visite: {
                $sum: {
                  $cond: [{ $gt: ["$taille_visite", 0] }, 1, 0],
                },
              },
              appel: {
                $sum: {
                  $cond: [{ $gt: ["$appelExiste", 0] }, 1, 0],
                },
              },
            },
          },
        ])
          .then((result) => {
            if (result.length > 0) {
              req.client = { result, recherche };
              next();
            } else {
              return res.status(201).json("Aucune information trouvée");
            }
          })
          .catch(function (err) {
            console.log(err);
          });
      },
    ]);
  } catch (error) {
    console.log(error);
  }
};
const TauxValidation = async (req, res) => {
  try {
    const { result, recherche } = req.client;
    const month = moment(new Date()).format("MM-YYYY");
    let datasearch = recherche;
    datasearch.month = month;
    datasearch.actif = true;
    let analyse = result.filter((x) => x._id === month)[0];
    const nombre = await ModelClient.find(datasearch).count();

    return res.status(200).json({
      nombre,
      visite: ((analyse.visite * 100) / nombre).toFixed(0),
      action: parseInt((analyse.action * 100) / nombre).toFixed(0),
      appel: parseInt((analyse.appel * 100) / nombre).toFixed(0),
    });
  } catch (error) {
    console.log(error);
  }
};
const PerformanceDash = async (req, res) => {
  try {
    const month = moment(new Date()).format("MM-YYYY");
    const { data } = req.body;

    const { lastDate, firstDate } = returnLastFirstDate();
    const currentDate = new Date();
    currentDate.setDate(1);
    const l = currentDate.toISOString().split("T")[0];
    const lastNowDate = new Date(l);
    const today = new Date(new Date().toISOString().split("T")[0]);

    asyncLab.waterfall(
      [
        function (done) {
          ModelAgent.aggregate([
            { $match: data },
            {
              $lookup: {
                from: "rapports",
                let: { codeAgent: "$codeAgent" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$demandeur.codeAgent", "$$codeAgent"],
                      },
                      dateSave: { $lte: lastDate, $gte: firstDate },
                    },
                  },
                ],
                as: "vm_lastmonth",
              },
            },
            {
              $lookup: {
                from: "rapports",
                let: { codeAgent: "$codeAgent" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$demandeur.codeAgent", "$$codeAgent"],
                      },
                      dateSave: { $lte: today, $gte: lastNowDate },
                    },
                  },
                ],
                as: "vm_thismonth",
              },
            },
            {
              $addFields: {
                size_lastmonth: { $size: "$vm_lastmonth" },
                size_thismonth: { $size: "$vm_thismonth" },
              },
            },
            {
              $lookup: {
                from: "actions",
                let: { codeAgent: "$codeAgent", month },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$codeAgent", "$$codeAgent"],
                        $eq: ["$month", "$$month"],
                      },
                    },
                  },
                ],
                as: "actions",
              },
            },
            {
              $lookup: {
                from: "objectifs",
                let: { codeAgent: "$codeAgent", month },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$month", "$$month"],
                        $eq: ["$codeAgent", "$$codeAgent"],
                      },
                    },
                  },
                ],
                as: "objet",
              },
            },

            {
              $addFields: {
                size_lastmonth: { $size: "$vm_lastmonth" },
                size_thismonth: { $size: "$vm_thismonth" },
                size_objet: { $size: "$objet" },
              },
            },
          ])
            .then((result) => {
              done(result);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ],
      function (result) {
        return res
          .status(200)
          .json({ performance: result, today, lastDate: lastDate });
      }
    );
  } catch (error) {}
};
module.exports = {
  Rapport,
  ClientVisited,
  PerformanceDash,
  GraphiqueClient,
  TauxValidation,
  InformationCustomer,
  Graphique,
  StatusDashboard,
};
