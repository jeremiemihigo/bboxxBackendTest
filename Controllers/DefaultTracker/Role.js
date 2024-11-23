const ModelRole = require("../../Models/DefaultTracker/Role");
const { generateString } = require("../../Static/Static_Function");

module.exports = {
  AddRoleDT: (req, res) => {
    try {
      const { title, filterBy } = req.body;
      console.log(req.body);
      if (!title || !filterBy) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      const idRole = generateString(5);
      ModelRole.create({
        title,
        idRole,
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
  },
  ReadRole: (req, res) => {
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
  },
};
