const ModelClient = require("../../Models/DefaultTracker/TableClient");
const ModelRole = require("../../Models/DefaultTracker/Role");
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
module.exports = {
  PercentValidation: (req, res) => {
    try {
      let recherche = req.body.recherche;
      let rechercheagent = req.body.lesregion;
      rechercheagent.fonction = { $not: { $in: ["ZBM", "RS", "PO", "SM"] } };
      const month = moment(new Date()).format("MM-YYYY");
      recherche.month = month;
      const { lastDate, firstDate } = returnLastFirstDate();
      const currentDate = new Date();
      currentDate.setDate(1);
      const l = currentDate.toISOString().split("T")[0];
      const lastNowDate = new Date(l);
      const today = new Date(new Date().toISOString().split("T")[0]);

      asyncLab.waterfall(
        [
          function (done) {
            ModelRole.find({}, { idRole: 1, _id: 0 })
              .lean()
              .then((result) => {
                const role = result.map((x) => x.idRole);
                done(null, role);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (role, done) {
            ModelClient.aggregate([
              { $match: recherche },
              { $unwind: "$feedback" },
              {
                $lookup: {
                  from: "tfeedbacks",
                  localField: "currentFeedback",
                  foreignField: "idFeedback",
                  as: "feed",
                },
              },
              { $unwind: "$feed" },
            ])
              .then((result) => {
                let table = [];
                for (let i = 0; i < role.length; i++) {
                  table.push({
                    role: role[i],
                    ongoing: result.filter((x) =>
                      x.feed.idRole.includes(role[i])
                    ),
                    done: result.filter((x) => x.feedback.role === role[i]),
                  });
                }
                let structure = table.map(function (x) {
                  return {
                    ...x,
                    total: x.done.length + x.ongoing.length,
                    percent: (
                      (x.done.length * 100) /
                      (x.done.length + x.ongoing.length)
                    ).toFixed(0),
                  };
                });
                done(null, structure);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (donner, done) {
            ModelAgent.aggregate([
              { $match: rechercheagent },

              {
                $lookup: {
                  from: "rapports",
                  let: { codeAgent: "$codeAgent" },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ["$demandeur.codeAgent", "$$codeAgent"] },
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
                        $expr: { $eq: ["$demandeur.codeAgent", "$$codeAgent"] },
                        dateSave: { $lte: today, $gte: lastNowDate },
                      },
                    },
                  ],
                  as: "vm_thismonth",
                },
              },
            ])
              .then((result) => {
                done(donner, result);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
        ],
        function (donner, result) {
          return res
            .status(200)
            .json({ taux: donner, performance: result, lastDate, today });
        }
      );
    } catch (error) {}
  },
  Rapport: (req, res) => {
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
  },
  ClientVisited: (req, res) => {
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
  },
  InformationCustomer: (req, res) => {
    try {
      const { codeclient } = req.params;
      ModelClient.aggregate([
        { $match: { codeclient } },
        {
          $lookup: {
            from: "rapports",
            localField: "codeclient",
            foreignField: "codeclient",
            as: "visites",
          },
        },
        {
          $lookup: {
            from: "appels",
            localField: "codeclient",
            foreignField: "codeclient",
            as: "plaintes",
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
    } catch (error) {}
  },
};
