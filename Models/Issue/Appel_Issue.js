const mongoose = require("mongoose");

const result = new mongoose.Schema({
  nomAgent: { type: String, required: true },
  fullDate: { type: Date, required: true },
  dateSave: { type: Date, required: true },
  laststatus: { type: String, required: false },
  changeto: { type: String, required: true },
  commentaire: { type: String, required: false },
  audio: { type: String, required: false },
  delai: { type: String, required: false, enum: ["OUT SLA", "IN SLA"] },
});

const technicien = new mongoose.Schema({
  assignBy: { type: String, required: true },
  codeTech: { type: String, required: true },
  date: { type: String, required: true },
  numSynchro: { type: String, required: true },
});

const schema = new mongoose.Schema(
  {
    submitedBy: { type: String, required: true },
    codeclient: {
      type: String,
      required: true,
      trim: false,
      max: 12,
      min: 12,
      uppercase: false,
    },
    open: { type: Boolean, required: true, default: true },
    operation: { type: String, required: false, enum: ["backoffice"] },
    nomClient: { type: String, required: true },
    time_delai: { type: Number, required: true, default: 0 },
    contact: { type: String, required: true },
    periode: { type: String, required: true },
    typePlainte: { type: String, required: true },
    plainteSelect: { type: String, required: true },
    dateSave: { type: Date, required: true },
    fullDateSave: { type: Date, required: true },
    recommandation: { type: String, required: false },
    property: { type: String, required: true },
    decodeur: { type: String, required: false },
    raisonOngoing: { type: String, required: false },
    editRaison: { type: String, required: false },
    editBy: { type: String, required: false },
    delai: { type: String, required: false, enum: ["IN SLA", "OUT SLA"] },
    dateClose: { type: Date, required: false },
    type: {
      type: String,
      required: true,
      enum: ["appel", "ticket", "Education", "support"],
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
      type: {
        num_synchro: String,
        materiel: Array,
      },
      required: false,
    },
    regularisation: {
      type: {
        jours: Number,
        cu: String,
        date_coupure: Date,
        raison: String,
      },
      required: false,
    },
    upgrade: { type: String, required: false },
    downgrade: {
      type: {
        kit: String,
        num_synchro: String,
      },
      required: false,
    },
    technicien: {
      type: technicien,
      required: false,
    },
    verification: { type: Array, required: false },
    adresse: {
      type: {
        commune: String,
        quartier: String,
        avenue: String,
        reference: String,
        sat: String,
        contact: String,
        shop: String,
      },
      required: false,
    },
    //Fin Ticket
    statut: {
      type: String,
      required: true,
    },

    idPlainte: { type: String, required: true, unique: true, uppercase: true },
    shop: { type: String, required: true },
    closeBy: { type: String, required: false },
    ticket: {
      createdBy: String,
      numSynchro: String,
    },
    audio: { type: String, required: false },
  },
  { timestamps: true }
);

schema.index({ periode: 1 });
schema.index({ operation: -1 });
schema.index({ codeclient: -1 });
schema.index({ dateSave: -1 });
schema.index({ property: 1 });
const model = mongoose.model("Appel", schema);
module.exports = model;
