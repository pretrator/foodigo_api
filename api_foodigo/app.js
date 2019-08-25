var express = require("express")
var app = express()
var account = require("./notmain/accounts.js")
var merchant = require("./notmain/merchant")
var messages = require("./notmain/messages.js")
var notification = require("./notmain/notification.js")
var delivery = require("./notmain/delivery");
var rider = require("./notmain/rider");
var home = require("./notmain/home")
var product= require("./notmain/productget");
var con = require("./notmain/connection")
var specialdrider=require("./notmain/special.js")
app.use("/notifs/",notification)
app.use("/accounts/",account);
app.use("/messages/",messages);
app.use("/rider/",rider);
app.use("/delivery",delivery);
app.use("/product",product);
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use("/merchant",merchant);
app.use("/",home);
try{
	app.listen(55535,()=>console.log("no error in creating server"));	
}
catch{
	console.log("Error ho gayi bava");
}
