const mongoose = require("mongoose");

const schema_session = new mongoose.Schema(
  {
    codeAgent: { type: String, required: true },
    doBy: { type: String, required: true },
    session: { type: String, required: true, unique: true },
    active: { type: Boolean, required: true, default: false },
    jours: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);
const model = mongoose.model("session", schema_session);
module.exports = model;
