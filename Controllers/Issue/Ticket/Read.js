const asyncLab = require("async");
const modelPlainte = require("../../../Models/Issue/Appel_Issue");
const moment = require("moment");

const ReadTech = async (req, res) => {
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
};
//Read All plainte
const Readclient = async (req, res) => {
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
          if (
            backOffice_plainte &&
            fonction === "co" &&
            (!synchro_shop || synchro_shop.length === 0)
          ) {
            let match = {
              $or: [
                {
                  dateSave: { $lte: new Date(dates), $gte: new Date(dates) },
                  periode,
                },
                { open: true, operation: "backoffice" },
                { open: true, statut: "awaiting_confirmation" },
              ],
            };
            done(null, match);
          }
          if (fonction === "superUser") {
            let match = {
              $or: [
                {
                  dateSave: { $lte: new Date(dates), $gte: new Date(dates) },
                  periode,
                },
                { open: true, periode },
                { operation: "backoffice", open: true },
              ],
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
              $or: [
                {
                  type: "ticket",
                  periode,
                  open: true,
                  // shop: { $in: synchro_shop },
                },
              ],
            };
            done(null, match);
          }
          if (synchro_shop && synchro_shop.length > 0 && backOffice_plainte) {
            let match = {
              $or: [
                {
                  type: "ticket",
                  periode,
                  open: true,
                  // shop: { $in: synchro_shop },
                },
                {
                  open: true,
                  type: "support",
                  periode,
                },
                { open: true, operation: "backoffice" },
              ],
            };
            done(null, match);
          }
          if (plainteShop && fonction === "admin" && !backOffice_plainte) {
            let match = {
              $or: [
                {
                  dateSave: { $lte: new Date(dates), $gte: new Date(dates) },

                  shop: plainteShop,
                },
                { open: true, operation: "backoffice", shop: plainteShop },
                { open: true, shop: plainteShop, periode },
              ],
            };
            done(null, match);
          }
          if (plainteShop && fonction === "admin" && backOffice_plainte) {
            let match = {
              $or: [
                {
                  dateSave: { $lte: new Date(dates), $gte: new Date(dates) },
                  shop: plainteShop,
                },
                { open: true, operation: "backoffice" },
                { open: true, shop: plainteShop, periode },
              ],
            };
            done(null, match);
          }
          if (plainte_callcenter && fonction === "co" && !backOffice_plainte) {
            let match = {
              $or: [
                {
                  dateSave: { $lte: new Date(dates), $gte: new Date(dates) },
                  submitedBy: nom,
                },
                { open: true, submitedBy: nom, periode: periode },
                {
                  statut: "awaiting_confirmation",
                  open: true,
                },
                { open: true, operation: "backoffice" },
              ],
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
};
const ReadMy_Backoffice = async (req, res) => {
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
        return res.status(200).json(result);
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
};
const ReadOneComplaint = async (req, res) => {
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
};
const ReadData_Backoffice = async (req, res) => {
  try {
    const now = moment(new Date()).format("MM-YYYY");
    modelPlainte
      .aggregate([
        {
          $match: {
            periode: now,
            operation: "backoffice",
            open: false,
          },
        },
        { $group: { _id: "$delai", total: { $sum: 1 } } },
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
const Mydeedline = async (req, res) => {
  try {
    const { type } = req.params;
    const { nom } = req.user;
    const periode = moment(new Date()).format("MM-YYYY");
    const back =
      type !== "backoffice"
        ? {
            $match: {
              "resultat.nomAgent": nom,
            },
          }
        : {
            $match: {
              closeBy: nom,
            },
          };
    asyncLab.waterfall([
      function (done) {
        modelPlainte
          .aggregate([
            { $match: { periode: periode, open: false } },
            { $unwind: "$resultat" },
            back,
            {
              $project: {
                "resultat.delai": 1,
                delai: 1,
              },
            },
          ])
          .then((result) => {
            if (result.length > 0) {
              let insla = result.filter(
                (x) => x.resultat.delai === "IN SLA" || x.delai === "IN SLA"
              );
              let pourcentage = (insla.length * 100) / result.length;
              return res.status(200).json(pourcentage.toFixed(0));
            } else {
              return res.status(200).json(100);
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
module.exports = {
  ReadTech,
  Readclient,
  Mydeedline,
  ReadMy_Backoffice,
  ReadData_Backoffice,
  ReadOneComplaint,
};
