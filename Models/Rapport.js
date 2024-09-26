const mongoose = require("mongoose");
const modelDemande = require("./Demande");

const schema = new mongoose.Schema(
  {
    codeclient: {
      type: String,
      required: true,
      trim: true,
      max: 12,
      min: 12,
      uppercase: true,
    }, //BDRC
    codeCu: { type: String, required: true },
    clientStatut: { type: String, required: true },
    PayementStatut: { type: String, required: true },
    consExpDays: { type: Number, required: true },
    idDemande: { type: String, required: true, unique: true },
    dateSave: { type: Date, required: true },
    codeAgent: { type: String, required: true },
    nomClient: { type: String, required: true, uppercase: true, trim: true },
    idZone: { type: String, required: true },
    idShop: { type: String, required: true },
    //Ajout
    adresschange: {
      type: String,
      required: true,
      enum: ["Identique", "N'est pas identique"],
    },
    agentSave: { nom: String },
    confirmeAdresse: {
      idPlainte: String,
      value: String,
    },
    demandeur: { nom: String, codeAgent: String, fonction: String },
    demande: {
      typeImage: String,
      createdAt: Date,
      numero: String,
      commune: String,
      updatedAt: Date,
      statut: String,
      sector: String,
      lot: String,
      cell: String,
      reference: String,
      sat: String,
      raison: String,
      jours: Number,
      file: String,
    },
    paid: { type: Boolean, required: false },
    coordonnee: { longitude: String, latitude: String, altitude: String },
  },
  { timestamps: true }
);
schema.index({ codeclient: 1 });
schema.index({ idDemande: -1 });
schema.index({ dateSave: -1 });
schema.post("save", function (doc, next) {
  next();
  modelDemande
    .findOneAndUpdate({ idDemande: doc.idDemande }, { $set: { valide: true } })
    .then((response) => {})
    .catch(function (err) {});
});
const model = mongoose.model("Rapport", schema);
module.exports = model;
