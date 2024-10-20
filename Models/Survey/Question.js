const { upperCase } = require("lodash");
const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  question_name: { type: String, uppercase: true, required: true, trim: true },
  type: { type: String, required: true, enum: ["select", "text"] },
  select: { type: String, required: false, enum: ["one", "many"] },
  textField: {
    type: String,
    enum: ["number", "text", "date"],
    required: false,
  },
  idQuestion: { type: String, unique: true, required: true },
  idProjet: { type: String, required: true },
});
const model = mongoose.model("question", schema);
module.exports = model;
