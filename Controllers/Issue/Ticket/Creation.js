const asyncLab = require("async");
const moment = require("moment");
const modelAppel_Ticket = require("../../../Models/Issue/Appel_Issue");
const modelDelai = require("../../../Models/Issue/Delai");
const {
  generateNumber,
  ReturnDelai_Issue,
  return_time_Delai,
} = require("../../../Static/Static_Function");

const soumission_shop = "awaiting_confirmation";
const ticket_creer = "Open_technician_visit";
const apres_assistance = "resolved_awaiting_confirmation";

//Sans importation du fichier
const Escalader = async (req, res) => {
  // property,decodeur,operation,periode,dateSave,fullDateSave
  const { codeclient, typePlainte, plainteSelect, contact, shop, statut } =
    req.body;
  if (
    !codeclient ||
    !shop ||
    !statut ||
    !contact ||
    !typePlainte ||
    !plainteSelect
  ) {
    return res.status(201).json("Veuillez renseigner les champs vides");
  }
  const property = req.user.plainte_callcenter ? "callcenter" : "shop";
  const date = new Date();
  const { nom } = req.user;
  const io = req.io;
  const periode = moment(new Date()).format("MM-YYYY");
  let donner = req.body;
  donner.fullDateSave = date;
  donner.property = property;
  donner.idPlainte = new Date().getTime();
  donner.dateSave = new Date().toISOString().split("T")[0];
  donner.time_delai = 30;
  donner.periode = periode;
  donner.submitedBy = nom;

  asyncLab.waterfall(
    [
      function (done) {
        modelAppel_Ticket
          .findOne({
            codeclient,
            open: true,
            operation: "backoffice",
          })
          .then((result) => {
            if (result) {
              return res
                .status(201)
                .json(
                  `Y a une autre plainte de type (${result.statut}) qui est en cours de traitement pour ce client`
                );
            } else {
              done(null, result);
            }
          })
          .catch(function (err) {
            console.log(err);
          });
      },
      function (result, done) {
        modelAppel_Ticket
          .create(donner)
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
        io.emit("plainte", result);
        return res.status(200).json(result);
      } else {
        return res.status(201).json("Error");
      }
    }
  );
};
//Demande de creation ticket shop
const Soumission_Ticket = async (req, res) => {
  try {
    const io = req.io;
    const { nom } = req.user;
    const {
      typePlainte,
      contact,
      plainte,
      codeclient,
      nomClient,
      adresse,
      shop,
      commentaire,
      audio,
    } = req.body;
    if (
      !typePlainte ||
      !plainte ||
      !codeclient ||
      !nomClient ||
      !shop ||
      !contact
    ) {
      return res.status(201).json("Veuillez renseigner les champs");
    }
    const date = new Date();

    const idPlainte = `${shop.substr(0, 2)}${generateNumber(6)}`;
    const property = req.user.plainte_callcenter ? "callcenter" : "shop";

    asyncLab.waterfall(
      [
        function (done) {
          const periodes = moment(date).format("MM-YYYY");
          modelAppel_Ticket
            .findOne({
              periode: periodes,
              codeclient,
              plainteSelect: plainte,
            })
            .lean()
            .then((client) => {
              if (client) {
                return res
                  .status(201)
                  .json(
                    `Le client etait assiste le ${moment(
                      client.dateSave
                    ).format("DD/MM/YYYY")}, ID ticket : ${
                      client.idPlainte
                    } Issue : ${plainte}`
                  );
              } else {
                done(null, true);
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },

        function (time_delai, done) {
          const periodes = moment(date).format("MM-YYYY");
          modelAppel_Ticket
            .create({
              typePlainte,
              plainteSelect: plainte,
              idPlainte,
              type: "ticket",
              codeclient,
              nomClient,
              time_delai: 2880,
              contact,
              dateSave: date.toISOString().split("T")[0],
              adresse,
              fullDateSave: date,
              submitedBy: nom,
              statut: soumission_shop,
              shop,
              periode: periodes,
              audio,
              property, //to Add
              resultat: [
                {
                  nomAgent: nom,
                  fullDate: date,
                  dateSave: date.toISOString().split("T")[0],
                  laststatus: "new",
                  changeto: soumission_shop,
                  commentaire,
                },
              ],
            })
            .then((ticket) => {
              done(ticket);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ],
      function (result) {
        if (result) {
          io.emit("plainte", result);
          return res.status(200).json(result);
        } else {
          return res.status(201).json("Error");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
//creation ticket
const CreationTicket = async (req, res) => {
  try {
    const io = req.io;
    const { ticket } = req.body;
    const dateSave = new Date();
    const { nom } = req.user;
    asyncLab.waterfall(
      [
        function (done) {
          modelAppel_Ticket
            .findOne({
              idPlainte: ticket,
            })
            .then((result) => {
              if (result) {
                done(null, result);
              } else {
                return res.status(201).json("Le ticket est introuvable");
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },

        function (result, done) {
          modelAppel_Ticket
            .findByIdAndUpdate(
              result._id,
              {
                $set: {
                  statut: ticket_creer,
                  time_delai: 2880,
                  fullDateSave: dateSave,
                },
                $push: {
                  resultat: {
                    nomAgent: nom,
                    fullDate: dateSave,
                    dateSave: dateSave.toISOString().split("T")[0],
                    laststatus: result.statut,
                    changeto: ticket_creer,

                    delai: ReturnDelai_Issue(
                      result.fullDateSave,
                      result.time_delai
                    ),
                  },
                },
              },
              { new: true }
            )
            .then((donner) => {
              done(donner);
            })
            .catch(function (err) {
              return res.status(201).json("Error");
            });
        },
      ],
      function (donner) {
        if (donner) {
          io.emit("plainte", donner);
          return res.status(200).json(donner);
        } else {
          return res.status(201).json("Error");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
//Assigner un technicien
const AssignTechnicien = async (req, res) => {
  try {
    const { nom } = req.user;
    const io = req.io;
    const { num_ticket, codeAgent, numSynchro } = req.body;
    if (!num_ticket || !codeAgent || !numSynchro) {
      return res.status(201).json("Veuillez renseigner les champs");
    }
    asyncLab.waterfall(
      [
        function (done) {
          modelAppel_Ticket
            .findOneAndUpdate(
              {
                idPlainte: num_ticket,
              },
              {
                $set: {
                  technicien: {
                    assignBy: nom,
                    codeTech: codeAgent,
                    date: new Date(),
                    numSynchro: numSynchro.trim(),
                  },
                },
              },
              { new: true }
            )
            .then((ticket) => {
              done(ticket);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ],
      function (ticket) {
        if (ticket) {
          io.emit("plainte", ticket);
          return res.status(200).json(ticket);
        } else {
          return res.status(201).json("Error");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
//Apres assistance du technicien
const Apres_Assistance = async (req, res) => {
  try {
    const io = req.io;
    const { num_ticket } = req.body;
    const { nom } = req.user;
    asyncLab.waterfall(
      [
        function (done) {
          modelAppel_Ticket
            .findOne({
              idPlainte: num_ticket,
            })
            .then((ticket) => {
              if (ticket) {
                done(null, ticket);
              } else {
                return res.status(201).json("Ticket introuvable");
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },

        function (ticket, done) {
          const dateSave = new Date();
          modelAppel_Ticket
            .findByIdAndUpdate(
              ticket._id,
              {
                $set: {
                  statut: apres_assistance,
                  time_delai: 2880,
                  fullDateSave: dateSave,
                },
                $push: {
                  resultat: {
                    nomAgent: nom,
                    fullDate: dateSave,
                    dateSave,
                    laststatus: ticket.statut,
                    changeto: apres_assistance,
                    delai: ReturnDelai_Issue(
                      ticket?.fullDateSave,
                      ticket?.time_delai
                    ),
                  },
                },
              },
              { new: true }
            )
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
          io.emit("plainte", result);
          return res.status(200).json(result);
        } else {
          return res.status(201).json("Error");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};

const Verification = async (req, res) => {
  try {
    const { nom } = req.user;
    const io = req.io;
    const { num_ticket, statut, open, commentaire } = req.body;
    const dateSave = new Date();
    if (!statut || !num_ticket) {
      return res.status(201).json("Veuillez renseigner les champs");
    }
    asyncLab.waterfall(
      [
        function (done) {
          modelAppel_Ticket
            .findOne({
              idPlainte: num_ticket,
              open: true,
            })
            .lean()
            .then((ticket) => {
              if (ticket) {
                done(null, ticket);
              } else {
                return res.status(201).json("Le Ticket n'est plus ouvert");
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (ticket, done) {
          modelDelai
            .find({})
            .lean()
            .then((deedline) => {
              const tab = return_time_Delai(statut, deedline);
              done(null, ticket, deedline);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (ticket, deedline, done) {
          modelAppel_Ticket
            .findByIdAndUpdate(
              ticket._id,
              {
                $push: {
                  verification: {
                    nomAgent: nom,
                    commentaire,
                  },
                  resultat: {
                    nomAgent: nom,
                    fullDate: dateSave,
                    dateSave: dateSave.toISOString().split("T")[0],
                    laststatus: ticket.statut,
                    changeto: statut,
                    commentaire,
                    delai: ReturnDelai_Issue(
                      ticket.fullDateSave,
                      return_time_Delai(ticket.statut, deedline)
                    ),
                  },
                },
                $set: {
                  statut,
                  fullDateSave: dateSave,
                  open,
                  delai: ReturnDelai_Issue(
                    ticket.fullDateSave,
                    return_time_Delai(ticket.statut, deedline)
                  ),
                },
              },
              { new: true }
            )
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
          io.emit("plainte", result);
          return res.status(200).json(result);
        } else {
          return res.status(201).json("Error");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const Ticket_CallCenter = async (req, res) => {
  try {
    const { nom } = req.user;
    const io = req.io;
    const {
      typePlainte,
      contact,
      plainte,
      codeclient,
      nomClient,
      statut,
      adresse,
      type,
      shop,
      commentaire,
      audio,
    } = req.body;

    if (
      !typePlainte ||
      !plainte ||
      !codeclient ||
      !nomClient ||
      !shop ||
      !statut ||
      !contact ||
      !type
    ) {
      return res.status(201).json("Veuillez renseigner les champs");
    }
    const date = new Date();
    const property = req.user.plainte_callcenter ? "callcenter" : "shop";

    const idPlainte = `${shop.substr(0, 2)}${generateNumber(6)}`;

    asyncLab.waterfall(
      [
        function (done) {
          const periodes = moment(date).format("MM-YYYY");
          modelAppel_Ticket
            .findOne({
              periode: periodes,
              codeclient,
              plainteSelect: plainte,
            })
            .lean()
            .then((client) => {
              if (client && type === "ticket") {
                return res
                  .status(201)
                  .json(
                    `Le client etait assiste le ${moment(
                      client.dateSave
                    ).format("DD/MM/YYYY")}, ID ticket : ${client.idPlainte}`
                  );
              } else {
                done(null, true);
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },

        function (del, done) {
          const periodes = moment(date).format("MM-YYYY");
          modelAppel_Ticket
            .create({
              typePlainte,
              plainteSelect: plainte,
              idPlainte,
              codeclient,
              nomClient,
              contact,
              dateSave: date.toISOString().split("T")[0],
              fullDateSave: date,
              time_delai: 2880,
              property,
              adresse,
              submitedBy: nom,
              statut: type === "Education" ? statut : ticket_creer,
              shop,
              type,
              commentaire,
              periode: periodes,
              audio,
              resultat: [
                {
                  nomAgent: nom,
                  fullDate: date,
                  dateSave: date.toISOString().split("T")[0],
                  laststatus: "",
                  changeto: ticket_creer,
                  commentaire,
                },
              ],
            })
            .then((ticket) => {
              done(ticket);
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ],
      function (result) {
        if (result) {
          io.emit("plainte", result);
          return res.status(200).json(result);
        } else {
          return res.status(201).json("Error");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
const Edit_complaint = async (req, res) => {
  try {
    const io = req.io;
    const { nom } = req.user;
    const { id, data } = req.body;
    if (!id || !data) {
      return res.status(201).json("Veuillez renseigner les champs");
    }
    data.editBy = nom;
    modelAppel_Ticket
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .then((result) => {
        if (result) {
          io.emit("plainte", result);
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
};
module.exports = {
  Escalader,
  Edit_complaint,
  Soumission_Ticket,
  Apres_Assistance,
  Ticket_CallCenter,
  Verification,
  CreationTicket,
  AssignTechnicien,
};
