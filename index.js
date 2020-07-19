var cron = require('node-cron');
var express = require("express");
var goldlib = require('./gold-api');
var db = require('./database');
var moment = require('moment-timezone');
require('log-timestamp');

moment.tz.setDefault("America/New_York");
var today = moment();
var prices = {};
var returns = {};

var app = express();
app.listen(3000, () => {
 console.log("Server running on port 3000");
});

app.get('/prices', function(req, res) {
  // Return saved price value on API call
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(prices);
});

app.get('/returns', function(req, res) {
  // Return saved price value on API call
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(returns);
});

// Initialization of Price Data
goldlib.getPriceData(today.clone()).then(result => {
  prices = result;
});

// Initialization of Returns Data
db.getReturnsAsOf(today, (results) => {
  returns = results;
  console.log("Returns Updated");
});

// Cron job to refresh prices every hour at 5th minute
cron.schedule('5 * * * *', () => {
  var localTime = moment();
  today=localTime.clone();
  console.log("Fetching prices");
  goldlib.getPriceData(localTime).then(result => {
    prices = result;      
    console.log("Prices Updated: " + prices);
  });
    
  console.log("Fetching returns");
  db.getReturnsAsOf(today, (results) => {
    returns = results;
    console.log("Returns Updated: " + returns);
  });
},{
  timezone: "America/New_York"
});


