const express = require("express");
const { protect } = require("../MiddleWare/protect");
const {
  ClientAttente,
  Inactif_thisMonth,
  Analyse,
  // Analyse_Dash_All,
} = require("../Controllers/DefaultTracker/Dash");
const { GraphiqueAction } = require("../Controllers/DefaultTracker/Action");
const { GraphiqueDecision } = require("../Controllers/DefaultTracker/Decision");
const { GraphiqueFeedback } = require("../Controllers/DefaultTracker/Feedback");
const { protectTech } = require("../MiddleWare/protectTech");
const router = express.Router();

router.get("/attente_department", protect, ClientAttente);
router.get("/inactif/:search", Inactif_thisMonth);
router.get("/graphique_action/:filtre", GraphiqueAction);
router.get("/graphique_decision/:filtre", GraphiqueDecision);
router.get("/feedback", GraphiqueFeedback);

//Affichage chez les agents sur terrain
router.get("/analyse_agent", protectTech, Analyse);
// router.get("/analyse_all_agent", Analyse_Dash_All);
module.exports = router;
