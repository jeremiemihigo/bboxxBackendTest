const asyncLab = require("async");
const modelPlainte = require("../../../Models/Issue/Appel_Issue");
const moment = require("moment");

module.exports = {
  ReadTech: (req, res) => {
    try {
      const { codeAgent } = req.user;
      modelPlainte
        .find({ "technicien.codeTech": codeAgent, open: true })
        .then((result) => {
          if (result) {
            return res.status(200).json(result.reverse());
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  //Read All plainte
  Readclient: (req, res) => {
    try {
      const {
        synchro_shop,
        backOffice_plainte,
        plainteShop,
        plainte_callcenter,
        fonction,
        nom,
      } = req.user;
      const dates = new Date().toISOString().split("T")[0];
      const periode = moment(new Date()).format("MM-YYYY");
      asyncLab.waterfall(
        [
          function (done) {
            if (backOffice_plainte && fonction === "co") {
              let match = {
                $or: [
                  {
                    dateSave: { $lte: new Date(dates), $gte: new Date(dates) },
                  },
                  { open: true },
                ],
              };
              done(null, match);
            }
            if (fonction === "superUser") {
              let match = {
                $or: [
                  {
                    dateSave: { $lte: new Date(dates), $gte: new Date(dates) },
                  },
                  { open: true },
                ],
                periode: periode,
              };
              done(null, match);
            }
            if (
              synchro_shop &&
              synchro_shop.length > 0 &&
              !backOffice_plainte &&
              fonction === "co"
            ) {
              let match = {
                type: "ticket",
                periode: periode,
                shop: { $in: synchro_shop },
              };
              done(null, match);
            }
            if (synchro_shop && synchro_shop.length > 0 && backOffice_plainte) {
              let match = {
                $or: [
                  {
                    type: "ticket",
                    periode: periode,
                    shop: { $in: synchro_shop },
                  },
                  { open: true, type: "support" },
                ],
              };

              done(null, match);
            }
            if (plainteShop && fonction === "admin") {
              let match = {
                $or: [
                  {
                    dateSave: { $lte: new Date(dates), $gte: new Date(dates) },
                  },
                  { open: true },
                ],
                periode: periode,
                shop: plainteShop,
              };
              done(null, match);
            }
            if (
              plainte_callcenter &&
              fonction === "co" &&
              !backOffice_plainte
            ) {
              let match = {
                $or: [
                  {
                    dateSave: { $lte: new Date(dates), $gte: new Date(dates) },
                    submitedBy: nom,
                  },
                  { open: true, submitedBy: nom },
                  { statut: "awaiting_confirmation", open: true },
                ],
                periode: periode,
              };
              done(null, match);
            }
          },
          function (filter, done) {
            modelPlainte
              .aggregate([
                { $match: filter },
                {
                  $lookup: {
                    from: "messages",
                    localField: "idPlainte",
                    foreignField: "idPlainte",
                    as: "message",
                  },
                },
              ])
              .then((plainte) => {
                done(plainte);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
        ],
        function (plainte) {
          if (plainte.length > 0) {
            return res.status(200).json(plainte);
          } else {
            return res.status(200).json([]);
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  ReadMy_Backoffice: (req, res) => {
    try {
      const { nom } = req.user;
      const dates = new Date().toISOString().split("T")[0];
      modelPlainte
        .aggregate([
          {
            $match: {
              $or: [
                { dateSave: { $lte: new Date(dates), $gte: new Date(dates) } },
                { open: true },
              ],
              submitedBy: nom,
              operation: "backoffice",
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
  },
  ReadOneComplaint: (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(201).json("Error");
      }
      modelPlainte
        .aggregate([
          { $match: { idPlainte: id } },
          {
            $lookup: {
              from: "messages",
              localField: "idPlainte",
              foreignField: "idPlainte",
              as: "message",
            },
          },
        ])
        .then((result) => {
          if (result.length > 0) {
            return res.status(200).json(result);
          } else {
            return res.status(201).json("Error");
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
};
