const mongoose = require("mongoose");

const feedback = new mongoose.Schema(
  {
    newFeedback: { type: String, required: true },
    lasFeedback: { type: String, required: true },
    deedline: { type: String, required: true, enum: ["IN SLA", "OUT SLA"] },
    doBy: { type: String, required: true },
    role: { type: String, required: true },
    commentaire: { type: String, required: false },
    statut: { type: String, required: true },
  },
  { timestamps: true }
);
const Hist_Arbitrage = new mongoose.Schema(
  {
    current_status: { type: String, required: true },
    changeto: { type: String, required: true },
    submitedBy: { type: String, required: true },
    checkedBy: { type: String, required: true },
    commentaire: { type: String, required: false },
    feedback: { type: String, required: true, enum: ["Approved", "Rejected"] },
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
    currentFeedback: { type: String, required: true },
    appel: { type: String, required: false },
    fullDate: { type: Date, required: true, default: new Date() },
    //changeto contient le nouveau statut
    feedback: {
      type: String,
      required: true,
      enum: ["Pending", "Rejected", "Approved", "success"],
      default: "success",
    },
    changeto: { type: String, required: false },
    submitedBy: { type: String, required: true },
    Hist_Arbitrage: { type: [Hist_Arbitrage], required: false },

    action: {
      type: String,
      required: true,
      enum: ["No_Action", "Pending", "Rejected", "Approved"],
      default: "No_Action",
    },
    statut_decision: {
      type: String,
      required: true,
      enum: ["Pending", "Rejected", "Approved", "Tracking_Ongoing"],
      default: "Tracking_Ongoing",
    },
  },
  { timestamps: true }
);
schema.index({ codeclient: 1, month: -1 }, { unique: true });
schema.index({ shop: 1 });
schema.index({ region: 1 });
schema.index({ currentFeedback: 1 });
const model = mongoose.model("tClient", schema);
module.exports = model;
