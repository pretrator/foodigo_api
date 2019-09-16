var mysql = require("mysql");

/**var con = mysql.createConnection({
	host: "#######.cbmbpjnncgh2.ap-south-1.rds.amazonaws.com",
	user: "wronguser",
	password: "wrongpasswd",
	database:"wrongdatabase",
	multipleStatements: true,
	port:"wrongport"
});
**/





//using the pool of 100 connection to connect to the sql server ......this incerases the throughput of the api with the database
var con  = mysql.createPool({
    connectionLimit : 1000,
    connectTimeout  : 60*1000,
    acquireTimeout   : 60 * 1000,
    timeout         : 60 * 1000,
  	host: "wronghost.ap-south-1.rds.amazonaws.com",
	user: "wronguser",
	password: "wrongpassword",
	database:"wrongdatabse",
	multipleStatements: true,
	port:"wrongport"

});







/**con.connect(function(err) {
	try{
		if(err){}
		else{console.log("connected")};
	}catch(err){console.log(err)};
});
**/



/**var del = con._protocol._delegateError;
con._protocol._delegateError = function(err, sequence){
  if (err.fatal) {
    console.trace('fatal error: ' + err.message);
  }
  return del.call(this, err, sequence);
};**/


//con.on('acquire', function (connection) {
//
//  console.log('Connection %d acquired', connection.threadId);
//});




module.exports = con;
