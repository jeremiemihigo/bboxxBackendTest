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

module.exports = {
  //Demande de creation ticket shop
  Soumission_Ticket: (req, res) => {
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
      } = req.body;
      if (
        !typePlainte ||
        !plainte ||
        !codeclient ||
        !nomClient ||
        !shop ||
        !commentaire ||
        !contact
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      const date = new Date();

      const idPlainte = `${shop.substr(0, 2)}${generateNumber(5)}`;
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
          function (ticket, done) {
            modelDelai
              .find({})
              .lean()
              .then((deedline) => {
                const delai_time = return_time_Delai(soumission_shop, deedline);
                done(null, delai_time);
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
                time_delai,
                contact,
                dateSave: date.toISOString().split("T")[0],
                adresse,
                fullDateSave: date,
                submitedBy: nom,
                statut: soumission_shop,
                shop,
                periode: periodes,
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
  },
  //creation ticket
  CreationTicket: (req, res) => {
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
            modelDelai
              .find({})
              .lean()
              .then((deedline) => {
                const tab = return_time_Delai(ticket_creer, deedline);
                done(null, result, tab);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (result, time_delai, done) {
            modelAppel_Ticket
              .findByIdAndUpdate(
                result._id,
                {
                  $set: {
                    statut: ticket_creer,
                    time_delai,
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
  },
  //Assigner un technicien
  AssignTechnicien: (req, res) => {
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
                      numSynchro,
                    },
                  },
                },
                { new: true }
              )
              .then((ticket) => {
                console.log(ticket);
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
  },
  //Apres assistance du technicien
  Apres_Assistance: (req, res) => {
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
            modelDelai
              .find({})
              .lean()
              .then((deedline) => {
                const tab = return_time_Delai(apres_assistance, deedline);
                done(null, ticket, tab);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (ticket, time_delai, done) {
            const dateSave = new Date();
            modelAppel_Ticket
              .findByIdAndUpdate(
                ticket._id,
                {
                  $set: {
                    statut: apres_assistance,
                    time_delai,
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
  },
  //Je ne sais si cette fonction est utilisée par qui
  Verification: (req, res) => {
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
                done(null, ticket, tab, deedline);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (ticket, time_delai, deedline, done) {
            console.log(ticket, time_delai, deedline);
            modelAppel_Ticket
              .findByIdAndUpdate(
                ticket._id,
                {
                  $set: {
                    statut,
                    time_delai,
                    fullDateSave: dateSave,
                    open,
                    delai: ReturnDelai_Issue(
                      ticket.fullDateSave,
                      return_time_Delai(ticket.statut, deedline)
                    ),
                  },
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
  },
  Ticket_CallCenter: (req, res) => {
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

      const idPlainte = `${shop.substr(0, 2)}${generateNumber(5)}`;

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
          function (ticket, done) {
            modelDelai
              .find({})
              .lean()
              .then((deedline) => {
                const tab = return_time_Delai(ticket_creer, deedline);
                done(null, tab);
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
                codeclient,
                nomClient,
                contact,
                dateSave: date.toISOString().split("T")[0],
                fullDateSave: date,
                time_delai,
                property,
                adresse,
                submitedBy: nom,
                statut: type === "Education" ? statut : ticket_creer,
                shop,
                type,
                commentaire,
                periode: periodes,
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
  },
  Edit_complaint: (req, res) => {
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
  },
};
