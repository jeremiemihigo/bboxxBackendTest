const express = require("express");
const {
  AddRoleDT,
  ReadRole,
  EditRole,
} = require("../Controllers/DefaultTracker/Role");
const { protect } = require("../MiddleWare/protect");
const {
  AddFeedback,
  ReadFeedback,
  Editfeedback,
  MesFeedback,
} = require("../Controllers/DefaultTracker/Feedback");
const {
  AddClientDT,
  ChangeStatus,
  ChangeByFile,
  Appel,
  ReadClientAfterChange,
  ReadCertainClient,
  ReadFilterClient,
  EditFeedbackAppel,
} = require("../Controllers/DefaultTracker/Client");
const {
  Rapport,
  ClientVisited,
  InformationCustomer,
  Graphique,
  GraphiqueClient,
  TauxValidation,
  PerformanceDash,
  StatusDashboard,
} = require("../Controllers/DefaultTracker/Dashboard");
const {
  AddAction,
  ActionAgent,
  AddOneAction,
  ValiderAction,
  Validation,
  ChangeActionByFile,
  SubmitedByExcel,
} = require("../Controllers/DefaultTracker/Action");
const { protectTech } = require("../MiddleWare/protectTech");
const {
  AddObjectif,
  EditObjectif,
} = require("../Controllers/DefaultTracker/Objectif");
const { EditFeedbackVM } = require("../Controllers/Rapport");
const {
  ReadArbitrage,
  Arbitrage,
  Arbitrage_File,
} = require("../Controllers/DefaultTracker/Arbitrage");
const {
  AddDecision,
  ReadDecision,
  VerificationDecision,
  ChangeDecisionByFile,
  SubmitDecisionByFile,
} = require("../Controllers/DefaultTracker/Decision");
const router = express.Router();

router.post("/role", protect, AddRoleDT);
router.get("/role", protect, ReadRole);
router.put("/editrole", protect, EditRole);
router.post("/feedback", protect, AddFeedback);
router.get("/feedback", protect, ReadFeedback);
router.put("/editfeedback", protect, Editfeedback);

//Clients
router.post("/upload_customer", protect, AddClientDT);
router.post("/lienclient", protect, ReadFilterClient);
router.post("/validation", protect, Validation);
router.post("/readCertainClient", protect, ReadCertainClient);
router.post("/changefeedback", protect, ChangeStatus, ReadClientAfterChange);
router.post("/change_by_file", protect, ChangeByFile);
router.get("/information/:codeclient", protect, InformationCustomer);
router.post("/appel", protect, Appel);

//Objectif
router.post("/objectif", protect, AddObjectif);
router.put("/objectif", protect, EditObjectif);
router.put("/edit_feeback_vm", protect, EditFeedbackVM);
router.put("/edit_appel", EditFeedbackAppel);

//Dashboard
router.get("/rapport", Rapport);
router.get("/justvisited", ClientVisited);

//ACTION
router.post("/action", protect, AddAction);
router.post("/oneaction", protect, AddOneAction);
router.post("/change_action_excel", protect, SubmitedByExcel);
router.post("/valideraction", protect, ValiderAction);

router.post("/changeactionbyfile", protect, ChangeActionByFile);
router.get("/statusDashboard", StatusDashboard);
router.get("/actionAgent", protectTech, ActionAgent);
router.post("/performance_agent", protect, PerformanceDash);
router.get("/graphique", protect, GraphiqueClient, Graphique);
router.get("/graphique_taux", protect, GraphiqueClient, TauxValidation);

//Arbitrage
router.post("/arbitrage", protect, Arbitrage);
router.get("/arbitrage", protect, ReadArbitrage);
router.post("/arbitrage_file", protect, Arbitrage_File);

//Feedback
router.get("/mesfeedback", protect, MesFeedback);

//Decision
router.post("/adddecision", protect, AddDecision);
router.get("/decision", protect, ReadDecision);
router.post("/changebyfile", protect, ChangeDecisionByFile);
router.post("/change_decision_file", protect, SubmitDecisionByFile);
router.post("/verification_decision", protect, VerificationDecision);

module.exports = router;
