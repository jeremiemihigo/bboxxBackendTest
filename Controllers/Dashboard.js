const ModelRapport = require("../Models/Rapport");

const asyncLab = require("async");
const { returnLastFirstDate } = require("../Static/Static_Function");

const AnalyseVisites = async (req, res) => {
  try {
    const { date } = req.body;
    const { lastDate, firstDate } = returnLastFirstDate(date);
    const currentDate = new Date(date);
    currentDate.setDate(1);
    const l = currentDate.toISOString().split("T")[0];
    const lastNowDate = new Date(l);
    const today = new Date(new Date(date).toISOString().split("T")[0]);

    asyncLab.waterfall(
      [
        function (done) {
          ModelRapport.aggregate([
            {
              $match: {
                "demandeur.fonction": { $in: ["agent", "tech"] },
              },
            },
            {
              $project: {
                formattedDate: {
                  $toDate: {
                    $concat: [
                      {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$demande.updatedAt",
                        },
                      },
                      "T00:00:00Z",
                    ],
                  },
                },
                codeclient: 1,
                idZone: 1,
                idShop: 1,
                _id: 0,
                fonction: "$demandeur.fonction",
              },
            },
            {
              $match: {
                formattedDate: { $lte: lastDate, $gte: firstDate },
              },
            },
          ])
            .then((result) => {
              done(null, result);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (last_visite, done) {
          ModelRapport.aggregate([
            {
              $match: {
                "demandeur.fonction": { $in: ["agent", "tech"] },
              },
            },
            {
              $project: {
                formattedDate: {
                  $toDate: {
                    $concat: [
                      {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$demande.updatedAt",
                        },
                      },
                      "T00:00:00Z",
                    ],
                  },
                },
                codeclient: 1,
                idZone: 1,
                idShop: 1,
                _id: 0,
                fonction: "$demandeur.fonction",
              },
            },
            {
              $match: {
                formattedDate: { $lte: today, $gte: lastNowDate },
              },
            },
          ])
            .then((result) => {
              done(last_visite, result);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ],
      function (last_month, this_month) {
        return res
          .status(200)
          .json({ last_month, lastDate, today, this_month });
      }
    );
  } catch (error) {}
};
module.exports = {
  AnalyseVisites,
};
