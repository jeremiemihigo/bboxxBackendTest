const { ObjectId } = require("mongodb");
const modelAgent = require("../Models/Agent");
const asyncLab = require("async");
const { generateNumber } = require("../Static/Static_Function");

const AddAgent = async (req, res, next) => {
  try {
    const { nom, codeAgent, fonction, telephone, idZone, idShop } = req.body;
    if (!nom || !codeAgent || !fonction || !idZone) {
      return res.status(400).json("Veuillez renseigner les champs");
    }
    asyncLab.waterfall(
      [
        function (done) {
          modelAgent
            .findOne({ codeAgent: codeAgent.trim() })
            .then((agent) => {
              if (agent) {
                return res.status(400).json("L'agent existe déjà");
              } else {
                done(null, agent);
              }
            })
            .catch(function (err) {
              console.log(err);
              return res.status(400).json("Erreur");
            });
        },
        function (agent, done) {
          let pass = generateNumber(4);
          modelAgent
            .create({
              nom,
              password: pass,
              codeAgent,
              pass,
              codeZone: idZone,
              fonction,
              savedBy: req.user.codeAgent,
              idShop,
              telephone,
              id: new Date(),
            })
            .then((response) => {
              if (response) {
                done(response);
              } else {
                return res.status(400).json("Erreur d'enregistrement");
              }
            })
            .catch(function (err) {
              return res.status(400).json("Error " + err.message);
            });
        },
      ],
      function (result) {
        if (result) {
          req.recherche = result._id;
          next();
        } else {
          return res.status(400).json("Erreur");
        }
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(400).json("Erreur d'enregistrement");
  }
};
const ReadAgent = async (req, res) => {
  const recherche = req.recherche;
  const matched = req.user.fonction === "superUser" ? {} : { active: true };

  let match = recherche
    ? { $match: { _id: new ObjectId(recherche) } }
    : { $match: matched };
  try {
    modelAgent
      .aggregate([
        match,
        {
          $lookup: {
            from: "zones",
            localField: "codeZone",
            foreignField: "idZone",
            as: "region",
          },
        },
        {
          $lookup: {
            from: "shops",
            localField: "idShop",
            foreignField: "idShop",
            as: "shop",
          },
        },
        {
          $unwind: "$region",
        },
        {
          $sort: { nom: -1 },
        },
        {
          $project: {
            password: 0,
            __v: 0,
          },
        },
      ])
      .then((response) => {
        return recherche
          ? res.status(200).json(response[0])
          : res.status(200).json(response.reverse());
      });
  } catch (error) {
    console.log(error);
  }
};
const BloquerAgent = async (req, res, next) => {
  try {
    const { id, value } = req.body;
    modelAgent
      .findByIdAndUpdate(
        id,
        { active: value, bloquedBy: req.user.codeAgent },
        { new: true }
      )
      .then((result) => {
        if (result) {
          req.recherche = id;
          next();
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
};
const UpdateAgent = async (req, res, next) => {
  try {
    const { _id, nom, fonction, telephone, idShop, idZone } = req.body;

    asyncLab.waterfall(
      [
        function (done) {
          modelAgent
            .findByIdAndUpdate(
              _id,
              {
                $set: {
                  nom,
                  fonction,
                  idShop,
                  telephone,
                  codeZone: idZone,
                },
              },
              { new: true }
            )
            .then((response) => {
              if (response) {
                done(response);
              } else {
                return res.status(400).json("Erreur");
              }
            })
            .catch(function (err) {
              return res.status(400).json("Error");
            });
        },
      ],
      function (result) {
        req.recherche = result._id;
        next();
      }
    );
  } catch (error) {
    console.log(error);
  }
};
module.exports = { AddAgent, ReadAgent, BloquerAgent, UpdateAgent };
