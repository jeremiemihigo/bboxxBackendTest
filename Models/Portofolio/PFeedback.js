const mongoose = require("mongoose");
const ModelDataBase = require("./PDataBase");

const schema = new mongoose.Schema({
  codeclient: {
    type: String,
    required: true,
    min: 12,
    max: 12,
    trim: true,
    uppercase: true,
  },
  idProjet: { type: String, required: true },
  feedback: { type: String, required: false, trim: true },
  codeAgent: { type: String, required: false },
  shop: { required: true, type: String },
  region: { required: true, type: String },
  dateSave: { type: Number, required: true, default: 0 },
  type: {
    type: String,
    required: true,
    enum: ["Reachable", "Unreachable", "Remind"],
  },
  statut: { type: String, required: true }, //Default or late
  date_to_recall: { type: Number, required: true, default: 0 },
  contact: { type: [String], required: true },
});
schema.post("save", function (docs, next) {
  try {
    ModelDataBase.findOneAndUpdate(
      {
        idProjet: docs.idProjet,
        codeclient: docs.codeclient,
      },
      {
        $set: {
          remindDate: docs.date_to_recall,
        },
      }
    ).then(() => {
      next();
    });
  } catch (error) {
    console.log(error);
  }
});
const model = mongoose.model("pfeedback_call", schema);
module.exports = model;
