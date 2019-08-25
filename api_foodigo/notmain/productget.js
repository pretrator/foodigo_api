var express = require("express");
var router = express.Router();
var con = require("./connection");
var databasequery = require("./databasequery");
var got = URL => require("got")(URL, { json : true });


router.get("/pfrider/:order_id",async (req,res)=>{
    try{
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log(ip)
        console.log("ip of the client")
        var order_id = req.params.order_id; 
        var data =  await databasequery(`SELECT * FROM foodigo.oc_order_product where order_id=${order_id} and status=2;`);
        var cust=await databasequery(`select telephone,firstname,lastname,shipping_address_1,shipping_address_2,shipping_zone from foodigo.oc_order where order_id=${order_id}`)
        for (const key in data) {
             var sql = `SELECT * FROM foodigo.oc_manufacturer where manufacturer_id=${data[key]["manufac_id"]};`
            //var sql = `SELECT * FROM foodigo.oc_merchant where merchant_id=2;`
            var sql2 = `SELECT name,quantity,total FROM foodigo.oc_order_product where order_id=${data[key]["order_id"]} and product_id=${data[key]["product_id"]};`
            var result2 = await databasequery(sql);
            var result3 = await databasequery(sql2);
            data[key].merchant_id = result2[0]["manufacturer_id"];
            data[key].merchant_name = result2[0]["name"];
            data[key].merchant_address = result2[0]["address"];
            data[key].merchant_phone = result2[0]["phone"];
            data[key].customer_addr=cust[0]["shipping_address_1"]+" "+cust[0]["shipping_address_2"]+" "+cust[0]["shipping_zone"]
            data[key].customer_phone=cust[0]["telephone"]
            data[key].cust_name=cust[0]["firstname"]+cust[0]["lastname"]
            data[key].product_detail = result3[0]["name"];
            data[key].product_quantity = result3[0]["quantity"];
            data[key].product_total = result3[0]["total"];
            data[key].block = 
            delete data[key].status;
            delete data[key].manufac_id;
            console.log("sending the data",data)
        }
        res.send(data);
    }catch(err){
        console.log(err);
    }
})
module.exports = router;