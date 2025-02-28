const ModelCorbeille = require("../Models/Corbeille");
const ReadCorbeille = async (req, res) => {
  try {
    ModelCorbeille.find({})
      .lean()
      .then((result) => {
        return res.status(200).json(result.reverse());
      });
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  ReadCorbeille,
};
