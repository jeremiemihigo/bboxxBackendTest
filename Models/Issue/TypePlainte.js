const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  idPlainte: { type: String, required: true },
  title: { type: String, required: true },
  id: { type: String, required: true },
  property: { type: String, required: true },
  ticket: { type: Boolean, required: true, default: false },
  adresse: { type: Boolean, required: true, default: false },
  other: { type: Boolean, required: true, default: false },
  tableother: { type: Array, required: false },
  oneormany: { type: Boolean, required: false },
});
const model = mongoose.model("typeplainte", schema);
module.exports = model;
