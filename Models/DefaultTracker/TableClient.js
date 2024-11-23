const mongoose = require("mongoose");

const feedback = new mongoose.Schema(
  {
    newFeedback: { type: String, required: true },
    lasFeedback: { type: String, required: true },
    deedline: { type: String, required: true, enum: ["IN SLA", "OUT SLA"] },
    doBy: { type: String, required: true },
    role: { type: String, required: true },
    commentaire: { type: String, required: false },
  },
  { timestamps: true }
);
const schema = new mongoose.Schema(
  {
    codeclient: {
      type: String,
      required: true,
      min: 12,
      max: 12,
      uppercase: true,
      trim: true,
    },
    nomclient: { type: String, required: true, uppercase: true, trim: true },
    month: { type: String, required: true },
    shop: { type: String, required: true },
    par: { type: String, required: true },
    region: { type: String, required: true },
    actif: { type: Boolean, required: true, default: true },
    dateupdate: { type: Date, required: false },
    feedback: { type: [feedback], required: false },
    currentFeedback: { type: String, required: false },
    appel: { type: String, required: false },
  },
  { timestamps: true }
);
const model = mongoose.model("tClient", schema);
module.exports = model;
