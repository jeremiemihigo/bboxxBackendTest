const express = require("express");
const router = express.Router();
const { protect } = require("../MiddleWare/protect");
const {
  AddProjet,
  ReadProjet,
  ReadFormulaire,
} = require("../Controllers/Survey/Projet");
const {
  AddQuestion,
  Delete_Question,
} = require("../Controllers/Survey/Question");

router.post("/add_question", protect, AddQuestion);
router.post("/add_projet", protect, AddProjet);
router.get("/projet", protect, ReadProjet);
router.get("/formulaire", protect, ReadFormulaire);
router.delete("/delete_question", protect, Delete_Question);
module.exports = router;
