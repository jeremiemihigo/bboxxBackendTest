const ModelServey = require("../../Models/AgentTerrain/ServeyTerrain");
const asyncLab = require("async");
const ModelQuestion = require("../../Models/AgentTerrain/Question");
const ModelReponseServey = require("../../Models/AgentTerrain/ReponseServer");
const ModelAgent = require("../../Models/Agent");
const _ = require("lodash");

const AddServey = async (req, res) => {
  try {
    const { title, concerne, subtitle, dateFin } = req.body;
    if (!title || !concerne || !dateFin) {
      return res.status(201).json("Veuillez renseigner les champs vides");
    }
    const id = new Date().getTime();
    const { nom } = req.user;
    ModelServey.create({
      title,
      idServey: id,
      subtitle,
      concerne,
      dateFin,
      savedby: nom,
    })
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (err) {
        return res.status(201).json(err);
      });
  } catch (error) {
    console.log(error);
  }
};
const PostReponse = async (req, res) => {
  try {
    const { codeAgent } = req.user;
    const { idServey, reponse } = req.body;

    if (!idServey || reponse.length === 0) {
      return res.status(201).json("Veuillez renseigner les champs vides");
    }
    let response = reponse.map(function (x) {
      return {
        ...x,
        codeAgent,
        idServey,
      };
    });
    asyncLab.waterfall([
      function (done) {
        ModelAgent.findOneAndUpdate(
          { codeAgent },
          { $addToSet: { servey: idServey } }
        )
          .then((result) => {
            done(null, result);
          })
          .catch(function (err) {
            console.log(err);
          });
      },
      function (agent, done) {
        ModelReponseServey.insertMany(response)
          .then((result) => {
            return res.status(200).json("Done");
          })
          .catch(function (err) {
            return res.status(201).json(JSON.stringify(err));
          });
      },
    ]);
  } catch (error) {
    console.log(error);
  }
};
const ReadServey = async (req, res) => {
  try {
    const { fonction } = req.user;
    let fetch = ["all"];
    fetch.push(fonction);
    ModelServey.find({ active: true, concerne: { $in: fetch } })
      .lean()
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (err) {
        return res.status(201).json("Error");
      });
  } catch (error) {
    return res.status(201).json("Error");
  }
};
const ReadAll = async (req, res) => {
  try {
    ModelServey.find({})
      .lean()
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch(function (err) {
        return res.status(201).json("Error");
      });
  } catch (error) {
    return res.status(201).json(JSON.stringify(error));
  }
};
const ReadAllReponse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(201).json("Error");
    }
    asyncLab.waterfall(
      [
        function (done) {
          ModelServey.findOne({ idServey: id })
            .lean()
            .then((servey) => {
              done(null, servey);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        //questions
        function (servey, done) {
          ModelQuestion.find({ idServey: id })
            .then((questions) => {
              done(servey, questions);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ],
      function (servey, questions) {
        return res.status(200).json({ servey, questions });
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const ReadServeyAgent = async (req, res) => {
  try {
    const { fonction, servey } = req.user;
    const date = new Date();
    ModelServey.aggregate([
      { $match: { dateFin: { $gte: date }, concerne: fonction } },
      {
        $lookup: {
          from: "questions",
          localField: "idServey",
          foreignField: "idServey",
          as: "question",
        },
      },
    ])
      .then((result) => {
        if (servey && !servey.includes(result[0]?.idServey)) {
          return res.status(200).json(result);
        }
        if (!servey) {
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
const MakeFile = async (req, res) => {
  try {
    const { idServey } = req.params;
    if (!idServey) return;
    asyncLab.waterfall([
      function (done) {
        ModelQuestion.find({ idServey }, { question: 1, idQuestion: 1 })
          .lean()
          .then((questions) => {
            done(null, questions);
          })
          .catch(function (error) {
            console.log(error);
          });
      },
      function (questions, done) {
        ModelReponseServey.find(
          { idServey },
          { idQuestion: 1, reponse: 1, codeAgent: 1 }
        )
          .lean()
          .then((reponse) => {
            done(null, questions, reponse);
          })
          .catch(function (error) {
            console.log(error);
          });
      },
      function (questions, reponses, done) {
        try {
          const agents = reponses.map((x) => {
            return x.codeAgent;
          });
          let uniqueagent = _.uniq(agents);
          let structure = [];
          let structureone = {};
          for (let i = 0; i < uniqueagent.length; i++) {
            structureone.codeAgent = uniqueagent[i];
            for (let y = 0; y < questions.length; y++) {
              structureone[questions[y].question] = reponses
                .filter(
                  (x) =>
                    x.codeAgent === uniqueagent[i] &&
                    x.idQuestion === questions[y].idQuestion
                )[0]
                ?.reponse?.join(";");
            }
            structure.push(structureone);
            structureone = {};
          }
          return res.status(200).json(structure);
        } catch (error) {
          console.log(error);
        }
      },
    ]);
  } catch (error) {
    console.log(error);
  }
};
const RequiredAt = async (req, res) => {
  try {
    const { id, debut, fin } = req.body;
    console.log(req.body);
    if (!id || !debut || !fin) {
      return res.status(201).json("Veuillez renseigner les champs vides");
    }
    if (parseInt(fin) < parseInt(debut)) {
      return res.status(201).json("Incorrect value");
    }
    ModelServey.findByIdAndUpdate(
      id,
      {
        $set: {
          required_at: debut,
          required_until: fin,
        },
      },
      { new: true }
    ).then((result) => {
      return res.status(201).json(result);
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  AddServey,
  PostReponse,
  RequiredAt,
  MakeFile,
  ReadServeyAgent,
  ReadServey,
  ReadAll,
  ReadAllReponse,
};
