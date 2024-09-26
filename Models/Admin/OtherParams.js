const { generateString } = require("../../Static/Static_Function");
const ModelAgentAdmin = require("../AgentAdmin");
const asyncLab = require("async");

module.exports = {
  AffecterSession: (req, res) => {
    try {
      const { codeAgent } = req.body;
      asyncLab.waterfall(
        [
          function (done) {
            ModelAgentAdmin.findOne({ codeAgent })
              .lean()
              .then((result) => {
                if (result) {
                  done(null, result);
                } else {
                  return res.status(201).json("L'agent est introuvable");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (result, done) {
            ModelAgentAdmin.findByIdAndUpdate(
              result._id,
              {
                $set: { id_session: generateString(10) },
              },
              { new: true }
            )
              .then((data) => {
                done(data);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
        ],
        function (data) {
          if (data) {
            return res.status(200).json(data);
          } else {
            return res.status(201).json("Error");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
};
