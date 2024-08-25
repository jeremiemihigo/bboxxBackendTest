const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    delai: { type: Number, required: false },
    periode: { type: String, required: true, unique: true },
    followup: { type: Number, required: true, default: 15 },
  },
  { timestamps: true }
);
const model = mongoose.model("periode", schema);
module.exports = model;
