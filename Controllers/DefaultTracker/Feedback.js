const ModelFeedback = require("../../Models/DefaultTracker/Feedback");
const { generateString } = require("../../Static/Static_Function");
const ModelRole = require("../../Models/DefaultTracker/Role");
const asyncLab = require("async");
const _ = require("lodash");

const AddFeedback = async (req, res) => {
  try {
    const { title, delai, idRole } = req.body;
    if (!title || !delai || idRole.length === 0) {
      return res.status(201).json("Veuillez renseigner les champs");
    }
    const idFeedback = generateString(6);
    ModelFeedback.create({
      title,
      idFeedback,
      idRole,
      delai,
    })
      .then((result) => {
        if (result) {
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
const AddRole = async (req, res) => {
  try {
    const { id, newId } = req.body;
    ModelFeedback.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          idRole: newId,
        },
      },
      { new: true }
    )
      .then((result) => {
        if (result) {
          return res.status(200).json(result);
        } else {
          return res.status(201).json("Error");
        }
      })
      .catch(function (err) {
        return res.status(201).json("Error : " + err);
      });
  } catch (error) {
    console.log(error);
  }
};
const ReadFeedback = async (req, res) => {
  try {
    ModelFeedback.find({})
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
const Editfeedback = async (req, res) => {
  try {
    const { id, data } = req.body;

    ModelFeedback.findByIdAndUpdate(id, { $set: data }, { new: true })
      .then((result) => {
        if (result) {
          return res.status(200).json(result);
        } else {
          return res.status(404).json("Error");
        }
      })
      .catch(function (err) {
        return res.status(404).json("Error " + err);
      });
  } catch (error) {
    return res.status(404).json("Error " + error);
  }
};
const MesFeedback = async (req, res) => {
  try {
    const { role } = req.user;
    asyncLab.waterfall(
      [
        function (done) {
          ModelRole.findOne(
            { idRole: role },
            { filterBy: 1, title: 1, idRole: 1 }
          )
            .lean()
            .then((result) => {
              done(null, result);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (departement, done) {
          const { filterBy } = departement;

          ModelFeedback.find({ idRole: role })
            .then((feedback) => {
              done(feedback, filterBy);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ],
      function (result, filterBy) {
        let x = result.map((x) => {
          return x.idFeedback;
        });
        return res.status(200).json({ result: x, filterBy });
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const GraphiqueFeedback = async (req, res) => {
  try {
    ModelFeedback.aggregate([
      { $unwind: "$idRole" },
      {
        $group: {
          _id: "$idRole",
          total: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "_id",
          foreignField: "idRole",
          as: "role",
        },
      },
      { $unwind: "$role" },
      { $addFields: { title: "$role.title" } },
      { $project: { _id: 0, role: 0 } },
    ]).then((result) => {
      let series = [];
      let label = [];
      for (let i = 0; i < result.length; i++) {
        series.push(result[i].total);
        label.push(result[i].title);
      }
      return res.status(200).json({ label, series });
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  AddFeedback,
  AddRole,
  ReadFeedback,
  Editfeedback,
  MesFeedback,
  GraphiqueFeedback,
};
