const ModelClient = require("../../Models/DefaultTracker/TableClient");
const ModelRole = require("../../Models/DefaultTracker/Role");
const asyncLab = require("async");
const moment = require("moment");

const Arbitrage = async (req, res) => {
  try {
    const { id, current_status, changeto, submitedBy, commentaire, feedback } =
      req.body;
    const { nom } = req.user;

    asyncLab.waterfall(
      [
        function (done) {
          let currentF = feedback === "Approved" ? changeto : current_status;
          ModelClient.findByIdAndUpdate(
            id,
            {
              $set: {
                feedback,
                currentFeedback: currentF,
              },
              $push: {
                Hist_Arbitrage: {
                  current_status,
                  changeto,
                  submitedBy,
                  checkedBy: nom,
                  commentaire,
                  feedback,
                },
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
          return res.status(200).json(result);
        } else {
          return res.status(201).json("Error");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const ReadArbitrage = async (req, res) => {
  try {
    const month = moment(new Date()).format("MM-YYYY");
    asyncLab.waterfall(
      [
        function (done) {
          ModelRole.aggregate([
            { $match: { idRole: req.user.role } },
            {
              $lookup: {
                from: "tfeedbacks",
                localField: "idRole",
                foreignField: "idRole",
                as: "feedback",
              },
            },
          ]).then((role) => {
            done(null, role[0]);
          });
        },
        function (role, done) {
          let idRoles = role.feedback.map(function (x) {
            return x.idFeedback;
          });

          if (role.filterBy === "all") {
            done(null, {
              feedback: { $in: ["Pending", "Rejected"] },
              actif: true,
              month,
            });
          }
          if (["region", "shop"].includes(role.filterBy)) {
            done(null, {
              [role.filterBy]: req.user.valueFilter,
              feedback: { $in: ["Pending", "Rejected"] },
              actif: true,
              currentFeedback: { $in: idRoles },
              month,
            });
          }
          if (role.filterBy === "currentFeedback") {
            done(null, {
              feedback: { $in: ["Pending", "Rejected"] },
              actif: true,
              currentFeedback: { $in: idRoles },
              month,
            });
          }
        },
        function (filter, done) {
          ModelClient.aggregate([
            { $match: filter },
            {
              $lookup: {
                from: "tfeedbacks",
                localField: "currentFeedback",
                foreignField: "idFeedback",
                as: "currentfeedback",
              },
            },
            {
              $lookup: {
                from: "tfeedbacks",
                localField: "changeto",
                foreignField: "idFeedback",
                as: "fchangeto",
              },
            },

            { $unwind: "$currentfeedback" },
            { $unwind: "$fchangeto" },
            {
              $lookup: {
                from: "roles",
                localField: "currentfeedback.idRole",
                foreignField: "idRole",
                as: "fcurrent_incharge",
              },
            },
            {
              $addFields: {
                id: "$_id",
                codeclient: "$codeclient",
                shop: "$shop",
                nomclient: "$nomclient",
                currentTitle: "$currentfeedback.title",
                currentfeedback: "$currentfeedback.idFeedback",
                current_incharge: "$fcurrent_incharge",
                changeto: "$fchangeto.idFeedback",
                changetotitle: "$fchangeto.title",
                par: "$par",
                submitedBy: "$submitedBy",
                feedback: "$feedback",
              },
            },
            {
              $project: {
                id: 1,
                codeclient: 1,
                currentTitle: 1,
                changetotitle: 1,
                shop: 1,
                nomclient: 1,
                currentfeedback: 1,
                current_incharge: 1,
                changeto: 1,
                par: 1,
                submitedBy: 1,
                feedback: 1,
              },
            },
          ])
            .then((result) => {
              done(result);
            })
            .catch(function (error) {
              console.log(error);
            });
        },
      ],
      function (result) {
        if (result) {
          return res.status(200).json(result);
        } else {
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const Arbitrage_File = async (req, res) => {
  try {
    const { data } = req.body;
    const { nom } = req.user;

    for (let i = 0; i < data.length; i++) {
      ModelClient.findByIdAndUpdate(
        data[i].id,
        {
          $set: {
            feedback: data[i].feedback,
            currentFeedback:
              data[i].feedback === "Approved"
                ? data[i].changeto
                : data[i].current_status,
          },
          $push: {
            Hist_Arbitrage: {
              current_status: data[i].current_status,
              changeto: data[i].changeto,
              submitedBy: data[i].submitedBy,
              checkedBy: nom,
              commentaire: data[i].commentaire,
              feedback: data[i].feedback,
            },
          },
        },
        { new: true }
      )
        .then(() => {})
        .catch(function (err) {
          console.log(err);
        });
    }
    return res.status(200).json("Done");
  } catch (error) {
    console.log(error);
  }
};
module.exports = { Arbitrage, ReadArbitrage, Arbitrage_File };
