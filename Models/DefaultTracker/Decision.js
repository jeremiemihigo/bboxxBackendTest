const mongoose = require("mongoose");
const ModelClient = require("./TableClient");

const validation = new mongoose.Schema({
  last_statut: { type: String, required: true },
  next_statut: { type: String, required: true },
  commentaire: { type: String, required: false },
  createdBy: { type: String, required: true },
});

const schema = new mongoose.Schema(
  {
    decision: { type: String, required: true },
    createdBy: { type: String, required: true },
    codeclient: { type: String, required: true },
    region: { type: String, required: true },
    shop: { type: String, required: true },
    month: { type: String, required: true },
    statut: {
      type: String,
      required: true,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    validate: { type: [validation], required: false },
  },
  { timestamps: true }
);
schema.index({ shop: 1 });
schema.index({ region: 1 });
schema.index({ month: 1, codeclient: 1 }, { unique: true });

schema.post("findOneAndUpdate", function (doc, next) {
  ModelClient.findOneAndUpdate(
    {
      codeclient: doc.codeclient,
      month: doc.month,
    },
    {
      $set: {
        statut_decision:
          doc.statut === "Rejected" ? "Tracking_Ongoing" : "Pending",
        actif: doc.statut === "Approved" ? false : true,
      },
    },
    { new: true }
  )
    .then(() => {
      next();
    })
    .catch(function (err) {
      next();
    });
});

const model = mongoose.model("decision", schema);
module.exports = model;
