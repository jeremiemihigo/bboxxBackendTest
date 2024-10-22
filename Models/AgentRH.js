const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true, unique: true },
    id_fonction: { type: String, required: false },
    id_session: { type: String, required: false, unique: true },
    supervisor: { type: String, required: false },
    savedBy: { type: String, required: true },
    codeAgent: { type: String, required: false, unique: true },
    all_days: { type: Number, required: false },
  },
  { timestamps: true }
);
const model = mongoose.model("AgentRH", schema);
module.exports = model;
