var express = require("express");
var router = express.Router();
var con = require("./connection");
var maxorder=1000000;   //maximum order that a rider can take
var timelag=60000000;
var finalresultforrider;
var databasequery = require("./databasequery");
var got = URL => require("got")(URL, { json : true });
var fetch = require("node-fetch");
router.get("/:riderid",async (req,res)=>{
   try{   
        var riderid = req.params.riderid;
        //comment the below line for production
		var sql = `select order_id,shipping_zone_id from foodigo.oc_order where status=0;update foodigo.oc_order set status=0 where status=0`;
        //uncomment the below line for production
        //var sql = `select order_id,shipping_zone_id from foodigo.oc_order where status=0;update foodigo.oc_order set status=-1 where status=0`;
        var result = await databasequery(sql);
        console.log("selecting orders " +result[0].length);
	for(var i=0;i<result[0].length;i++)
	{
        console.log("iteraring through orders "+result[0][i]["order_id"]);
		var sql2 = `select status from foodigo.oc_integrate where order_id=${result[0][i]["order_id"]}`;
        var result2 = await databasequery(sql2);
		//console.log(result2);
		var bool=1;          // 1 for weather we want this data to be sent to rider or not
		var counw=0
		for(var j=0;j<result2.length;j++)
		{
			// if any of the product has status of 0 or 1 we will not proceed further
			if(result2[j]["status"]<=1)
			{
				bool=0;
	       	}
	       	counw=counw+result2[j]["status"];
        }
        if(counw/result.length==3){
        	// cancel the placement of delivery man for those order whose all product have been rejected by the merchant
        	bool=0;
        }
        //order on whom we are not setting a delivery man will be reset back to status=0
        if(bool==0){
        	var sq="update foodigo.oc_order set status=0 where order_id="+result[0][i]["order_id"];
        	var reupdateorder=await databasequery(sq);
            console.log("order assignation cancelled");
        }
        if(bool==1)
        {
        	console.log("qualified order= "+result[0][i]["order_id"]);
        	var dat=new Date();
        	var tim=dat.toTimeString().substring(0,8);
            var response = await got("http://13.126.251.226:55535/delivery/"+result[0][i]["order_id"]);
            var routeoforder=response.body;
        	var sql3=`select rider_id,current_ride,currentwaittimestart from foodigo.oc_riderdata where timestart<time("${tim}") and time("${tim}")<timeend and route=${routeoforder} and status=2`;
        	var result3 = await databasequery(sql3);
        	var setnewrider=0;
        	//console.log(result3[0]);

            // uncomment the line below for production mode
        	if(result3.length!=0){
        	//comment the line below for production
        	//setrider=1;
        	// comment the line below for production
        	//if(false){
        		for (var looponrider = 0; looponrider < result3.length; looponrider++){
        	    console.log("result3 is= "+result3[looponrider]["current_ride"]);
        		//console.log(result3[looponrider]["currentwaittimestart"]);
        		var sql4="select count(order_id) from foodigo.oc_ride_history where ride_id="+result3[looponrider]["current_ride"];
        		var result4=await databasequery(sql4);
         		console.log(result4)
         		var totaltimelag=parseInt(new Date().getTime())-parseInt(new Date(parseInt(result3[looponrider]["currentwaittimestart"])).getTime());
         		console.log(totaltimelag);
        		if(result4[0]["count(order_id)"]<maxorder && timelag>totaltimelag){
                   var sqltoupdate="Insert into foodigo.oc_ride_history values("+result3[looponrider]["current_ride"]+","+result[0][i]["order_id"]+","+result3[looponrider]["rider_id"]+")";
                   // uncomment the below line before running a production test
                   //var ryt = await databasequery(sqltoupdate);
                   var sqlgetdat="select finaldest from foodigo.oc_rider_history where ride_id="+result3[looponrider]["current_ride"];
                   var result6=await databasequery(sqlgetdat);
                   console.log(looponrider+" result "+result6[0]["finaldest"]);
                   var finaldistantdestination=await got("http://13.126.251.226:55535/delivery/"+result6[0]["finaldest"]+"/"+result[0][i]["shipping_zone_id"]);
                   var sqltoupdatefin="update foodigo.oc_rider_history set finaldest="+finaldistantdestination.body+" where ride_id="+result3[looponrider]["current_ride"];
                  //uncomment the below line for production mode
                  //var resw=await databasequery(sqltoupdatefin);


                   //update the status to 4 for the products whose on ehome delivery boy has been assigned
                   var sqlstatus4="update foodigo.oc_integrate set status="+result3[looponrider]["rider_id"]+" where order_id="+result[0][i]["order_id"];
                   var resultofsqlstatus4=await databasequery(sqlstatus4);
                   console.log("old rider assigned");


                }
        		else{
        			setnewrider=1;
        		    }
        		}
        	}
        	else{
        		setnewrider=1;
        	}
        	if(setnewrider==1){

        		var sqlforcount="select rider_id from foodigo.oc_riderdata where status=1";
        		var noofriderresult=await databasequery(sqlforcount);
        		var randomride=Math.floor(Math.random()*noofriderresult.length);
        		console.log(noofriderresult,randomride);
                var noofrider=noofriderresult[randomride];
                console.log(noofrider);
        		var rideridselected=noofrider["rider_id"];
                console.log("assigning a new rider "+rideridselected);
        		var currtime=new Date().getTime();
        		console.log("starting get");
        		var routeoforder = await got("http://13.126.251.226:55535/delivery/"+result[0][i]["order_id"]);
        		//console.log("got it "+routeoforder.);
        		var sqltoget="select AUTO_INCREMENT from information_schema.TABLES where TABLE_NAME='oc_rider_history' and TABLE_SCHEMA='foodigo';";
        		var responseofid=await databasequery(sqltoget);
        		var sqlfornewrider="INSERT INTO foodigo.oc_rider_history VALUES ("+responseofid[0]["AUTO_INCREMENT"]+","+rideridselected+","+currtime+","+routeoforder.body+","+result[0][i]["shipping_zone_id"]+");";
        		//console.log(sqlfornewrider);
                //console.log("not the abobe insert")
        		var sqlfornewrider2="Insert into foodigo.oc_ride_history values ("+responseofid[0]["AUTO_INCREMENT"]+","+result[0][i]["order_id"]+");";
        		var sqlfornewrider3="update foodigo.oc_riderdata set route="+routeoforder.body+",status=2,current_ride="+responseofid[0]["AUTO_INCREMENT"]+",currentwaittimestart="+currtime+" where rider_id="+rideridselected+";";
        		var exec1=await databasequery(sqlfornewrider+sqlfornewrider2+sqlfornewrider3);
        		console.log(exec1,sqlfornewrider+sqlfornewrider2+sqlfornewrider3);
        		var sqlstatus4="update foodigo.oc_order set status="+rideridselected+" where order_id="+result[0][i]["order_id"];
                console.log(sqlstatus4);
                var resultofsqlstatus4=await databasequery(sqlstatus4);

        	}
        }
     var sqlfordatatofride="select order_id,shipping_firstname,shipping_lastname,shipping_address_1,shipping_city,shipping_country,shipping_zone,telephone from foodigo.oc_order where status="+riderid;
     finalresultforrider=await databasequery(sqlfordatatofride);
    }
}
    catch(err){console.log(err)}
	//console.log("finalresultforrider= "+finalresultforrider);
	/*Krishna*/
	//we have to attach all the product with the order id
	for(var i=0;i<finalresultforrider.length;i++){
		var order_id = finalresultforrider[i].order_id;
		var data = await fetch("http://localhost:55535/product/pfrider/"+25);
		data = await data.json();
		finalresultforrider[i].products = data;
	}
    res.status(200).send(finalresultforrider);
});

router.get("/:servicetype/:dat",async (req,res)=>{
    /**
    servicetype=1 for order to be picked
    servicetype =2 for order to to be delivered
    **/
    var servicetype1=req.params.servicetype;
    var data1=req.params.dat;
    var sqltodo="";
    if(servicetype1==1){
        var sqltodo="update foodigo.oc_order set status=-1 where order_id="+data1;
    }
    if(servicetype1==2){
        var sqltodo="update foodigo.oc_order set status=-2 where order_id="+data1;
    }
    var resultofsqltodo=await databasequery(sqltodo);
    res.send(200);
});

module.exports = router;
