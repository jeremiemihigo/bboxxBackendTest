const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: false },
    concerne: { type: [String], required: true },
    idServey: { type: String, required: true },
    savedby: { type: String, required: true },
    dateFin: { type: Date, required: true },
    active: { type: Boolean, required: true, default: true },
    required_at: { type: Number, required: false },
    required_until: { type: Number, required: false },
  },
  { timestamps: true }
);
const model = mongoose.model("servey_agent", schema);
module.exports = model;
