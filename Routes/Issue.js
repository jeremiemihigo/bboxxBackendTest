const express = require("express");
const router = express.Router();
const { protect } = require("../MiddleWare/protect");
const { protectTech } = require("../MiddleWare/protectTech");
const {
  AddPlainte,
  ReadPlainte,
  AddTitlePlainte,
  ReadItem_Plainte,
} = require("../Controllers/Issue/Plainte");
const {
  Appel,
  AppelToday,

  UpdateAppel,
  Message,
  InfoClient,
  ReadMy_Notification,
} = require("../Controllers/Issue/Appel");
const {
  updatedAdresse,
  Regularisation,
  Repo_Volontaire,
  Desengagement,
  Downgrade,
  Upgrade,
  Demande_FermeturePlainte,
  Info_Client,
  AddPlainteSupport,
} = require("../Controllers/Issue/AdresseClient");
const { IssueRapport, Technical } = require("../Controllers/Rapport");
const {
  Soumission_Ticket,
  CreationTicket,
  AssignTechnicien,
  Apres_Assistance,
  Verification,
  Ticket_CallCenter,
  Edit_complaint,
} = require("../Controllers/Issue/Ticket/Creation");
const {
  ReadTech,
  Readclient,
  ReadMy_Backoffice,
  ReadOneComplaint,
  ReadData_Backoffice,
  Mydeedline,
} = require("../Controllers/Issue/Ticket/Read");
const {
  Delai,
  ReadDelai,
  Default_Delai,
} = require("../Controllers/Issue/Delai");
const { AddSynchro } = require("../Controllers/AgentAdmin");

router.post("/plainte", protect, AddPlainte, ReadPlainte);
router.post("/itemPlainte", protect, AddTitlePlainte, ReadPlainte);

router.post("/appel", protect, Appel);

router.get("/plainte", ReadPlainte);
router.get("/today", protect, AppelToday);

router.post("/changeadresse", protect, updatedAdresse);

router.post("/updateappel", protect, UpdateAppel);

router.post("/message", protect, Message, ReadMy_Notification);
//Ticket
router.post("/soumission_ticket", protect, Soumission_Ticket);
router.post("/create_ticket", protect, CreationTicket);
router.post("/assign_tech_ticket", protect, AssignTechnicien);
router.post("/assistance_ticket", protect, Apres_Assistance);
router.post("/verification_ticket", protect, Verification);

//Read Ticket

router.post("/rapport_technical", protect, Technical);

router.get("/actionsynchro", protectTech, ReadTech);

router.post("/ticker_callcenter", protect, Ticket_CallCenter);

router.post("/delai", protect, Delai);
router.get("/delai", protect, ReadDelai);

router.get("/infoclient/:codeclient", protect, InfoClient);

router.post("/default_delai", protect, Default_Delai);

router.post("/addsynchro", protect, AddSynchro);

router.get("/client", protect, Readclient);
router.get("/itemPlainte", protect, ReadItem_Plainte);

//Support
const multer = require("multer");
const { AddInformation } = require("../Controllers/Issue/Information");
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Fichiers/");
  },
  filename: (req, file, cb) => {
    const image = file.originalname.split(".");

    cb(null, `${Date.now()}.pdf`);
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== ".pdf") {
      return cb(res.status(400).end("only .pdf"), false);
    }
    cb(null, true);
  },
});
var upload = multer({ storage: storage });
router.post("/regularisation", protect, Regularisation);
router.post("/repo_volontaire", protect, Repo_Volontaire);
router.post("/downgrade", protect, Downgrade);
router.post("/upgrade", protect, Upgrade);
router.post("/desengagement", protect, upload.single("file"), Desengagement);

router.get("/mybackoffice", protect, ReadMy_Backoffice);

router.post("/fermeture_plainte", protect, Demande_FermeturePlainte);
router.post("/info_client", protect, Info_Client);

router.post("/addplainte_support", protect, AddPlainteSupport);
router.get("/onecomplaint/:id", protect, ReadOneComplaint);

router.post("/information_customer", protect, AddInformation);
router.get("/notification_reader", protect, ReadMy_Notification);

router.put("/edit_complet", protect, Edit_complaint);
router.get("/backoffice_data", ReadData_Backoffice);
router.get("/mydeedline/:type", protect, Mydeedline);
module.exports = router;
