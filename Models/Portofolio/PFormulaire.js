const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    idFormulaire: { type: String, required: true, unique: true },
    titre: { type: String, required: true },
    savedBy: { type: String, required: true },
  },
  { timestamps: true }
);
const model = mongoose.model("pformulaire", schema);
module.exports = model;
