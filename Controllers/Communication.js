const Communication = require("../Models/Communiquer");
const asyncLab = require("async");

module.exports = {
  Communication: (req, res) => {
    try {
      const { nom } = req.user;
      const { content, title, date, concerne } = req.body;

      if (!content || !title || !concerne || !date) {
        return res.status(404).json("Veuillez renseigner les champs");
      }
      asyncLab.waterfall(
        [
          function (done) {
            Communication.create({
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
  },
  ReadCommuniquer: (req, res) => {
    try {
      Communication.find({})
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
  ReadCommuniquerAgent: (req, res) => {
    try {
      const { fonction } = req.user;
      Communication.find({ concerne: { $in: [fonction, "all"] } })
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
  DeleteCommuniquer: (req, res) => {
    try {
      const { id } = req.params;
      Communication.findByIdAndDelete(id)
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
  },
  UpdateCommuniquer: (req, res) => {
    try {
      const { id, data } = req.body;
      if (!id || !data) {
        return res.status(404).json("Veuillez renseigner les champs");
      }
      Communication.findByIdAndUpdate(id, { $set: data }, { new: true })
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
  },
};
