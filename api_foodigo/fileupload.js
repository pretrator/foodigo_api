var express = require("express");
var fileUpload = require("express-fileupload");
var app = express();
var fs=require("fs");

app.use(fileUpload());
app.post("/upload",(req,res)=>{
      let sampleFile = req.files.fileToUpload;

      if(sampleFile.name=="foodigo.zip"){
          sampleFile.mv(__dirname+"/image/foodigo.zip",(err)=>{
              if(err){
                  return console.log(err);
              }
              else{
                  res.send("saved it ");
              }
          })
      }
      else{
          res.send("can not saved it");
      }
})

app.get("/",(req,res)=>{
    console.log("finding the things");
    res.send("Hello");
})
app.listen(3010,(req,res)=>{
    console.log("listen on port 3000");
})