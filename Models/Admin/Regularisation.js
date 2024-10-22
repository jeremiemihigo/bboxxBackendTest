const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    nombre: { type: Number, required: true, min: 1 },
    doBy: { type: String, required: true },
    raison: { type: String, required: true },
    session: { type: String, required: true },
  },
  { timestamps: true }
);
const model = mongoose.model("regularisation", schema);
module.exports = model;
