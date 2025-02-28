const mongoose = require("mongoose");

const ValueSelect = new mongoose.Schema({
  title: { type: String, required: true },
  id: { type: String, required: true },
  next_question: { type: String, required: false },
});

const schema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    required: { type: Boolean, required: true, default: false },
    idFormulaire: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    type: {
      type: String,
      required: true,
      enum: ["select_one", "select_many", "text", "date"],
    },
    valueSelect: { type: [ValueSelect], required: false },
    editedBy: { type: String, required: false },
    savedBy: { type: String, required: true },
  },
  { timestamps: true }
);
const model = mongoose.model("pquestion", schema);
module.exports = model;
