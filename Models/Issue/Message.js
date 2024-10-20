const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    idMessage: { type: String, required: true },
    agent: { type: String, required: true },
    open: { type: Boolean, required: true, default: true },
    idPlainte: { type: String, required: true },
    lastMessage: { type: String, required: false },
    lastAgent: { type: String, required: false },
    dateSave: { type: Date, required: true },
  },
  { timestamps: true }
);
const model = mongoose.model("message", schema);
module.exports = model;
