var express = require("express");
const request = require('request')
var router = express.Router();
var con = require("./connection");
const api='vPsOECoMi8c-BHoCjckpsCi2vu61YbJUlnZVWXf9jo'
const ur='https://api.textlocal.in/send/?'
var databasequery = require("./databasequery");
router.get("/sendotponorderid/:orderid",async (req,res)=>{
    try{   
        var orderi=parseInt(req.params.orderid)
        var re=await databasequery("select otp,telephone from foodigo.oc_order where order_id="+parseInt(orderi)+";select Name from foodigo.oc_riderdata where rider_id=(select rider_id from foodigo.oc_rider_history where ride_id=(select rideid from foodigo.oc_order where order_id="+parseInt(orderi)+"))");
        var merchantphone=await databasequery(`select phone from foodigo.oc_manufacturer where manufacturer_id in (select distinct manufac_id from foodigo.oc_order_product where order_id=${orderi})`)
        merchant_phone=merchantphone[0]["phone"]
        //console.log(merchant_phone)
        otp=re[0][0]["otp"]
        telephone=re[0][0]["telephone"]
        name=re[1][0]["Name"]
        //console.log(re,re[0][0],re[1],otp,telephone,name)
        data={
            'apikey':api,
            'numbers':telephone,
            'sender':'FDIGIN',
            'message':`${otp} is the OTP for OrderID- ${orderi}. 
Give this OTP to our delivery executive when your order is received. Call restaurant at ${merchant_phone} to know your status.`
             }
             console.log(data)
        //res.status(200).json(otp)
            request.post({url:ur, form:data}, (error, res, body) => {
            if (error){
                console.error(error)
                return
            }
            console.log(`statusCode of message service: ${res.statusCode}`)
            console.log(body)
            })
        }catch(err)
        {
            console.log(err)
        }   
   res.send()
});
router.get("/delivered/:orderi",async (req,res)=>{
    try{
        var orderi=parseInt(req.params.orderi)
        var re=await databasequery("select telephone,firstname from foodigo.oc_order where order_id="+parseInt(orderi))
        telephone=re[0]["telephone"]
        name=re[0]["firstname"]
        data={
            'apikey':api,
            'numbers':telephone,
            'sender':'FDIGIN',
            'message':`Dear customer,
Your order with OrderID - ${orderi}has been delivered.
Thank you for providing us with a chance to serve you.
Regards Foodigo.in`
             }
        //res.status(200).json(otp)
            request.post({url:ur, form:data}, (error, res, body) => {
            if (error) {
                console.error(error)
                return
            }
            console.log(`statusCode of message service: ${res.statusCode}`)
            console.log(body)
            })
        }catch(err)
        {
            console.log(err)
        }   
        res.send()
});
router.get("/picked/:orderi",async (req,res)=>{
    try{
        var orderi=parseInt(req.params.orderi)
        var re=await databasequery("select telephone from foodigo.oc_order where order_id="+parseInt(orderi)+";select Name,phone from foodigo.oc_riderdata where rider_id=(select rider_id from foodigo.oc_rider_history where ride_id=(select rideid from foodigo.oc_order where order_id="+parseInt(orderi)+"))")
        phonerider=re[1][0]["phone"]
        name=re[1][0]["Name"]
        telephonecustomer=re[0][0]["telephone"]
        //telephonecustomer=8094435367;
        data={
            'apikey':api,
            'numbers':telephonecustomer,
            'sender':'FDIGIN',
            'message':`Your order has been picked by our Delivery Executive
Call at ${phonerider} to know your order status.
Regards Foodigo.in`
             }
        //console.log(data)
            request.post({url:ur, form:data}, (error, res, body) => {
            if (error) {
                console.error(error)
                return
            }
            console.log(`statusCode of message service: ${res.statusCode}`)
            console.log(body)
            })
        }catch(err)
        {
            console.log(err)
        }   
        res.send()
});
router.get("/cancelled/:orderi",async (req,res)=>{
    try{
        var orderi=parseInt(req.params.orderi)
        var re=await databasequery("select telephone from foodigo.oc_order where order_id="+parseInt(orderi))
        telephonecustomer=re[0]["telephone"]
        data={
            'apikey':api,
            'numbers':telephonecustomer,
            'sender':'TXTLCL',
            'message':`Dear Customer
Your Orde- ${orderi}
has been Cancelled due to unavailability of the food product. Refund will start shortly. 
Sorry for the inconvenience
FOODIGO.IN`
             }
            request.post({url:ur, form:data}, (error, res, body) => {
            if (error) {
                console.error(error)
                return
            }
            console.log(`statusCode of message service: ${res.statusCode}`)
            console.log(body)
            })
        }catch(err)
        {
            console.log(err)
        }   
       res.send()
});
module.exports = router;
