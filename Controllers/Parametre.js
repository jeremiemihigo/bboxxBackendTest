const { ObjectId } = require("mongodb");
const modelParametre = require("../Models/Parametre");
const modelPeriode = require("../Models/Periode");

const Parametre = async (req, res) => {
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
};
const deleteParams = async (req, res) => {
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
};
const rechercheClient = async (req, res) => {
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
};
const SetFeedback = async (req, res) => {
  try {
    const { title } = req.body;
    const { nom } = req.user;
    if (!title) {
      return res.status(201).json("Veuillez renseigner le champs");
    }
    modelPeriode
      .findOneAndUpdate(
        {},
        {
          $addToSet: {
            feedbackvm: {
              title,
              savedby: nom,
            },
          },
        },
        { new: true }
      )
      .then((result) => {
        if (result) {
          return res.status(200).json(result);
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (error) {}
};
const DeleteOneItem = async (req, res) => {
  const { id } = req.body;
  modelPeriode
    .updateOne(
      {},
      { $pull: { feedbackvm: { _id: new ObjectId(id) } } },
      { new: true }
    )
    .then((result) => {
      if (result) {
        return res.status(200).json(id);
      } else {
        return res.status(201).json("This feedback no longer exists");
      }
    })
    .catch(function (err) {
      return res.status(201).json("Error " + err);
    });
};
const ReadParametre = async (req, res) => {
  try {
    modelPeriode
      .find({})
      .lean()
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
module.exports = {
  Parametre,
  deleteParams,
  rechercheClient,
  SetFeedback,
  DeleteOneItem,
  ReadParametre,
};
