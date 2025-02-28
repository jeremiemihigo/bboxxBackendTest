const ModelAgentAdmin = require("../Models/AgentAdmin");
const asyncLab = require("async");

//Corbeille done
const AddAdminAgent = async (req, res) => {
  try {
    const { nom, codeAgent, fonction, role } = req.body;
    //Agent admin qui fait l'operation
    if (!nom || !codeAgent || !fonction || !role) {
      return res.status(404).json("Veuillez renseigner les champs");
    }
    asyncLab.waterfall(
      [
        function (done) {
          ModelAgentAdmin.findOne({ codeAgent })
            .then((agent) => {
              if (agent) {
                return res.status(404).json("ce code existe deja");
              } else {
                done(null, agent);
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (agent, done) {
          ModelAgentAdmin.create({
            nom,
            password: "1234",
            fonction,
            codeAgent,
            role,
            id: new Date(),
          })
            .then((result) => {
              if (result) {
                done(result);
              }
            })
            .catch(function (err) {
              console.log(err);
              if (err) {
                return res.status(404).json("Error " + err);
              }
            });
        },
      ],
      function (result) {
        if (result) {
          return res.status(200).json(result);
        } else {
          return res.status(404).json("Erreur d'enregistrement");
        }
      }
    );
  } catch (error) {
    return res.status(404).json("Error");
  }
};
//Corbeille done
const ReadAgentAdmin = async (req, res) => {
  try {
    ModelAgentAdmin.find({ active: true })
      .lean()
      .then((agents) => {
        if (agents.length > 0) {
          return res.status(200).json(agents.reverse());
        } else {
          return res.status(200).json([]);
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
};
const BloquerAgentAdmin = async (req, res) => {
  try {
    const { id, value } = req.body;
    const { codeAgent } = req.user; //Agent admin qui fait l'operation
    if (!codeAgent || !id) {
      return res.status(201).json("Erreur");
    }
    asyncLab.waterfall(
      [
        function (done) {
          ModelAgentAdmin.findByIdAndUpdate(
            id,
            { $set: { active: value, first: true } },
            { new: true }
          )
            .then((response) => {
              if (response) {
                done(response);
              } else {
                return res.status(201).json("Erreur");
              }
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
          return res.status(200).json("Erreur");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const AddTache = async (req, res) => {
  try {
    const { codeAgent, tache } = req.body;
    ModelAgentAdmin.findOneAndUpdate(
      { codeAgent },
      { $addToSet: { taches: tache } },
      { new: true }
    )
      .then((result) => {
        if (result) {
          return res.status(200).json(result);
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
};
const AddSynchro = async (req, res) => {
  try {
    const { allShop, agent } = req.body;
    if (!agent || !allShop) {
      return res.status(201).json("Veuillez renseigner les champs");
    }
    ModelAgentAdmin.findOneAndUpdate(
      { codeAgent: agent },
      {
        $set: {
          synchro_shop: allShop,
        },
      },
      { new: true }
    )
      .then((result) => {
        if (result) {
          return res.status(200).json("Done");
        } else {
          return res.status(201).json("Error");
        }
      })
      .catch(function (err) {
        return res.status(200).json("Error " + err);
      });
  } catch (error) {
    console.log(error);
  }
};
const EditAgent = async (req, res) => {
  try {
    const { id, data } = req.body;
    if (!id || !data) {
      return res.status(404).json("Veuillez renseigner les champs");
    }
    ModelAgentAdmin.findByIdAndUpdate(id, { $set: data }, { new: true })
      .then((result) => {
        if (result) {
          return res.status(200).json(result);
        } else {
          return res.status(404).json("Error");
        }
      })
      .catch(function (err) {
        return res.status(404).json("Erro " + err);
      });
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  AddAdminAgent,
  ReadAgentAdmin,
  BloquerAgentAdmin,
  AddTache,
  AddSynchro,
  EditAgent,
};
