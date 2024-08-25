const Communication = require("../Models/Communiquer");
const asyncLab = require("async");
const sharp = require("sharp");
const fs = require("fs");

module.exports = {
  Communication: (req, res) => {
    try {
      const { nom } = req.user;
      const { content, title } = req.body;
      const { filename } = req.file;

      if (!content || !title) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      asyncLab.waterfall(
        [
          function (done) {
            Communication.create({
              savedBy: nom,
              content,
              title,
              filename,
            })
              .then((result) => {
                if (result) {
                  done(null, result);
                } else {
                  return res.status(201).json("Error");
                }
              })
              .catch(function (err) {
                return res.status(201).json("Error " + err);
              });
          },
          function (result, done) {
            const path = `ImagesController/${result.filename}`;
            const pathdelete = `./ImagesController/${result.filename}`;

            sharp(path)
              .png({ quality: 30 })
              .toFile(`./Images/${result.filename}`)
              .then((repsonse) => {
                fs.unlink(pathdelete, (err) => {
                  console.log(err);
                });
                done(result);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
        ],
        function (result) {
          return res.status(200).json(result);
        }
      );
    } catch (error) {
      return res.status(201).json("Error " + error);
    }
  },
  Delete_communication: (req, res) => {
    try {
      const { id } = req.body;
      Communication.findByIdAndDelete(id)
        .then((result) => {
          return res.status(200).json(id);
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  ReadCommuniquer: (req, res) => {
    try {
      Communication.find({})
        .lean()
        .then((result) => {
          return res.status(200).json(result.reverse());
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
};
