var cron = require('node-cron');
var goldlib = require('./gold-api');
var db = require('./database');
var moment = require('moment-timezone');
moment.tz.setDefault("America/New_York");
require('log-timestamp');


cron.schedule('30 8 * * 2,3,4,5,6', () => {
    console.log("Running Cron");
    var dayBefore = moment().subtract(1,'days');
    console.log("Fetching Data for: " + dayBefore.format("YYYY-MM-DD"));
    goldlib.eodPrice(dayBefore).then(result => {
      console.log("Prices: ", result);
      if(result){
        db.addtoDatabase(result);
      }     
    });
},{
  timezone: "America/New_York"
});