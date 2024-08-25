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
const schema = new mongoose.Schema(
  {
    typePlainte: { type: String, required: true },
    plainte: { type: String, required: true },
    num_ticket: { type: String, required: true, unique: true, uppercase: true },
    codeclient: { type: String, required: true },
    contact: { type: String, required: true },
    customer_name: { type: String, required: true },
    dateSave: { type: Date, required: true },
    resultat: { type: [result], required: false },
    fullDateSave: { type: Date, required: true },
    submitedBy: { type: String, required: true },
    createdBy: { type: String, required: false },
    statut: { type: String, required: true },
    shop: { type: String, required: true },
    dateClose: { type: Date, required: false },
    time_delai: { type: Number, required: true, default: 0 },
    technicien: {
      assignBy: String,
      codeTech: String,
      date: Date,
      numSynchro: String,
    },
    verification: { type: Array, required: false },
    periode: { type: String, required: true },
    provenance: { type: String, required: true },
    adresse: {
      commune: String,
      quartier: String,
      avenue: String,
      reference: String,
      sat: Object,
    },
  },
  { timestamps: true }
);
schema.index({ idTech: 1 });
schema.index({ num_ticket: 1 }, { unique: true });
schema.index({ codeclient: 1 });
schema.index({ shop: 1 });
const model = mongoose.model("ticket", schema);
module.exports = model;
