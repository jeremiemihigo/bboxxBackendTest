const modelTypeConge = require("../../../Models/Admin/TypeConge ");
const asyncLab = require("async");
const { generateNumber } = require("../../../Static/Static_Function");
const _Empty_Field = "Please fill in the fields";

module.exports = {
  AddTypeConge: (req, res) => {
    try {
      const { type, duree } = req.body;
      if (!type || !duree) {
        return res.status(201).json(_Empty_Field);
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelTypeConge
              .findOne({ type: type.toUpperCase() })
              .then((response) => {
                if (response) {
                  return res.status(201).json("" + type + " existe deja");
                } else {
                  done(null, false);
                }
              })
              .catch(function (err) {
                return res.status(404).json("Erreur " + err);
              });
          },
          function (conge, done) {
            modelTypeConge
              .create({
                type,
                duree,
                codeType: generateNumber(4),
              })
              .then((result) => {
                done(result);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
        ],
        function (result) {
          if (result) {
            return res.status(200).json(result);
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
