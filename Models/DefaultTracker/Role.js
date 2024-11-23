const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    idRole: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    filterBy: {
      type: String,
      required: true,
      enum: ["region", "shop", "all", "currentFeedback"],
    },
  },
  { timestamps: true }
);
const model = mongoose.model("role", schema);
module.exports = model;
