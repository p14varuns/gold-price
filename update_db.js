var goldlib = require('./gold-api');
var db = require('./database');
var moment = require('moment-timezone');
require('log-timestamp');

moment.tz.setDefault("Europe/London");
var today = moment();
var dayBefore = today.clone().subtract(1,'days');
console.log(today);
console.log(dayBefore);

goldlib.eodPrice(dayBefore).then(result => {
console.log("log prices: ", result);
if(result)
    db.addtoDatabase(result);
});
