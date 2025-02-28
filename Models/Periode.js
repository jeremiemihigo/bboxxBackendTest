const mongoose = require("mongoose");

const schema1 = new mongoose.Schema(
  {
    title: { type: String, required: true },
    savedby: { type: String, required: true },
  },
  { timestamps: true }
);
const schema = new mongoose.Schema(
  {
    delai: { type: Number, required: false },
    periode: { type: String, required: true, unique: true },
    followup: { type: Number, required: true, default: 15 },
    feedbackvm: { type: [schema1], required: false },
  },
  { timestamps: true }
);
const model = mongoose.model("periode", schema);
module.exports = model;
