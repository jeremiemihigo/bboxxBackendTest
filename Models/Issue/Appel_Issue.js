const mongoose = require("mongoose");

const result = new mongoose.Schema({
  nomAgent: { type: String, required: true },
  fullDate: { type: Date, required: true },
  dateSave: { type: Date, required: true },
  laststatus: { type: String, required: true },
  changeto: { type: String, required: true },
  commentaire: { type: String, required: false },
  delai: { type: String, required: true, enum: ["OUT SLA", "IN SLA"] },
});
const downgrade = new mongoose.Schema({
  kit: { type: String, required: true },
  num_synchro: { type: String, required: true },
});
const technicien = new mongoose.Schema({
  assignBy: { type: String, required: true },
  codeTech: { type: String, required: true },
  date: { type: String, required: true },
  numSynchro: { type: String, required: true },
});
const adresse = new mongoose.Schema({
  commune: { type: String, required: false },
  quartier: { type: String, required: false },
  avenue: { type: String, required: false },
  reference: { type: String, required: false },
  sat: { type: Object, required: false },
  contact: { type: String, required: false },
  shop: { type: Object, required: false },
});
const regularisation = new mongoose.Schema({
  jours: { type: Number, required: true },
  cu: { type: String, required: true },
  date_coupure: { type: Date, required: true },
  raison: { type: String, required: true },
});

const schema = new mongoose.Schema(
  {
    submitedBy: { type: String, required: true },
    codeclient: {
      type: String,
      required: false,
      trim: false,
      max: 12,
      min: 12,
      uppercase: false,
    },
    open: { type: Boolean, required: true, default: true },
    operation: { type: String, required: false, enum: ["backoffice"] },
    nomClient: { type: String, required: false },
    time_delai: { type: Number, required: true, default: 0 },
    contact: { type: String, required: true },
    periode: { type: String, required: true },
    priorite: { type: String, required: false },
    typePlainte: { type: String, required: false },
    plainteSelect: { type: String, required: false },
    dateSave: { type: Date, required: true },
    fullDateSave: { type: Date, required: true },
    recommandation: { type: String, required: false },
    property: { type: String, required: false },
    decodeur: { type: String, required: false },
    raisonOngoing: { type: String, required: false },
    dateClose: { type: Date, required: false },
    type: {
      type: String,
      required: true,
      enum: ["appel", "ticket", "support"],
    },
    //Tickets
    resultat: { type: [result], required: false },
    createdBy: { type: String, required: false },
    //Autres
    desangagement: {
      raison: String,
      filename: String,
    },
    repo_volontaire: {
      num_synchro: String,
      materiel: Array,
    },
    regularisation: {
      type: regularisation,
      required: false,
    },
    upgrade: { type: String, required: false },
    downgrade: {
      type: downgrade,
      required: false,
    },
    technicien: {
      type: technicien,
      required: false,
    },
    verification: { type: Array, required: false },
    adresse: {
      type: adresse,
      required: false,
    },
    //Fin Ticket
    statut: {
      type: String,
      required: true,
    },
    delai: { type: String, enum: ["IN SLA", "OUT SLA"], required: false },
    idPlainte: { type: String, required: true, unique: true, uppercase: true },
    shop: { type: String, required: true },
    ticket: {
      createdBy: String,
      numSynchro: String,
    },
  },
  { timestamps: true }
);

schema.index({ periode: 1 });
const model = mongoose.model("Appel", schema);
module.exports = model;
