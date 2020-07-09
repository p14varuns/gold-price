var cron = require('node-cron');
var express = require("express");
var goldlib = require('./gold-api');
var db = require('./database');
var moment = require('moment-timezone');
require('log-timestamp');

moment.tz.setDefault("Europe/London");
var today = moment();
var prices = {};

var app = express();
app.listen(3000, () => {
 console.log("Server running on port 3000");
});

app.get('/', function(req, res) {
  // Return saved price value on API call
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(prices);
});

 // Initialization
 goldlib.getPriceData(today.clone()).then(result => {
  prices = result;
});

cron.schedule('1 8,9,10 * * *', () => {
  var localLondonTime = moment();
  if(localLondonTime.date() != today.date()){
    // Updating Price for today
    today=localLondonTime.clone();
    goldlib.getPriceData(localLondonTime).then(result => {
      prices = result;      
      console.log(prices);
      // Update price to DB
      var dayBefore = today.clone().subtract(1,'days');
      goldlib.eodPrice(dayBefore).then(result => {
        console.log("log prices: ", result);
        if(result)
          db.addtoDatabase(result);
      });

    });
  }
});