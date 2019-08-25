var express = require("express");
var router = express.Router();
const axios = require('axios')
const apikey_test="b7395c390618c6461b42d399a9d63e3a58d20cc79127857f51a428799e47192a"
const apikey_merchant="58ac68ece94c1a21ec105da7c36796629fbd8bc87b02dbc996b9f5317fc6b66c"
const apikey_rider="d8579b65a3047fd652e5f6f10a22a951e83daf948da460a48ce1cff27edb35cb"
var con = require("./connection");
var databasequery = require("./databasequery");
var got = URL => require("got")(URL, { json : true });

router.get("/:deviceid/:type/:id",async (req,res)=>{
  var device_id=req.params.deviceid;
  var type=parseInt(req.params.type);
  var id=parseInt(req.params.id);
    try
    {
        await databasequery(`insert into foodigo.oc_device values (${id},${type},'${device_id}')`)
    }
    catch(err)
    {   
        await databasequery(`update foodigo.oc_device set deviceid='${device_id}' where id=${id} and type=${type}`)
    }
  res.status(200).send();
});


router.get("/deregister/:deviceid/:type/:id",async (req,res)=>{
  var device_id=req.params.deviceid;
  var type=parseInt(req.params.type);
  var id=parseInt(req.params.id);
    try{
        await databasequery(`delete from foodigo.oc_device where id=${id} and type=${type} and deviceid='${device_id}'`)
        res.status(200).send();
    }
    catch(err){
        console.log(err)
        res.status(404).send();
    }

});

async function sendridernotifs(){
    var getritderidtosend=await databasequery("select distinct riderid from foodigo.oc_order where status=4")
    for(var per_rider_send_loop=0;per_rider_send_loop<getritderidtosend.length;per_rider_send_loop++){
        var id=getritderidtosend[per_rider_send_loop]["riderid"]
        var arr=[]
//      var polldata=await got(`http://localhost:55535/rider/poll/${id}`)
//        polldata=polldata.body
//        arr.push(polldata)
//        var product_data=[]
//        for(var poll_for_product=0;poll_for_product<polldata.length;poll_for_product++){
//            var data_of_poll=await got(`http://localhost:55535/product/pfrider/${polldata[poll_for_product]["order_id"]}`)
//            product_data.push(data_of_poll.body)
//        }
//      arr.push(product_data)
        await pushysend(id,arr,2)
    }
}


async function sendmerchnotifs()
{
    var res=await databasequery("select manufacturer_id from foodigo.oc_manufacturer")
    for(var lup=0;lup<res.length;lup++)
    {
        datatosend=await got(`http://localhost:55535/merchant/push/${res[lup]["manufacturer_id"]}`)
        console.log(datatosend.body,datatosend.body.length)
        if(datatosend.body.length>0)
        {
            console.log("sending push");
            await pushysend(res[lup]["manufacturer_id"],datatosend.body,1);
        }
    }
}

async function pushysend(id,data,type)
{
    api_key=""
    if(parseInt(type)==1){
        api_key=apikey_merchant
    }
    else if(parseInt(type)==2){
        api_key=apikey_rider
    }
    devices=[]
    deviceid=await databasequery(`select deviceid from foodigo.oc_device where id=${parseInt(id)} and type=${parseInt(type)}`)
    for(var lup=0;lup<deviceid.length;lup++)
    {
        devices.push(deviceid[lup]["deviceid"])
    }
    console.log("devices ------------------",devices)
    data1={
            "to": devices,
            "data": {
                    "message": "New Orders available!",
                    "data": data
                    },
            "notification": {
                    "body": "Hello World \u270c",
                    "badge": 1,
                    "sound": "ping.aiff"
                            }
          }
    console.log(data1)
    axios.post(`https://api.pushy.me/push?api_key=${api_key}`,data1 ).then(async (res) => {
                console.log("data aayay hai ---------------",res.status)                                              
                if(res.status==200){
                    if(parseInt(type)==1){
                        await databasequery(`update foodigo.oc_order_product set status=1 where manufac_id=${parseInt(id)} and status=0;`);
                    }
                 }
                console.log(res.body)
                }).catch((error) => {
                console.error(error)
                })
}


setInterval(sendmerchnotifs,1000*60*2)
setInterval(sendridernotifs,1000*60*2)
module.exports = router;
