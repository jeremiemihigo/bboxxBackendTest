const ModelDatabase = require("../../Models/Portofolio/PDataBase");

const PDatabase = async (req, res) => {
  try {
    const { data } = req.body;
    ModelDatabase.insertMany(data)
      .then(() => {
        return res.status(200).json("Done");
      })
      .catch(function (error) {
        return res.status(201).json("Error " + error.message);
      });
  } catch (error) {
    return res.status(201).json("Error " + error.message);
  }
};
const ReadCustomerToTrack = async (req, res) => {
  try {
    const { search } = req.body;
    let recherche = { ...search };
    const today = new Date().getTime();
    recherche.remindDate = { $lt: today };
    ModelDatabase.aggregate([
      { $match: recherche },
      {
        $lookup: {
          from: "pfeedback_calls",
          let: { codeclient: "$codeclient", idPojet: "$idProjet" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$codeclient", "$$codeclient"] },
                    { $eq: ["$idProjet", "$$idProjet"] },
                  ],
                },
              },
            },
          ],
          as: "feedback",
        },
      },
    ])
      .then((result) => {
        return res.status(201).json(result);
      })
      .catch(function (error) {
        return res.status(201).json(error.message);
      });
  } catch (error) {
    console.log(error);
  }
};
module.exports = { PDatabase, ReadCustomerToTrack };
