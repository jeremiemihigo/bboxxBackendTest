const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    idFeedback: { type: String, required: true },
    idRole: { type: Array, required: true },
    delai: { type: Number, required: true, default: 1 },
    color: { type: String, required: true, default: "#fff" },
  },
  { timeseries: true }
);
const model = mongoose.model("tfeedback", schema);
module.exports = model;
