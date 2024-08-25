const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    savedBy: { type: String, required: true },
  },
  { timestamps: true }
);
const model = mongoose.model("Valve", schema);
module.exports = model;
