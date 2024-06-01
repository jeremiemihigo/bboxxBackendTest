const modelSat = require('../Models/Raison')

module.exports = {
  AddSat: (req, res) => {
    try {
      const { data } = req.body
      modelSat
        .insertMany(data)
        .then((result) => {
          console.log(result)
        })
        .catch(function (err) {
          console.log(err)
        })
    } catch (error) {
      console.log(error)
    }
  },
}
