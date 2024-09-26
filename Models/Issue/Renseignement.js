const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    nomClient: { type: String, required: true },
    contact: { type: String, required: true },
    about: { type: String, required: true },
    shop: { type: String, required: false },
    origin: { type: String, required: false },
    date: { type: Date, required: false },
    savedBy: { type: String, required: true },
  },
  { timestamps: true }
);
const model = mongoose.model("Renseignement", schema);
module.exports = model;
