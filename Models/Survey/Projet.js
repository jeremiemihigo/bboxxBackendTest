const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: {
    type: String,
    uppercase: true,
    unique: true,
    required: true,
    trim: true,
  },

  save_by: { type: String, required: true },
  customers: { type: [], required: true },
  intervenant: { type: [], required: true },
  id: {
    type: String,
    required: true,
    unique: true,
  },
  active: { type: Boolean, required: true, default: true },
  date: { type: Date, required: true },
});
const model = mongoose.model("Projet", schema);
module.exports = model;
