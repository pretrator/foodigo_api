var express = require("express");
var router = express.Router();
router.get("/",async (req,res)=>{
    try{
        await new Promise(done => setTimeout(done, 10000));
        res.status(504).send();
    }catch(err){console.log(err)};
})
router.get("/km",(req,res)=>{
    try{
        res.status(200).send("Hello World");
    }catch(err){console.log(err)};
})

module.exports = router;