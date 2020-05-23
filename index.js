var cron = require('node-cron');
var express = require("express");
var goldlib = require('./gold-api');
var moment = require('moment-timezone');

moment.tz.setDefault("Europe/London");
var today = moment();
var prices = {};

var app = express();
app.listen(3000, () => {
 console.log("Server running on port 3000");
});

app.get('/', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(prices);
});

goldlib.getPriceData(today).then(result => {
  prices = result;
});

cron.schedule('1 * * * *', () => {
  localLondonTime = moment();
  if(localLondonTime.date() != today.date()){
    today=localLondonTime;
    goldlib.getPriceData(today).then(result => {
      prices = result;
    }); 
  }
});