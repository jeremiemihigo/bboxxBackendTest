const modelPlainte = require("../../Models/Issue/Plaintes");
const modelTypePlainte = require("../../Models/Issue/TypePlainte");
const asyncLab = require("async");
const { generateString } = require("../../Static/Static_Function");

const AddPlainte = async (req, res, next) => {
  try {
    const { title, property } = req.body;
    if (!title || !property) {
      return res.status(400).json("Veuillez renseigner la plainte");
    }
    const id = generateString(4);
    asyncLab.waterfall(
      [
        function (done) {
          modelPlainte
            .create({ title, id, property })
            .then((result) => {
              if (result) {
                done(result);
              } else {
                return res.status(400).json("Erreur d'enregistrement");
              }
            })
            .catch(function (err) {
              return res.status(400).json("Error " + err);
            });
        },
      ],
      function (result) {
        req.recherche = result.id;
        next();
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const AddTitlePlainte = async (req, res, next) => {
  try {
    const {
      idPlainte,
      other,
      tableother,
      property,
      oneormany,
      ticket,
      adresse,
      title,
    } = req.body;
    if (!idPlainte || !title) {
      return res.status(400).json("Veuillez renseigner les champs");
    }
    asyncLab.waterfall(
      [
        function (done) {
          modelTypePlainte
            .create({
              idPlainte,
              property,
              adresse,
              other,
              tableother,
              ticket,
              oneormany,
              title,
              id: generateString(5),
            })
            .then((result) => {
              done(result);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ],
      function (result) {
        req.recherche = result.idPlainte;
        next();
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const ReadPlainte = async (req, res) => {
  try {
    const match = req.recherche
      ? { $match: { id: req.recherche } }
      : { $match: {} };
    modelPlainte
      .aggregate([
        match,
        {
          $lookup: {
            from: "typeplaintes",
            localField: "id",
            foreignField: "idPlainte",
            as: "alltype",
          },
        },
      ])
      .then((result) => {
        if (result) {
          let data = req.recherche ? result[0] : result.reverse();
          return res.status(200).json(data);
        } else {
          return res.status(200).json([]);
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
};
const ReadItem_Plainte = async (req, res) => {
  try {
    modelTypePlainte
      .find({})
      .lean()
      .then((result) => {
        if (result) {
          return res.status(200).json(result);
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
};
module.exports = { AddPlainte, AddTitlePlainte, ReadPlainte, ReadItem_Plainte };
