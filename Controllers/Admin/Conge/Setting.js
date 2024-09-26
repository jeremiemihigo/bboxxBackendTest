const ModelAgent = require("../../../Models/AgentAdmin");

module.exports = {
  Update_Agent_Admin: (req, res) => {
    try {
      const { codeAgent, data } = req.body;
      if (!codeAgent || !data) {
        return res.status(201).json("Please fill in the fields");
      }
      ModelAgent.findOneAndUpdate(
        {
          codeAgent,
        },
        { $set: data },
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
          return res.status(201).json("Error " + err);
        });
    } catch (error) {
      console.log(error);
    }
  },
};
