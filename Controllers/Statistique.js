const modelDemande = require("../Models/Demande");
const _ = require("lodash");
const asyncLab = require("async");
const moment = require("moment");
const Report = require("../Models/Rapport");

module.exports = {
  demandePourChaquePeriode: (req, res) => {
    try {
      Report.aggregate([
        {
          $group: {
            _id: "$demande.lot",
            total: { $sum: 1 },
          },
        },
        {
          $sort: { _id: -1 },
        },
      ]).then((result) => {
        return res.status(200).json(result.reverse());
      });
    } catch (error) {
      console.log(error);
    }
  },
  readPeriodeGroup: (req, res) => {
    try {
      const { codeAgent } = req.user;
      const periode = moment(new Date()).format("MM-YYYY");
      asyncLab.waterfall([
        function (done) {
          modelDemande
            .aggregate([
              {
                $match: {
                  codeAgent,
                  lot: periode,
                },
              },
              {
                $lookup: {
                  from: "rapports",
                  localField: "idDemande",
                  foreignField: "idDemande",
                  as: "reponse",
                },
              },
              {
                $lookup: {
                  from: "conversations",
                  localField: "_id",
                  foreignField: "code",
                  as: "conversation",
                },
              },
            ])
            .then((response) => {
              done(null, response.reverse());
            });
        },
        function (reponse, done) {
          let table = [];
          table.push({
            _id: periode,
            attente: reponse.filter(
              (x) => x.reponse.length < 1 && x.feedback === "new"
            ),
            nConforme: reponse.filter(
              (x) =>
                x.reponse.length === 0 &&
                x.feedback === "chat" &&
                x?.typeVisit?.followup === "visit"
            ),
            followup: reponse.filter(
              (x) =>
                (x.reponse.length > 0 && x.reponse[0].followup === true) ||
                x?.typeVisit?.followup === "followup"
            ),
            valide: reponse.filter((x) => x.reponse.length > 0),
            allData: reponse,
          });
          res.status(200).json(table);
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  },

  chercherUneDemande: (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(201).json("Le code de la visite est obligatoire");
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelDemande
              .aggregate([
                { $match: { idDemande: id } },
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
                    from: "rapports",
                    localField: "idDemande",
                    foreignField: "idDemande",
                    as: "reponse",
                  },
                },
                {
                  $lookup: {
                    from: "conversations",
                    localField: "_id",
                    foreignField: "code",
                    as: "messages",
                  },
                },
              ])
              .then((response) => {
                done(response);
              });
          },
        ],
        function (result) {
          if (result) {
            return res.status(200).json(result);
          } else {
            return res.status(201).json("Code incorrect");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
};
