var cron = require('node-cron');
var express = require("express");
var lib = require('./gold-api');
var moment = require('moment-timezone');

var app = express();
app.listen(3002, () => {
 console.log("Server running on port 3000");
});

var prices = {
  "USD":"1,700.40",
  "GBP":"1,360.10",
  "AUD":"2,648.60",
  "CAD":"2,425.37",
  "CHF":"1,635.02",
  "EUR":"1,532.65",
  "JPY":"181,824",
  "ZAR":"31,989",
  "INR":"128,943",
  "CNY":"12,009",
  "HKD":"13,200",
  "timestamp":"2 May 2020 11:28:01"
};

app.get('/gold-prices', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.json(prices);
});

updatePrices = () => {
  console.log("updating prices");
  lib.goldprice().then(result => {
    prices = result;
    console.log(prices);
  });
};

updatePrices();

cron.schedule('5,15,25,35,45,55 * * * *', () => {
  moment.tz.setDefault("Europe/London");
  localLondonTime = moment();
  lastUpdateTime = moment(prices.timestamp, "DD MMM YYYY hh:mm:ss");
  var diffMins = localLondonTime.diff(lastUpdateTime, 'minutes');
  if(diffMins > 60){  // Refresh after 60 mins
    updatePrices();
  };
});
