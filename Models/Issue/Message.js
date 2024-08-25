const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    agent: { type: String, required: true },
    idPlainte: { type: String, required: true },
  },
  { timestamps: true }
);
const model = mongoose.model("message", schema);
module.exports = model;
