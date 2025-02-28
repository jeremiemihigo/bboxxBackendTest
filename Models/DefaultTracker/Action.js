const mongoose = require("mongoose");
const ModelClient = require("./TableClient");

const changeBy = new mongoose.Schema(
  {
    name: { type: String, required: true },
    last_statut: { type: String, required: true },
    next_statut: { type: String, required: true },
    commentaire: { type: String, required: false },
  },
  { timestamps: true }
);
const schema = new mongoose.Schema(
  {
    codeclient: { type: String, required: true, min: 12, max: 12 },
    month: { type: String, required: true },
    //Agent qui a effectué l'action
    codeAgent: { type: String, required: false },
    shop: { type: String, required: true },
    region: { type: String, required: true },
    statut: {
      type: String,
      required: true,
      default: "Pending",
      enum: ["Approved", "Pending", "Rejected"],
    },
    statuschangeBy: {
      type: [changeBy],
      required: false,
    },

    action: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
schema.index({ region: 1 });
schema.index({ shop: 1 });
schema.index({ codeAgent: 1 });
schema.index({ month: 1 });
schema.index({ codeclient: 1, month: -1 }, { unique: true });

schema.post("findOneAndUpdate", function (doc, next) {
  ModelClient.findOneAndUpdate(
    {
      codeclient: doc.codeclient,
      month: doc.month,
    },
    {
      $set: {
        action: doc.statut === "Rejected" ? "No_Action" : "Pending",
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

const model = mongoose.model("action", schema);
module.exports = model;
