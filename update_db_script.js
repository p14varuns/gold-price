var cron = require('node-cron');
var goldlib = require('./gold-api');
var db = require('./database');
var moment = require('moment-timezone');
moment.tz.setDefault("America/New_York");
require('log-timestamp');

console.log("Running Cron");
var dayBefore = moment().subtract(3,'days');
console.log("Fetching Data for: " + dayBefore.format("YYYY-MM-DD"));

goldlib.eodPrice(dayBefore).then(result => {
  console.log("Prices: ", result);
  if(result)
    db.addtoDatabase(result);     
});
