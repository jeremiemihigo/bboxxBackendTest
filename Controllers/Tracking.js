const modelRapport = require("../Models/Rapport");
const asyncLab = require("async");
const modelPeriode = require("../Models/Periode");
const _ = require("lodash");
const moment = require("moment");

module.exports = {
  Visited: (req, res) => {
    try {
      const { client } = req.body;
      if (!client && client.length < 1) {
        return res.status(201).json("Aucun client envoyer");
      }
      const periode = moment(new Date()).format("MM-YYYY");
      asyncLab.waterfall(
        [
          function (done) {
            modelRapport
              .find({
                codeclient: { $in: client },
                "demande.lot": periode,
              })
              .lean()
              .then((result) => {
                if (result.length > 0) {
                  done(null, result);
                } else {
                  return res.status(201).json("Aucune visite deja effectuee");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (result, done) {
            let grouped = _.groupBy(result, "codeclient");
            let cle = Object.keys(grouped);
            let table = [];
            for (let i = 0; i < cle.length; i++) {
              if (grouped["" + cle[i]].length > 1) {
                table.push(grouped["" + cle[i]][1]);
              } else {
                table.push(grouped["" + cle[i]][0]);
              }
            }
            done(table);
          },
        ],
        function (result) {
          return res.status(200).json(result);
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
};
