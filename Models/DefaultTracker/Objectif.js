const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    codeclient: { type: String, required: true },
    codeAgent: { type: String, required: false },
    region: { type: String, required: true },
    shop: { type: String, required: true },
    month: { type: String, required: true },
    customer_name: { type: String, required: true },
  },
  { timestamps: true }
);
schema.index({ codeclient: 1, month: 1 }, { unique: true });
schema.index({ codeAgent: 1 });
const model = mongoose.model("objectif", schema);
module.exports = model;
