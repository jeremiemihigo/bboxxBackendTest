const mongoose = require("mongoose");

const schemaFonction = new mongoose.Schema(
  {
    fonction: { type: String, required: true, unique: true },
    codeFonction: { type: String, unique: true, required: true },
    codeDepartement: { type: String, required: true },
  },
  { timestamps: true }
);

schemaFonction.index({ codeFonction: -1 });
const model = mongoose.model("fonction", schemaFonction);
module.exports = model;
