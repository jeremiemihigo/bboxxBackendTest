const mongoose = require("mongoose");

const tableau = new mongoose.Schema({
  jour: { type: Number },
  debut: { type: String },
  delai: { type: Number },
});

const schema = new mongoose.Schema(
  {
    plainte: { type: String, required: true },
    critere: { type: [tableau], required: false },
    defaut: { type: Number, required: true },
  },
  { timestamps: true }
);
schema.index({ plainte: 1 });
const model = mongoose.model("delai", schema);
module.exports = model;
