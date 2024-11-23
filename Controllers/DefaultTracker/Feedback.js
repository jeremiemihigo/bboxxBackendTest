const ModelFeedback = require("../../Models/DefaultTracker/Feedback");
const { generateString } = require("../../Static/Static_Function");

module.exports = {
  AddFeedback: (req, res) => {
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
  },
  AddRole: (req, res) => {
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
  },
  ReadFeedback: (req, res) => {
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
  },
  Editfeedback: (req, res) => {
    try {
      console.log(req.body);
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
  },
};
