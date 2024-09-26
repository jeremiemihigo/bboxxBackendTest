const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    departement: { type: String, uppercase: true, required: true, trim: true },
    codeDepartement: { type: String, required: true },
  },
  { timestamps: true }
);
schema.index({ codeDepartement: 1 });
const model = mongoose.model("departement", schema);
module.exports = model;
