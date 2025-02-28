const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  question: { type: String, required: true },
  item: { type: [String], required: false },
  type_reponse: {
    type: String,
    required: true,
    default: "text",
    enum: ["text", "select_one", "select_many"],
  },
  idServey: { type: String, required: true },
  idQuestion: { type: String, required: true },
});
const model = mongoose.model("question", schema);
module.exports = model;
