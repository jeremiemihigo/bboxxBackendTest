const mongoose = require("mongoose")

const schema = new mongoose.Schema({
  idSat : {type:String, required:true, unique:true},
  nom_SAT : {type:String, required:true, unique:true},
  shop : {type:String, required:true},
  region : {type:String, required:true},
  id : {type:String, required:true},
})
const model = mongoose.model("Sat", schema)
module.exports = model