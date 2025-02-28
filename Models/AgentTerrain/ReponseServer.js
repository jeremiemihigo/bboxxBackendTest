const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    codeAgent: { type: String, required: true },
    idServey: { type: String, required: true },
    idQuestion: { type: String, required: true },
    reponse: { type: [String], required: true },
  },
  { timestamps: true }
);
schema.index({ codeAgent: 1, idQuestion: 1 }, { unique: true });
const model = mongoose.model("reponse_servey", schema);
module.exports = model;
