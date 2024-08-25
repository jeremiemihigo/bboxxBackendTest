const asyncLab = require("async");
const moment = require("moment");
const modelAppel_Ticket = require("../../../Models/Issue/Appel_Issue");
const { generateNumber } = require("../../../Static/Static_Function");

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
        time_delai,
        plainte,
        codeclient,
        nomClient,
        adresse,
        property,
        provenance,
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
      const fullDateSave = req.body?.fullDateSave || new Date();
      const date = new Date().toISOString().split("T")[0];

      const idPlainte = `${shop.substr(0, 2)}${generateNumber(5)}`;

      asyncLab.waterfall(
        [
          function (done) {
            const periodes = moment(new Date()).format("MM-YYYY");
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
          function (a, done) {
            const periodes = moment(new Date()).format("MM-YYYY");
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
                dateSave: date,
                provenance,
                adresse,
                fullDateSave,
                submitedBy: nom,
                statut: soumission_shop,
                shop,
                recommandation: commentaire,
                periode: periodes,
                property, //to Add
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
      const { ticket, fullDate, time_delai, delai } = req.body;
      const dateSave = new Date(fullDate).toISOString().split("T")[0];
      const { nom } = req.user;
      asyncLab.waterfall([
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
                  time_delai,
                  fullDateSave: fullDate,
                },
                $push: {
                  resultat: {
                    nomAgent: nom,
                    fullDate,
                    dateSave,
                    laststatus: result.statut,
                    changeto: ticket_creer,
                    delai,
                  },
                },
              },
              { new: true }
            )
            .then((donner) => {
              if (donner) {
                return res.status(200).json(donner);
              } else {
                return res.status(201).json("Error");
              }
            })
            .catch(function (err) {
              return res.status(201).json("Error");
            });
        },
      ]);
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
      asyncLab.waterfall([
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
              if (ticket) {
                io.emit("assignTech", ticket);
                return res.status(200).json(ticket);
              } else {
                return res.status(201).json("Error");
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  },
  //Apres assistance du technicien
  Apres_Assistance: (req, res) => {
    try {
      const io = req.io;
      const { num_ticket, time_delai, fullDate, delai } = req.body;
      const { nom } = req.user;
      asyncLab.waterfall([
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
          const dateSave = new Date(fullDate).toISOString().split("T")[0];
          modelAppel_Ticket
            .findByIdAndUpdate(
              ticket._id,
              {
                $set: {
                  statut: apres_assistance,
                  time_delai,
                  fullDateSave: fullDate,
                },
                $push: {
                  resultat: {
                    nomAgent: nom,
                    fullDate,
                    dateSave,
                    laststatus: ticket.statut,
                    changeto: apres_assistance,
                    delai,
                  },
                },
              },
              { new: true }
            )
            .then((result) => {
              if (result) {
                io.emit("apres_assistance", result);
                return res.status(200).json(result);
              } else {
                return res.status(201).json("Error");
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  },
  Verification: (req, res) => {
    try {
      const { nom } = req.user;
      const {
        num_ticket,
        statut,
        open,
        time_delai,
        fullDate,
        commentaire,
        delai,
      } = req.body;
      const dateSave = new Date(fullDate).toISOString().split("T")[0];
      if (!statut || !num_ticket) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelAppel_Ticket
              .findOne({
                idPlainte: num_ticket,
              })
              .lean()
              .then((ticket) => {
                if (ticket) {
                  done(null, ticket);
                } else {
                  return res.status(201).json("Error");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (ticket, done) {
            modelAppel_Ticket
              .findByIdAndUpdate(
                ticket._id,
                {
                  $set: {
                    statut,
                    time_delai,
                    delai,
                    fullDateSave: fullDate,
                    open,
                  },
                  $push: {
                    verification: {
                      nomAgent: nom,
                      commentaire,
                    },
                    resultat: {
                      nomAgent: nom,
                      fullDate,
                      dateSave,
                      laststatus: ticket.statut,
                      changeto: statut,
                      commentaire,
                      delai,
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
        time_delai,
        codeclient,
        customer_name,
        adresse,
        provenance,
        shop,
        commentaire,
        fullDate,
        property,
      } = req.body;
      if (
        !typePlainte ||
        !plainte ||
        !codeclient ||
        !time_delai ||
        !customer_name ||
        !shop ||
        !commentaire ||
        !contact ||
        !fullDate ||
        !property
      ) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      const date = new Date(fullDate).toISOString().split("T")[0];

      const idPlainte = `${shop.substr(0, 2)}${generateNumber(5)}`;

      asyncLab.waterfall(
        [
          function (done) {
            const periodes = moment(new Date()).format("MM-YYYY");
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
          function (a, done) {
            const periodes = moment(new Date()).format("MM-YYYY");
            modelAppel_Ticket
              .create({
                typePlainte,
                plainteSelect: plainte,
                idPlainte,
                codeclient,
                customer_name,
                contact,
                dateSave: date,
                fullDateSave: fullDate,
                time_delai,
                provenance,
                adresse,
                submitedBy: nom,
                statut: ticket_creer,
                shop,
                type: "ticket",
                commentaire,
                periode: periodes,
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
};
