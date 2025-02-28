const express = require("express");
const {
  PDatabase,
  ReadCustomerToTrack,
} = require("../Controllers/Portofolio/Database");
const router = express.Router();
const { protect } = require("../MiddleWare/protect");
const { AddFeedback } = require("../Controllers/Portofolio/Feedback");
const {
  AddFormulaire,
  ReadFormulaire,
  AddQuestion,
  ReadQuestionProjet,
  EditQuestion,
} = require("../Controllers/Portofolio/Formulaire");
const { AddProjet, ReadProjet } = require("../Controllers/Portofolio/Projet");

//Projet
router.post("/addProjet", protect, AddProjet);
router.get("/readProjet", protect, ReadProjet);
//Database config
router.post("/database", protect, PDatabase);
router.post("/readCustomerToTrack", protect, ReadCustomerToTrack);

//Feedback
router.post("/addFeedback", protect, AddFeedback);

//Formulaire
router.post("/addFormulaire", protect, AddFormulaire);
router.get("/readFormulaire", protect, ReadFormulaire);

//Question
router.post("/addQuestion", protect, AddQuestion);
router.get("/readQuestionFormular/:idFormulaire", protect, ReadQuestionProjet);
router.put("/editQuestion", protect, EditQuestion);

module.exports = router;
