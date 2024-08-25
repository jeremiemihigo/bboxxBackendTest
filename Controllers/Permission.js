const modelAgent = require("../Models/AgentAdmin");

module.exports = {
  set_Plainte_Shop: (req, res) => {
    try {
      const { idAgent, shop } = req.body;
      if (!idAgent || !shop) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      modelAgent
        .findByIdAndUpdate(
          idAgent,
          {
            $set: {
              plainteShop: shop,
            },
          },
          { new: true }
        )
        .then((result) => {
          if (result) {
            return res.status(200).json(result);
          } else {
            return res.status(404).json("Error");
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  set_backOffice: (req, res) => {
    try {
      const { idAgent, data } = req.body;
      modelAgent
        .findByIdAndUpdate(
          idAgent,
          {
            $set: data,
          },
          { new: true }
        )
        .then((result) => {
          if (result) {
            return res.status(200).json(result);
          } else {
            return res.status(404).json("Error");
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {}
  },
};
