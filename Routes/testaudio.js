const express = require("express");
const router = express.Router();
const { protect } = require("../MiddleWare/protect");

//Support
const multer = require("multer");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Audio/");
  },
  filename: (req, file, cb) => {
    cb(null, `audio_${Date.now()}.webm`);
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== "webm") {
      return cb(res.status(400).end("only webm"), false);
    }
    cb(null, true);
  },
});
var upload = multer({ storage: storage });

router.post("/upload", upload.single("file"), (req, res) => {
  try {
    return res.status(200).json(req.file.filename);
  } catch (error) {}
});
module.exports = router;
