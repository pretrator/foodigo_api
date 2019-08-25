var express = require("express");
var router = express.Router();
var con = require("./connection");
var databasequery = require("./databasequery");

router.get("/rider/:riderid/:limit",async (req,res)=>{
    try{
        //console.log("Acoount section activated");
        var rider_id=req.params.riderid;
        var limit=req.params.limit;
        var placearr=new Array();
        
        var placelist=await databasequery("SELECT zone_id,name FROM foodigo.oc_zone")
        //console.log(placelist[5]["zone_id"],placelist[5]["name"])
        
        for(var j=0;j<placelist.length;j++){
            placearr[parseInt(placelist[j]["zone_id"])]=placelist[j]["name"]
        }
        
        var data=await databasequery("select * from foodigo.oc_rider_history where rider_id="+parseInt(rider_id)+" order by ride_id DESC limit "+parseInt(limit));
        for(var i=0;i<data.length;i++){
//            data[i]["origin"]="err";
//            data[i]["finaldest"]="err";
            var dat=new Date(parseInt(data[i]["time"]));            
            if(placearr[parseInt(data[i]["origin"])]!=null)
            {
                data[i]["origin"]=placearr[parseInt(data[i]["origin"])]
            }
            if(placearr[parseInt(data[i]["finaldest"])]!=null)
            {
                data[i]["finaldest"]=placearr[parseInt(data[i]["finaldest"])]
            }
            data[i]["time"]=dat.toString().substring(4,24)
            //console.log(dat.toString())
        }
        
        res.status(200).send(data);
    }
    catch
    {
        //console.log("Failed to get Account data of the rider")
    }
});


router.get("/merchant/:merchantid/:limit",async (req,res)=>{
    try
    {
        var merchid=req.params.merchantid;
        var lim=req.params.limit;
        var data=await databasequery(`select order_id,product_id,name,total,tax,paid from foodigo.oc_order_product where status=5 and manufac_id=${parseInt(merchid)} limit ${parseInt(lim)}`);
        res.status(200).send(data)
    }
    catch
    {
        //console.log("Failed to get merchant data")
    }
});



module.exports = router;
