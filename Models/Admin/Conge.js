const mongoose = require("mongoose");

const validateRh = new mongoose.Schema(
  {
    name_valideRH: { type: String, required: true },
    message: { type: String, required: false },
  },
  { timestamps: true }
);
const validateSuppervisor = new mongoose.Schema(
  {
    supervisor_name: { type: String, required: true },
    message: { type: String, required: false },
  },
  { timestamps: true }
);
const schema = new mongoose.Schema(
  {
    typeConge: { type: String, required: true },
    debut: { type: Date, required: true },
    is_validate: { type: Boolean, required: true, default: false },
    fin: { type: Date, required: true },
    codeConge: { type: String, required: true, unique: true },
    codeAgent: { type: String, required: true },
    jours: { type: Number, required: true, min: 1 },
    days_consumed: { type: Number, required: true, min: 1 },
    date_engagement: { type: Date, required: true },
    id_session: { type: String, required: true },
    valideRH: { type: validateRh, required: false },
    valideSuppervisor: { type: validateSuppervisor, required: false },
  },
  { timestamps: true }
);
schema.index({ codeConge: -1 });
schema.index({ codeAgent: -1 });
const model = mongoose.model("Conge", schema);
module.exports = model;
