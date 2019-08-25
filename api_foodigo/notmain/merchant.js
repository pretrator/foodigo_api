var express = require("express");
var router = express.Router();
var con = require("./connection");
var got = URL => require("got")(URL, { json : true });
var databasequery = require("./databasequery");
router.get("/:merchantid",async (req,res)=>{
    try{
        var merchantid = req.params.merchantid;
        //var sql = `select order_id,product_id,name,quantity,total from foodigo.oc_order_product where product_id in (select product_id from foodigo.oc_integrate where manufac_id = ${merchantid} and status=0) and order_id in (select order_id from foodigo.oc_integrate where manufac_id = ${merchantid} and status=0);update foodigo.oc_integrate set status=1 where manufac_id=${merchantid} and status=0;`
        //line for test puspose
        //var sql = `select order_id,product_id,name,quantity,total from foodigo.oc_order_product where product_id in (select product_id from foodigo.oc_integrate where manufac_id = ${merchantid} and status=0) and order_id in (select order_id from foodigo.oc_integrate where manufac_id = ${merchantid} and status=0);update foodigo.oc_integrate set status=0 where manufac_id=${merchantid};`
        var sql=`select oc_order.telephone,oc_order_product.order_id,oc_order_product.product_id,oc_order_product.name,oc_order_product.quantity,oc_order_product.total from foodigo.oc_order_product inner join foodigo.oc_order on oc_order.order_id=oc_order_product.order_id where oc_order_product.status=0 and oc_order_product.manufac_id=${parseInt(merchantid)};update foodigo.oc_order_product set status=1 where manufac_id=${merchantid} and status=0`;
        var result = await databasequery(sql);
        //console.log(JSON.stringify(result))
        res.status(200).send(result[0]);
        //send something if size of result is zero
    }catch(err){console.log(err)}
});

router.get("/push/:merchantid",async (req,res)=>{
    try{
        var merchantid = req.params.merchantid;
        var sql=`select oc_order.telephone,oc_order_product.order_id,oc_order_product.product_id,oc_order_product.name,oc_order_product.quantity,oc_order_product.total from foodigo.oc_order_product inner join foodigo.oc_order on oc_order.order_id=oc_order_product.order_id where oc_order_product.status=0 and oc_order_product.manufac_id=${parseInt(merchantid)}`;
        var result = await databasequery(sql);
        res.status(200).send(result);
    }catch(err){console.log(err)}
});


router.get("/curroption/:merchantid",async (req,res)=>{
    try{
        var merchantid = req.params.merchantid;
        var sql=`select oc_order.date_added,oc_order_product.order_id,oc_order_product.product_id,oc_order_product.status,oc_order_product.name,oc_order_product.quantity,oc_order_product.total,oc_order_product.tax from foodigo.oc_order_product inner join foodigo.oc_order on oc_order.order_id=oc_order_product.order_id where oc_order_product.manufac_id=${parseInt(merchantid)} and oc_order_product.status in (2,3)`;
        var result = await databasequery(sql);
        for(var loop_taxedit=0;loop_taxedit<result.length;loop_taxedit++){
            result[loop_taxedit]["tax"]=result[loop_taxedit]["tax"]*result[loop_taxedit]["quantity"]
        }
        //console.log(JSON.stringify(result))
        res.status(200).send(result);
    }catch(err){console.log(err)}
});


router.post("/:merchantid",async (req,res)=>{
    try{
        var merchantid = req.params.merchantid;
        var jsondata = req.body;
        console.log("got Request",jsondata.order_status,jsondata.order_id,merchantid,jsondata);
        var sql = `update foodigo.oc_order_product set status=${parseInt(jsondata.order_status)} where order_id=${parseInt(jsondata.order_id)} and manufac_id=${parseInt(merchantid)} and product_id=${parseInt(jsondata.product_id)} and status=1`;
        try{
            await databasequery(sql);
            res.status(200).send("updated successfully");
        }
        catch(err){
            console.log(err)
            res.status(404).send("unable to update the thing");
        }
        
//        con.query(sql,function(err,result){
//            if(err){
//                
//                return console.log(err);
//            }
//        });
        var resu=await databasequery(`select status from foodigo.oc_order_product where order_id=${jsondata.order_id}`);
        var flag=0;
        var cancel=1;
        for(var i=0;i<resu.length;i++){
            if(parseInt(resu[i]["status"])==1){
                flag=1
            }
            if(parseInt(resu[i]["status"])!=3){
                cancel=0
            } 
        }
        if(cancel==1)
        {
            await databasequery("UPDATE `oc_order` SET order_status_id = '18', date_modified = NOW() WHERE order_id = '"+parseInt(jsondata.order_id)+"'")
            await databasequery("INSERT INTO oc_order_history SET order_id='"+parseInt(jsondata.order_id)+"',order_status_id='18',notify='0',comment='Starting the process of refund very soon',date_added=NOW()")
            await databasequery("update foodigo.oc_order set status=1 where order_id="+parseInt(jsondata.order_id))
            var dda=await databasequery(`update foodigo.oc_order_product set status=7 where order_id=${parseInt(jsondata.order_id)} and status=3`);
            try{
                await got("http://localhost:55535/messages/cancelled/"+parseInt(jsondata.order_id)) 
            }
            catch(err){
                console.log(err)
            }
        }
        else
        {
            if(flag==0)
            {
                var otp=await databasequery(`select otp from foodigo.oc_order where order_id=${parseInt(jsondata.order_id)}`)
                var int_otp=parseInt(otp[0]["otp"])
                await databasequery("UPDATE `oc_order` SET order_status_id = '17', date_modified = NOW() WHERE order_id = '"+parseInt(jsondata.order_id)+"'")
                await databasequery(`INSERT INTO oc_order_history SET order_id= '${parseInt(jsondata.order_id)}',order_status_id='17',notify='1',comment='OTP-${int_otp}',date_added= NOW()`)
                await databasequery(`update foodigo.oc_order set status=0 where order_id=${parseInt(jsondata.order_id)} and status=-1`)
            }
        }
        //console.log(resu);
    }catch(err){console.log(err)}
});
//async function switch_products_off(){
//    await databasequery("update foodigo.oc_product set quantity=0 where manufacturer_id in (select manufacturer_id from foodigo.oc_manufacturer where now() between starttime and endtime")
//}
//async function switch_products_on(){
//    await databasequery("update foodigo.oc_product set quantity=100 where manufacturer_id in (select manufacturer_id from foodigo.oc_manufacturer where now() not between starttime and endtime")
//}
module.exports = router;
