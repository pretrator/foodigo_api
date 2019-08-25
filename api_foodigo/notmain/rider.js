var express = require("express");
var router = express.Router();
var con = require("./connection");

var maxorder=1000000;   //maximum order that a rider can take
var timelag=1000*60*15;
var costperorder=10;
var finalresultforrider;
var databasequery = require("./databasequery");
var got = URL => require("got")(URL, { json : true });
var fetch = require("node-fetch");
var distanceofblocktobeserved=1;
async function cronriderassign(){
    try{
            //console.log("selecting orders")
            var sql = `select order_id,shipping_zone_id from foodigo.oc_order where riderid=0 and status=0;`;
	        var result = await databasequery(sql);
            console.log("orders selected from database length="+result.length,result,result.length)
            for (var i=0;i<result.length;i++)
            {
                console.log("iteraring through orders order number"+parseInt(result[i]["order_id"]));
                var sql2 = `select status from foodigo.oc_order_product where order_id=${parseInt(result[i]["order_id"])}`;
                var result2 = await databasequery(sql2);
                var bool=1;          //value of bool is 1 if we want to send this order to any of the rider 0 denote we dont want to send this order
                var counw=0
                
                for(var j=0;j<result2.length;j++)
                {
                   // if any of the product has status of 0 or 1 we will not proceed further
                    if(result2[j]["status"]<=1)
                    {
                        bool=0;
                        console.log("rider not assigned due to any status<=0")
                        continue;
                    }
                    counw=counw+result2[j]["status"];
                }
                if(counw/result2.length==3)
                {
                    // cancel the placement of delivery man for those order whose all product have been rejected by the merchant
                    bool=0;
                    console.log("rider not assigned due to all products cancelled by the merchant")
                    //ordercancelled(parseInt(result[i]["order_id"]))
                    continue;
                }
                // bad comment order on whom we are not setting a delivery man will be reset back to status=0
                if(bool==0)
                {
                   // var sq="update foodigo.oc_order set rideid=0 where order_id="+parseInt(result[0][i]["order_id"]);
                   // var reupdateorder=await databasequery(sq);
                    console.log("order assignation cancelled temporarily for orderid ="+parseInt(result[i]["order_id"]));
                }
                else{
                    //any order qualifies to be special order if it has has any special product or it has more than two merchant to pick order from
                    if(await specialorder(result[i]["order_id"]))
                    {
		                await assignnewrider(result[i]["order_id"]);
	                }
	               else
                    {
                        //share function is used to assign rider if order is not special
                        await share(result[i]["order_id"])
	                }
            }
            }
        }
        catch(err)
        {
            console.log(err)
        }
	}
setInterval(cronriderassign,1000*30)



//tested
router.get("/poll/:ridei",async (req,res)=>{
try{
    var ridid=parseInt(req.params.ridei);
    console.log("serving a poll request")
    var lis=await databasequery("select order_id from foodigo.oc_order where status=4 and riderid="+parseInt(req.params.ridei))
    res.status(200).send(lis)
}
catch{
    res.status(404).send()
}
});




//function for the rider to be used when he delivers the order or picks the order
//tested
router.get("/deli/:orderi/:otp",async (req,res)=>{
    try{
    console.log("Serving the delivery request");
    var ot=parseInt(req.params.otp);
    var orderidw=parseInt(req.params.orderi);
    var we=await databasequery("select otp from foodigo.oc_order where order_id="+parseInt(orderidw));
    //console.log(we)
    origotp=parseInt(we[0]["otp"])
    
    
    if(origotp==ot){
         console.log("Successfull------------------------------------------------------------------------------------------")
        await orderdelivered(orderidw)
        res.status(200).send("done")
    }
    else{
        res.status(412).send("incorrect otp")
    }

}
catch(err){
    console.log(err)
    res.status(404).send()
}
});



router.get("/picked/:orde",async (req,res)=>{
    try{
        //open this for production
        await orderpicked(parseInt(req.params.orde))
        res.status(200).send("done")
    }
    catch{
        res.status(404).send()
    }
})
//router.get("/picked/:order")


//async function ordercancelled(ordf){
//    databasequery(`update foodigo.oc_order set status=1 where order_id=${ordf}`)
//    //send sms
//    // refund the money script
//}

async function statuschange(ordeid,status){
    await databasequery(`UPDATE foodigo.oc_order SET order_status_id = ${status}, date_modified = NOW() WHERE order_id = ${ordeid}`);
    await databasequery(`INSERT INTO oc_order_history SET order_id =${ordeid},order_status_id=${status},notify='0',comment='',date_added= NOW()`)
}

async function orderdelivered(ordf){
    // impure function

    var dda=await databasequery(`update foodigo.oc_order_product set status=4 where order_id=${parseInt(ordf)} and status=2`);
    //update order specific information
    //console.log("executing sql")
    var dd=await databasequery("update foodigo.oc_order set status=3 where order_id="+parseInt(ordf));
    var dd=await databasequery(`update foodigo.oc_order_product set status=5 where order_id=${parseInt(ordf)} and status=4`)
    var dd=await databasequery(`update foodigo.oc_order_product set status=7 where order_id=${parseInt(ordf)} and status=3`)


    //get the status of all the order to check if all the orders have been delivered or not
    var kk=await databasequery("select status from foodigo.oc_order where order_id in (select order_id from foodigo.oc_ride_history where ride_id=(select rideid from foodigo.oc_order where order_id="+parseInt(ordf)+"))")
    var len=0


    //check if all the order had been delivered or not
    for(var lop=0;lop<kk.length;lop++){
        if(kk[lop]["status"]==3){
            len=len+1;
        }
    }
    console.log(len,kk.length)
    //free the rider
    if(len==kk.length){
        var dk=await databasequery("update foodigo.oc_riderdata set status=2,current_ride=0 where rider_id=(select riderid from foodigo.oc_order where order_id="+parseInt(ordf)+")")
    }
    await statuschange(ordf,20)
    try{
    await got(`http://localhost:55535/messages/delivered/${parseInt(ordf)}`)
        }
    catch(err){
        console.log(err);
    }

}







async function orderpicked(ortv){
    //impure function
    var dd=await databasequery(`update foodigo.oc_order set status=2 where order_id=${parseInt(ortv)} and status=4`);
    var dda=await databasequery(`update foodigo.oc_order_product set status=4 where order_id=${parseInt(ortv)} and status=2`);
    await statuschange(ortv,24)
    try{
        await got("http://localhost:55535/messages/picked/"+parseInt(ortv));
    }catch(err){
        console.log(err)
    }
}






async function specialorder(orderid){
    //pure function

    //any order qualifies to be special order if it has has any special product or it has more than one merchant
    var sq="select * from foodigo.oc_special_products;select product_id,manufac_id from foodigo.oc_order_product where order_id="+parseInt(orderid);
    var qw=await databasequery(sq);
    var ds=[]
    var ty=[]
    var merch=[]
    for(var rt=0;rt<qw[0].length;rt++){
        ds.push(qw[0][rt]["product_id"])
    }
    for(var vb=0;vb<qw[1].length;vb++){
        ty.push(qw[1][vb]["product_id"])
        merch.push(qw[1][vb]["manufac_id"])
    }
    var common=ds.filter(x => ty.includes(x))
    var setofmerch=new Set(merch);
    var numofmerch=setofmerch.size
    var lenofcommon=common.length
    //console.log(lenofcommon,numofmerch)
    if(lenofcommon>0 || numofmerch>1){
        return true
    }
    else{
        return false
    }
}







async function assignnewrider(orderids){
    //impure function
    var dat=new Date();
    var tim=dat.toTimeString().substring(0,8);
    var sd="select rider_id from foodigo.oc_riderdata where status=2 and timestart<time('"+tim+"') and time('"+tim+"')<timeend";
    var listoffreerider=await databasequery(sd)
    if(listoffreerider.length!=0)
    {
        var randomride=Math.floor(Math.random()*listoffreerider.length);
        var riderid=listoffreerider[randomride]["rider_id"];
        var currtime=new Date().getTime();
        var origdest=await getoriginanddestination(orderids);
        var shippingcost=await databasequery("select value from foodigo.oc_order_total where code='shipping' and order_id="+parseInt(orderids))
        var sqltoget=await databasequery("select AUTO_INCREMENT from information_schema.TABLES where TABLE_NAME='oc_rider_history' and TABLE_SCHEMA='foodigo';");
        var sqlfornewrider="INSERT INTO foodigo.oc_rider_history VALUES ("+parseInt(sqltoget[0]["AUTO_INCREMENT"])+","+parseInt(riderid)+","+parseInt(currtime)+","+parseInt(origdest[0])+","+parseInt(origdest[1])+","+parseInt(shippingcost[0]["value"])+",0);";
        var sqlfornewrider2="Insert into foodigo.oc_ride_history values ("+parseInt(sqltoget[0]["AUTO_INCREMENT"])+","+parseInt(orderids)+");";
        await databasequery(`update foodigo.oc_riderdata set status=1,current_ride=${parseInt(sqltoget[0]["AUTO_INCREMENT"])},origin=${parseInt(origdest[0])},currentwaittimestart=${parseInt(currtime)},destination=${origdest[1]} where rider_id=${riderid}`);
        await databasequery(sqlfornewrider)
        await databasequery(sqlfornewrider2)
        await databasequery(`update foodigo.oc_order set status=4,rideid=${parseInt(sqltoget[0]["AUTO_INCREMENT"])},riderid=${parseInt(riderid)} where order_id=${parseInt(orderids)}`)
        try{
                await got("http://localhost:55535/messages/sendotponorderid/"+parseInt(orderids))  
            }
        catch(err)
        {
            console.log(err)
        }
        
        console.log(`Order ${orderids} has been assigned with a rider`)

    }
    else
    { 
        console.log("No free rider found")
        //var sq=await databasequery("update foodigo.oc_order set status=0 where order_id="+parseInt(orderids));
    } 
}       








async function getshareablerides(order){
    //pure function
    var dat=new Date();
    var tim=dat.toTimeString().substring(0,8);
    var originanddestofcurrentorder=await getoriginanddestination(order);
    var orders="select rider_id,current_ride,currentwaittimestart,destination from foodigo.oc_riderdata where timestart<time('"+tim+"') and time('"+tim+"')<timeend and origin="+parseInt(originanddestofcurrentorder[0])+" and status=1";
    var orderresult=await databasequery(orders);
    //console.log(orderresult)
    var listofrides=[];
    for(var looperw=0;looperw<orderresult.length;looperw++){
        var nooforders=await databasequery("select count(order_id) from foodigo.oc_ride_history where ride_id="+parseInt(orderresult[looperw]["current_ride"]))
        nooforders=nooforders[0]["count(order_id)"]
        //console.log(nooforders)
        var totaltimelag=parseInt(new Date().getTime())-parseInt(new Date(parseInt(orderresult[looperw]["currentwaittimestart"])).getTime());
        var dest=parseInt(orderresult[looperw]["destination"])
        var distanceinblock=Math.abs(dest-originanddestofcurrentorder[1]);
        //console.log(dest,originanddestofcurrentorder);
        //console.log(distanceinblock,distanceofblocktobeserved,totaltimelag,timelag,maxorder,nooforders)
        if(distanceinblock<=distanceofblocktobeserved && totaltimelag<timelag && maxorder>nooforders)
        {
            listofrides.push(orderresult[looperw]["current_ride"])
        }
    }
    console.log("shareable rides found",listofrides)
    return listofrides;
    //console.log(originanddestofcurrentorder);
}








async function getoriginanddestination(ord){
    //pure function
    var dest = await databasequery("select shipping_zone_id from foodigo.oc_order where order_id="+parseInt(ord));
    //console.log(dest,ord)
    var merchids=await databasequery("select manufac_id from foodigo.oc_order_product where order_id="+parseInt(ord));
    li=[]
    dest=dest[0]["shipping_zone_id"]
    for(var dd=0;dd<merchids.length;dd++)
    {
        li.push(parseInt(merchids[dd]["manufac_id"]));
    }
    var orig=Math.max(...li);
    var orign=await databasequery("select block from foodigo.oc_manufacturer where manufacturer_id="+parseInt(orig));
    orign=orign[0]["block"]
    var fr=[orign,dest]
    return fr;
}







async function share(orderw){
    //impure function
    var shareablerides=await getshareablerides(orderw);
    if(shareablerides.length==0){
        assignnewrider(orderw);
    }
    else{
        var sharedride=shareablerides[0]
        await databasequery(`update foodigo.oc_rider_history set price=price+${parseInt(costperorder)} where ride_id=${parseInt(sharedride)}`);
        await databasequery("insert into foodigo.oc_ride_history values("+parseInt(sharedride)+","+parseInt(orderw)+")");
        await databasequery("update foodigo.oc_order set status=4,rideid="+parseInt(sharedride)+",riderid=(select rider_id from foodigo.oc_rider_history where ride_id="+parseInt(sharedride)+") where order_id="+parseInt(orderw));
        
        console.log(`Order ${orderw} has been assigned with a rider `);
        try
        {
            await got("http://localhost:55535/messages/sendotponorderid/"+parseInt(parseInt(orderw)))
        }
        catch(err)
        {
            console.log("Message sending Failed for orderId "+orderw)
        }

    }
}

module.exports = router;