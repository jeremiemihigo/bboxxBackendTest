const modelInformation = require("../../Models/Issue/Renseignement");

const AddInformation = async (req, res) => {
  try {
    const { nomClient, contact, about, shop, origin } = req.body;
    const { nom } = req.user;
    if (!about || !nomClient || !contact) {
      return res.status(201).json("Veuillez renseigner les champs");
    }
    const date = new Date().toISOString().split("T")[0];

    modelInformation
      .create({
        nomClient,
        contact,
        about,
        date,
        shop,
        origin,
        savedBy: nom,
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
module.exports = { AddInformation };
