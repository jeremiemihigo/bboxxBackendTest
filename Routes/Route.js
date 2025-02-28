const express = require("express");
const router = express.Router();
const { Zone, ReadZone, AffecterZone } = require("../Controllers/Zone");
const { protect, protectReponse } = require("../MiddleWare/protect");
const { protectTech } = require("../MiddleWare/protectTech");
const {
  AddAgent,
  ReadAgent,
  BloquerAgent,
  UpdateAgent,
} = require("../Controllers/Agent");
const {
  login,
  resetPassword,
  LoginAgentAdmin,
  UpdatePassword,
  UpdatePasswordAdmin,
  resetPasswordAdmin,
} = require("../Controllers/Login");
const {
  demande,
  DemandeAttente,
  ToutesDemande,
  ToutesDemandeAgent,
  lectureDemandeBd,
  lectureDemandeMobile,
  ToutesDemandeAttente,
  updateDemandeAgent,
  updateDemandeAgentFile,
  R_Insert_Updated,
} = require("../Controllers/Demande");
const {
  Parametre,
  deleteParams,
  rechercheClient,
  SetFeedback,
  ReadParametre,
  DeleteOneItem,
} = require("../Controllers/Parametre");

const multer = require("multer");
const {
  reponse,
  OneReponse,
  updateReponse,
  // ReponseDemandeLot,
  SupprimerReponse,
} = require("../Controllers/Reponse");
const {
  Rapport,
  ContactClient,
  Call_ToDay,
  Refresh_Payment,
  RapportFollowUp,
} = require("../Controllers/Rapport");
const {
  Reclamation,
  // ReadMessage,
  // DeleteReclamation,
  demandeIncorrect,
} = require("../Controllers/Reclamation");
const {
  readPeriodeGroup,
  demandePourChaquePeriode,
  chercherUneDemande,
} = require("../Controllers/Statistique");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Images/");
  },
  filename: (req, file, cb) => {
    cb(null, `image_${Date.now()}.png`);
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== ".jpg" || ext !== ".png") {
      return cb(res.status(400).end("only jpg, png are allowed"), false);
    }
    cb(null, true);
  },
});
var upload = multer({ storage: storage });
//Read
const { ReadUser, readUserAdmin } = require("../Controllers/Read");
const {
  Doublon,
  ReadDoublon,
  NonConformes,
} = require("../Controllers/Doublon");

router.get("/zone", ReadZone);
router.get("/agent", protect, ReadAgent);
router.get("/user", ReadUser);
router.get("/userAdmin", readUserAdmin);
// router.get("/message/:codeAgent", ReadMessage);

router.get("/customer/:codeclient", rechercheClient);
router.get("/touteDemande", ToutesDemande);
router.get("/toutesDemandeAttente/:limit", protect, ToutesDemandeAttente);
//Rapport visite ménage
router.post("/rapport", protect, Rapport);
router.get("/oneReponse/:id", OneReponse);
//Create

router.post("/paramatre", Parametre);
router.post("/postzone", Zone);
router.post("/postAgent", protect, AddAgent, ReadAgent);
router.post("/reponsedemande", protectReponse, reponse, Doublon);
router.post("/reclamation", Reclamation);
//Update
router.put("/zone", AffecterZone);
router.put("/reponse", protect, updateReponse);
router.put("/bloquer", protect, BloquerAgent, ReadAgent);

//Reinitialisation agent
router.put("/reset", protect, resetPassword, ReadAgent);
//Reinitialisation agentadmin
router.post("/resetAdmin", protect, resetPasswordAdmin);
//Update default password
router.post("/updatedefaultpwd", UpdatePassword);
router.put("/userAdmin", UpdatePasswordAdmin);

// router.delete("/deleteReclamation/:id", DeleteReclamation);
router.put("/agent", UpdateAgent, ReadAgent);

//Mobiles
router.get("/demandeReponse/:id", ToutesDemandeAgent);
router.get("/readDemande", DemandeAttente);
router.post("/demande", upload.single("file"), demande);

router.post("/demandeAgentAll", protect, lectureDemandeBd);

router.post("/login", login);
router.post("/loginUserAdmin", LoginAgentAdmin);

//Lien après presentation du systeme
router.get("/demandeAll/:lot/:codeAgent", lectureDemandeMobile);
router.get("/paquet", protectTech, readPeriodeGroup);
// router.get('/lot', searchPaquet)
router.get("/demandePourChaquePeriode", protect, demandePourChaquePeriode);
router.delete("/deleteParams", deleteParams);

// router.get("/reponseAll", ReponseDemandeLot);

//Raison

const {
  AddAdminAgent,
  ReadAgentAdmin,
  BloquerAgentAdmin,
  AddTache,
  EditAgent,
} = require("../Controllers/AgentAdmin");
const { AddShop, ReadShop, UpdateOneField } = require("../Controllers/Shop");

const {
  set_Plainte_Shop,
  set_ModelAgentAdmin,
} = require("../Controllers/Permission");
const {
  Communication,
  ReadCommuniquer,
  ReadCommuniquerAgent,
  DeleteCommuniquer,
  UpdateCommuniquer,
} = require("../Controllers/Communication");
const { ReadCorbeille } = require("../Controllers/Corbeille");
const { AnalyseVisites } = require("../Controllers/Dashboard");

//Shop
router.post("/shop", AddShop, ReadShop);
router.get("/shop", ReadShop);
router.put("/shop", UpdateOneField);

//Agent
router.post("/addAdminAgent", AddAdminAgent);
router.get("/readAgentAdmin", protect, ReadAgentAdmin);
router.post("/editAgentadmin", protect, EditAgent);
router.put("/bloquerAgentAdmin", protect, BloquerAgentAdmin);
router.put(
  "/updateDemandeFile",
  upload.single("file"),
  updateDemandeAgentFile,
  R_Insert_Updated
);
router.put("/updateDemande", updateDemandeAgent, R_Insert_Updated);
router.get("/idDemande/:id", protect, chercherUneDemande);

//Actions
router.get("/demandeIncorrect", protect, demandeIncorrect);
router.get("/doublon", ReadDoublon);
router.post("/conformite", NonConformes);
router.get("/followup", RapportFollowUp);
//================================================================Departement et permission================================================================================================

router.put("/addTache", AddTache);

router.post("/contact", protect, ContactClient);
//Tracking default

router.post("/setplainteshop", protect, set_Plainte_Shop);
router.post("/edituseradminInfo", protect, set_ModelAgentAdmin);

router.get("/call_today", Call_ToDay);
router.post("/refresh_payment", protect, Refresh_Payment);
router.post("/communication", protect, Communication);
router.get("/communication", protect, ReadCommuniquer);
router.get("/communicationAgent", protectTech, ReadCommuniquerAgent);
router.delete("/communication/:id", protect, DeleteCommuniquer);
router.put("/communication", protect, UpdateCommuniquer);
router.get("/get_corbeille", protect, ReadCorbeille);
router.post("/deletedemande", protect, SupprimerReponse);

router.post("/setFeedback", protect, SetFeedback);
router.get("/readParametre", protect, ReadParametre);
router.post("/deleteOneItem", protect, DeleteOneItem);

router.post("/analyseVisites", protect, AnalyseVisites);

//-------------------------------------Conge-------------------------------------

module.exports = router;
