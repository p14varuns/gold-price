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

goldlib.getPriceData(today).then(result => {
  // Initialization
  prices = result;
});

cron.schedule('1 1,4,7,10,13,16,19,22 * * *', () => {
  localLondonTime = moment();
  if(localLondonTime.date() != today.date()){
    // Updating Price for today
    today=localLondonTime;
    goldlib.getPriceData(today).then(result => {
      prices = result;      
      
      // Update price to DB
      goldlib.eodPrice(today.subtract(1,'days')).then(result => {
        console.log("log prices: ", result);
        if(result)
          db.addtoDatabase(result);
      });

    });
  }
});