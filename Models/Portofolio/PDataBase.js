const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  codeclient: { type: String, required: true, trim: true, max: 12, min: 12 },
  customer_name: { type: String, required: true, trim: true },
  region: { type: String, required: true },
  shop: { type: String, required: true },
  statut: { type: String, required: true, enum: ["default", "late"] },
  idProjet: { type: String, required: true },
  remindDate: { type: Number, required: true, default: 0 },
  phone1: { type: [String], required: false },
});
const model = mongoose.model("pdatabase", schema);
module.exports = model;
