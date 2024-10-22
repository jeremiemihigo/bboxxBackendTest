const { ObjectId } = require("mongodb");
const modelParametre = require("../Models/Parametre");
const modelPeriode = require("../Models/Periode");
const asyncLab = require("async");
const modelValve = require("../Models/Valve");
const moment = require("moment");

module.exports = {
  Parametre: (req, res) => {
    const { data } = req.body;
    try {
      modelParametre
        .insertMany(data)
        .then((response) => {
          if (response) {
            return res.status(200).json("Enregistrement effectuer");
          } else {
            return res.status(200).json("Erreur d'enregistrement");
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  ReadParametre: (req, res) => {
    const recherche = req.recherche;
    let match = recherche ? { $match: { _id: new ObjectId(recherche) } } : {};
    try {
      modelParametre
        .aggregate([
          match,
          {
            $lookup: {
              from: "zones",
              localField: "region",
              foreignField: "idZone",
              as: "region",
            },
          },
          {
            $unwind: "$region",
          },
          {
            $lookup: {
              from: "shops",
              localField: "shop",
              foreignField: "idShop",
              as: "shop",
            },
          },
          {
            $unwind: "$shop",
          },
        ])
        .then((response) => {
          let data = recherche ? response[0] : response;
          return res.status(200).json(data);
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },

  ReadPeriodeActive: (req, res) => {
    try {
      let periode = moment(new Date()).format("MM-YYYY");
      return res.status(200).json(periode);
    } catch (error) {
      console.log(error);
    }
  },
  deleteParams: (req, res) => {
    try {
      try {
        modelParametre.deleteMany().then((response) => {
          return res.status(200).json(response);
        });
      } catch (e) {
        print(e);
      }
    } catch (error) {
      console.log(error);
    }
  },
  rechercheClient: (req, res) => {
    try {
      const { codeclient } = req.params;
      modelParametre
        .aggregate([
          {
            $match: { customer: codeclient.toUpperCase().trim() },
          },
          {
            $lookup: {
              from: "zones",
              localField: "region",
              foreignField: "idZone",
              as: "region",
            },
          },
          {
            $unwind: "$region",
          },
          {
            $lookup: {
              from: "shops",
              localField: "shop",
              foreignField: "idShop",
              as: "shop",
            },
          },
          {
            $unwind: "$shop",
          },
          // {
          //   $lookup: {
          //     from: "rapports",
          //     localField: "customer",
          //     foreignField: "codeclient",
          //     as: "infoclient",
          //   },
          // },
        ])

        .then((result) => {
          if (result.length > 0) {
            //let visites = result[0].infoclient.reverse().slice(0, 4);
            return res.status(200).json({ info: result[0], visites: [] });
          } else {
            return res.status(201).json({ info: {}, visites: [] });
          }
        })
        .catch(function (err) {
          console.log(err);
        });

      // Executer le parallel
    } catch (error) {
      console.log(error);
    }
  },
  updateClient: (req, res, next) => {
    try {
      const { customer, nomClient, codeCu, idZone, idShop } = req.body;
      if (!nomClient || !codeCu || !idZone || !idShop) {
        return res
          .status(201)
          .json("Veuillez renseigner le nom, cu, region et shop du client");
      }

      asyncLab.waterfall([
        function (done) {
          modelParametre
            .findOneAndUpdate(
              { customer },
              {
                $set: {
                  customer_cu: codeCu,
                  shop: idShop,
                  region: idZone,
                  nomClient,
                },
              },
              {
                new: true,
              }
            )
            .then((response) => {
              done(null, response);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (client, done) {
          if (client) {
            req.recherche = client._id;
            next();
          }
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  },
  //set follow up
  setFollow_up: (req, res) => {
    try {
      const { data } = req.body;
      modelPeriode
        .updateOne({}, { $set: data }, { new: true })
        .then((result) => {
          if (result) {
            return res.status(200).json(result);
          } else {
            return res.status(201).json("Error");
          }
        })
        .catch(function (err) {
          return res.status(201).json("Error " + err);
        });
    } catch (error) {
      console.log(error);
    }
  },

  Add_Valve: (req, res) => {
    try {
      const io = req.io;
      const { nom } = req.user;
      const { body, title } = req.body;
      if (!body || !title) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      modelValve
        .create({
          body,
          title,
          savedBy: nom,
        })
        .then((result) => {
          if (result) {
            io.emit("valve", result);
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
  Read_Valve: (req, res) => {
    try {
      modelValve
        .find({})
        .lean()
        .then((result) => {
          return res.status(200).json(result.reverse());
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
};
