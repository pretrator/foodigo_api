var con = require("./connection");
function merchantquery1(sql) {
    return new Promise((resolve,reject)=>{
        con.query(sql,(error,result,fields)=>{
            if(error){return reject(`Problem ${error.stack}\n ${sql}`);}
            console.log("result is :"+JSON.stringify(result))
            console.log("Error is :"+JSON.stringify(error))
            resolve(result);
        });
       console.log(sql);
//        console.log("sql runs good")
    });
}
module.exports = merchantquery1;