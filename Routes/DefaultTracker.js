const express = require("express");
const { AddRoleDT, ReadRole } = require("../Controllers/DefaultTracker/Role");
const { protect } = require("../MiddleWare/protect");
const {
  AddFeedback,
  ReadFeedback,
  Editfeedback,
} = require("../Controllers/DefaultTracker/Feedback");
const {
  AddClientDT,
  ReadClient,
  ChangeStatus,
  ChangeByFile,
  Appel,
  ReadClientAfterChange,
  Visited_Called,
} = require("../Controllers/DefaultTracker/Client");
const {
  PercentValidation,
  Rapport,
  ClientVisited,
  InformationCustomer,
} = require("../Controllers/DefaultTracker/Dashboard");
const { SetObjectif } = require("../Controllers/Parametre");
const router = express.Router();

router.post("/role", protect, AddRoleDT);
router.get("/role", protect, ReadRole);
router.post("/feedback", protect, AddFeedback);
router.get("/feedback", protect, ReadFeedback);
router.put("/editfeedback", protect, Editfeedback);

//Clients
router.post("/upload_customer", protect, AddClientDT);
router.get("/client_tracker", protect, ReadClient);
router.post("/changefeedback", protect, ChangeStatus, ReadClientAfterChange);
router.post("/change_by_file", protect, ChangeByFile);
router.get("/information/:codeclient", protect, InformationCustomer);
router.post("/appel", protect, Appel);
router.post("/visited_called", protect, Visited_Called);

//Objectif
router.post("/objectif", protect, SetObjectif);

//Dashboard
router.post("/dashboard", protect, PercentValidation);
router.get("/rapport", Rapport);
router.get("/justvisited", ClientVisited);

module.exports = router;
