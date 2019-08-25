var express = require('express')
var router = express.Router()

router.get('/', async (req, res)=>{
  res.send(200).json("asdasd")
});

module.exports = router