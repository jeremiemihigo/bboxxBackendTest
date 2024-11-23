const mongoose = require("mongoose");
const ModelDemande = require("./Demande");

const schema = new mongoose.Schema(
  {
    periode: { type: String, required: true },
    precedent: { type: String, required: false }, //visite
    present: { type: String, required: false }, //visite
  },
  { timestamps: true }
);
schema.post("save", function (docs, next) {
  ModelDemande.findOneAndUpdate(
    { idDemande: docs.present },
    {
      $set: {
        feedback: "doublon",
      },
    },
    { new: true }
  )
    .then((result) => {
      next();
    })
    .catch(function (err) {
      next();
      console.log(err);
    });
});
const model = mongoose.model("Doublon", schema);
module.exports = model;
