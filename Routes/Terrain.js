const { AddQuestion } = require("../Controllers/AgentTerrain/Question");
const {
  AddServey,
  PostReponse,
  ReadServey,
  ReadAll,
  ReadAllReponse,
  ReadServeyAgent,
  MakeFile,
  RequiredAt,
} = require("../Controllers/AgentTerrain/Servey");
const { protect } = require("../MiddleWare/protect");
const { protectTech } = require("../MiddleWare/protectTech");

const router = require("express").Router();

router.post("/servey", protect, AddServey);
router.get("/allservey", protect, ReadAll);
router.post("/requiredAt", protect, RequiredAt);

router.get("/read_servey", protectTech, ReadServey);
router.post("/reponse", protectTech, PostReponse);
router.get("/readAllReponse/:id", protect, ReadAllReponse);

router.get("/servey_agent", protectTech, ReadServeyAgent);
router.get("/fichier_servey/:idServey", protect, MakeFile);

router.post("/question", protect, AddQuestion);

module.exports = router;
