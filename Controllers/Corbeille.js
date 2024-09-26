const ModelCorbeille = require("../Models/Corbeille");

module.exports = {
  ReadCorbeille: (req, res) => {
    try {
      ModelCorbeille.find({})
        .lean()
        .then((result) => {
          return res.status(200).json(result.reverse());
        });
    } catch (error) {
      console.log(error);
    }
  },
};
