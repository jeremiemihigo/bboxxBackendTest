const mongoose = require("mongoose");

const schemaModel = new mongoose.Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    texte: { type: String, required: true },
  },
  { timestamps: true }
);
const model = mongoose.model("Corbeille", schemaModel);
module.exports = model;
