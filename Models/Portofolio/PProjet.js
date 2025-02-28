const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    intervenant: { type: [String], required: true },
    idFormulaire: { type: String, required: true },
    savedBy: { type: String, required: true },
    id: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);
const model = mongoose.model("pprojet", schema);
module.exports = model;
