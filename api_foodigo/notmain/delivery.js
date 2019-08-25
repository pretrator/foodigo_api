var express = require("express");
var router = express.Router();
var con = require("./connection");
var databasequery = require("./databasequery");
router.get("/:origin/:desti/:totcost/:noofmerchant",(req,res)=>{
    
    // var disc=0       // discount in percentage provided in different situation
     var ori = req.params.origin;
     var destination=req.params.desti;
     var totalcost=req.params.totcost;
     var numberofmerchant=req.params.noofmerchant;
     var matrix=[
         [20,20,20,25,30,35,35,30],
         [10,10,10,10,10,10,10,10],
         [10,10,10,10,10,10,10,10],
         [25,20,20,15,20,30,25,20],
         [10,10,10,10,10,10,10,10],
         [40,35,35,35,20,15,20,20],
         [10,10,10,10,10,10,10,10],
         [10,10,10,10,10,10,10,10]
         ]
     var cost=matrix[ori][destination];
     if(numberofmerchant>1)
     {
         cost=40;
     }
    
 /**
    var ovrhead=0;
    var totalcharge=40;
    if(totalcost<100){
	ovrhead+=10;}
    if(numberofmerchant>1){
    ovrhead+=10;}
    if(destination<=5){
    totalcharge=30;}
    var finalcharge=totalcharge+ovrhead;
    //console.log(ori,destination);**/
    //console.log("serving a request");
    res.status(200).json(cost);
});
router.get("/:orderid",async (req,res)=>{
   /** var order=req.params.orderid;
    var sq=`select shipping_zone_id from foodigo.oc_order where order_id=${order}`;
    var resuj =await databasequery(sq);
    var k=resuj[0]["shipping_zone_id"];
    //var k=5;
    var z=2;           
    // route 1 is for robertsganj city and 2 for college L shape
    if(k==1){
        z=1;
    }
    res.status(200).json(z);**/

    res.status(200).json(1234);
});
router.get("/:block1/:block2",async (req,res)=>{
    //this module returns the cose of the block whick is farther away between the two given codes
//    var blk1=req.params.block1;
//    var blk2=req.params.block2;
//    var fin=blk2;
//    if(blk1>blk2){
//        fin=blk1;
//    }
//    res.status(200).json(fin);
});
module.exports = router;