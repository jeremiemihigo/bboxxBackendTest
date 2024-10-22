const ModelAgent = require("../../../Models/AgentAdmin");
const ModelRegularisation = require("../../../Models/Admin/Regularisation");
const ModelSession = require("../../../Models/Admin/Session");
const ModelAgentRh = require("../../../Models/AgentRH");
const asyncLab = require("async");

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
  AddSession: (req, res) => {
    try {
      const { codeAgent, jours } = req.body;
      console.log(req.body);
      const { nom } = req.user;
      if (!codeAgent || !jours) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      const new_session = new Date().getTime();

      asyncLab.waterfall(
        [
          function (done) {
            ModelSession.findOne({ codeAgent, active: true })
              .lean()
              .then((result) => {
                if (result) {
                  return res.status(201).json("Une autre session est encours");
                } else {
                  done(null, result);
                }
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
              });
          },
          function (sess, done) {
            ModelSession.create({
              codeAgent,
              doBy: nom,
              session: new_session,
              active: true,
              jours,
            })
              .then((result) => {
                if (result) {
                  done(null, result);
                } else {
                  return res.status(201).json("Error");
                }
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
              });
          },
          function (session, done) {
            ModelAgentRh.findOneAndUpdate(
              { codeAgent },
              { $set: { id_session: session.session } },
              { new: true }
            )
              .then((updated) => {
                done(updated);
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
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
      return res.status(201).json("Error " + error);
    }
  },
  AddRegularisation: (req, res) => {
    try {
      const { nombre, raison, codeAgent } = req.body;
      const doBy = req.user.nom;
      if (!nombre || !raison) {
      }

      asyncLab.waterfall(
        [
          function (done) {
            ModelSession.findOne({ active: true, codeAgent })
              .lean()
              .then((session) => {
                if (session) {
                  done(null, session);
                } else {
                  return res.status(201).json("Error");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (sessions, done) {
            ModelRegularisation.create({
              nombre,
              doBy,
              raison,
              session: sessions.session,
            })
              .then((regulerSave) => {
                if (regulerSave) {
                  done(null, regulerSave);
                } else {
                  return res.status(201).json("Error");
                }
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
              });
          },
          function (reguler, done) {
            ModelSession.findOneAndUpdate(
              { session: reguler.session },
              { $inc: { jours: parseInt(nombre) } },
              { new: true }
            )
              .then((result) => {
                done(result);
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
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
      return res.status(201).json("Error " + error);
    }
  },
};
