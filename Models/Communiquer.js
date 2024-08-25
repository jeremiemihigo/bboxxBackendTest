const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    filename: { type: String, required: false },
    savedBy: { type: String, required: true },
  },
  { timestamps: true }
);
const model = mongoose.model("communication", schema);
module.exports = model;
