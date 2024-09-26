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
  InsertManyAgent,
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
  ReadParametre,
  ReadPeriodeActive,
  deleteParams,
  rechercheClient,
  updateClient,
  setFollow_up,
  Add_Valve,
} = require("../Controllers/Parametre");

const multer = require("multer");
const {
  reponse,
  OneReponse,
  updateReponse,
  ReponseDemandeLot,
} = require("../Controllers/Reponse");
const {
  Rapport,
  ContactClient,
  Call_ToDay,
  Refresh_Payment,
} = require("../Controllers/Rapport");
const {
  Reclamation,
  ReadMessage,
  DeleteReclamation,
  demandeIncorrect,
} = require("../Controllers/Reclamation");
const {
  readPeriodeGroup,
  demandePourChaquePeriode,
  chercherUneDemande,
} = require("../Controllers/Statistique");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "ImagesController/");
  },
  filename: (req, file, cb) => {
    const image = file.originalname.split(".");

    cb(null, `${Date.now()}.${image[1]}`);
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
router.get("/agent", ReadAgent);
router.get("/user", ReadUser);
router.get("/userAdmin", readUserAdmin);
router.get("/message/:codeAgent", ReadMessage);

router.get("/parametreRead", ReadParametre);
router.put("/parametre", updateClient, ReadParametre);
router.get("/customer/:codeclient", rechercheClient);
router.get("/touteDemande", ToutesDemande);
router.get("/toutesDemandeAttente", protect, ToutesDemandeAttente);
//Rapport visite ménage
router.post("/rapport", protect, Rapport);
router.get("/oneReponse/:id", OneReponse);
//Create

router.post("/paramatre", Parametre);
router.post("/postzone", Zone);
router.post("/postAgent", AddAgent, ReadAgent);
router.post("/reponsedemande", protectReponse, reponse, Doublon);
router.post("/reclamation", Reclamation);
//Update
router.put("/zone", AffecterZone);
router.put("/reponse", updateReponse);
router.put("/bloquer", BloquerAgent, ReadAgent);
router.put("/reset", resetPassword, ReadAgent);
router.put("/resetAdmin", protect, resetPasswordAdmin);
router.delete("/deleteReclamation/:id", DeleteReclamation);
router.put("/agent", UpdateAgent, ReadAgent);
router.post("/manyAgent", InsertManyAgent);
router.put("/userId", UpdatePassword);
router.put("/userAdmin", UpdatePasswordAdmin);
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
router.get("/periodeActive", ReadPeriodeActive);
router.get("/demandePourChaquePeriode", demandePourChaquePeriode);
router.delete("/deleteParams", deleteParams);

router.get("/reponseAll", ReponseDemandeLot);

//Raison
const {
  AddRaison,
  ReadRaison,
  Ajuster,
  UpdateRaison,
} = require("../Controllers/Raison");
const {
  AddAdminAgent,
  ResetPasswords,
  ReadAgentAdmin,
  BloquerAgentAdmin,
  AddTache,
} = require("../Controllers/AgentAdmin");
const { AddShop, ReadShop, UpdateOneField } = require("../Controllers/Shop");
const { AddAction } = require("../Controllers/Action");

const { AddSat } = require("../Controllers/Sat");
const { Visited } = require("../Controllers/Tracking");
const {
  set_Plainte_Shop,
  set_backOffice,
} = require("../Controllers/Permission");
const {
  Delete_communication,
  Communication,
  ReadCommuniquer,
  ReadCommuniquerAgent,
  DeleteCommuniquer,
  UpdateCommuniquer,
} = require("../Controllers/Communication");
const { Update_Agent_Admin } = require("../Controllers/Admin/Conge/Setting");
const { ReadCorbeille } = require("../Controllers/Corbeille");
router.post("/ajuster", Ajuster);
router.post("/raison", AddRaison);
router.get("/raison", ReadRaison);
router.put("/raison", UpdateRaison);

//Shop
router.post("/shop", AddShop, ReadShop);
router.get("/shop", ReadShop);
router.put("/shop", UpdateOneField);

//Agent
router.post("/addAdminAgent", AddAdminAgent);
router.get("/readAgentAdmin", protect, ReadAgentAdmin);
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
router.post("/action", AddAction);
router.get("/demandeIncorrect", protect, demandeIncorrect);
router.get("/doublon", ReadDoublon);
router.post("/conformite", NonConformes);
//================================================================Departement et permission================================================================================================

router.put("/addTache", AddTache);

router.post("/contact", protect, ContactClient);
//Tracking default
router.post("/visited", Visited);
//Sat
router.post("/addsat", AddSat);

router.post("/setplainteshop", protect, set_Plainte_Shop);
router.post("/backoffice", protect, set_backOffice);

router.post("/periode", protect, setFollow_up);
router.post("/valve", Add_Valve);
router.get("/call_today", Call_ToDay);
router.post("/refresh_payment", protect, Refresh_Payment);
router.post("/communication", protect, Communication);
router.get("/communication", protect, ReadCommuniquer);
router.get("/communicationAgent", protectTech, ReadCommuniquerAgent);
router.delete("/communication/:id", protect, DeleteCommuniquer);
router.put("/communication", protect, UpdateCommuniquer);
router.get("/get_corbeille", protect, ReadCorbeille);

//-------------------------------------Conge-------------------------------------

module.exports = router;
