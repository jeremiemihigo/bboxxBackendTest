const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    agent: { type: String, required: true },
  },
  { timestamps: true }
);
const model = mongoose.model("commentaire", schema);
module.exports = model;
