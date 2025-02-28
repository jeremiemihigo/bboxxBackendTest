const ModelRole = require("../../Models/DefaultTracker/Role");
const { generateString } = require("../../Static/Static_Function");

const AddRoleDT = async (req, res) => {
  try {
    const { title, filterBy, type } = req.body;

    if (!title || !filterBy) {
      return res.status(201).json("Veuillez renseigner les champs");
    }
    const idRole = generateString(5);
    ModelRole.create({
      title,
      idRole,
      type,
      filterBy,
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
const ReadRole = async (req, res) => {
  try {
    ModelRole.find({})
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
const EditRole = async (req, res) => {
  try {
    const { id, data } = req.body;
    if (!id || !data) {
      return res.status(404).json("ERROR");
    }
    ModelRole.findByIdAndUpdate(id, { $set: data }, { new: true })
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (error) {
        return res.status(404).json(JSON.stringify(error));
      });
  } catch (error) {
    console.log(error);
  }
};
module.exports = { AddRoleDT, ReadRole, EditRole };
