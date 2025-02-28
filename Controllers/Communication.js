const ModelCommuniquer = require("../Models/Communiquer");
const asyncLab = require("async");

const Communication = async (req, res) => {
  try {
    const { nom } = req.user;
    const { content, title, date, concerne } = req.body;

    if (!content || !title || !concerne || !date) {
      return res.status(404).json("Veuillez renseigner les champs");
    }
    asyncLab.waterfall(
      [
        function (done) {
          ModelCommuniquer.create({
            savedBy: nom,
            content,
            title,
            concerne,
            date,
          })
            .then((result) => {
              if (result) {
                done(result);
              } else {
                return res.status(404).json("Error");
              }
            })
            .catch(function (err) {
              return res.status(404).json("Error " + err);
            });
        },
      ],
      function (result) {
        return res.status(200).json(result);
      }
    );
  } catch (error) {
    return res.status(404).json("Error " + error);
  }
};
const ReadCommuniquer = async (req, res) => {
  try {
    ModelCommuniquer.find({})
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
};
const ReadCommuniquerAgent = async (req, res) => {
  try {
    const { fonction } = req.user;
    ModelCommuniquer.find({ concerne: { $in: [fonction, "all"] } })
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
};
const DeleteCommuniquer = async (req, res) => {
  try {
    const { id } = req.params;
    ModelCommuniquer.findByIdAndDelete(id)
      .then((result) => {
        if (result) {
          return res.status(200).json({ id });
        }
      })
      .catch(function (err) {
        return res.status(404).json("Erreur de suppression");
      });
  } catch (error) {
    console.log(error);
  }
};
const UpdateCommuniquer = async (req, res) => {
  try {
    const { id, data } = req.body;
    if (!id || !data) {
      return res.status(404).json("Veuillez renseigner les champs");
    }
    ModelCommuniquer.findByIdAndUpdate(id, { $set: data }, { new: true })
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
    console.log(error);
  }
};
module.exports = {
  Communication,
  ReadCommuniquer,
  ReadCommuniquerAgent,
  DeleteCommuniquer,
  UpdateCommuniquer,
};
