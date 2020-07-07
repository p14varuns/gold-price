const mysql = require('mysql');
const config = require('./config');

var con = mysql.createConnection({
  host: config.DB_CREDENTIALS.HOST,
  user: config.DB_CREDENTIALS.USER,
  password: config.DB_CREDENTIALS.PASSWORD,
  database: config.DB_CREDENTIALS.DATABASE
});

initConnection = async () => {
  con.connect();
};

addtoDatabase = async (prices) => {
  await initConnection();
  prices.push(prices[0]);
  var sql = `INSERT INTO goldprices.lbma_gold 
      SELECT ? as 'Date', ? as 'USD(AM)', ? as 'USD(PM)', 
      ? as 'GBP(AM)', ? as 'GBP(PM)', ? as 'EURO(AM)', 
      ? as 'EURO(PM)'
      WHERE NOT EXISTS (SELECT * FROM goldprices.lbma_gold WHERE Date=?)`;
  sql = mysql.format(sql, prices);
  
  con.query(sql, prices, function(err, results) {
    // Neat!
    if (err) throw err;
    if(results.affectedRows)
      console.log("Data updated in DB for " + prices);
      
  });
  
  con.end(function(err) {
    // The connection is terminated now
  });
};

module.exports = {
    addtoDatabase,
    initConnection
};