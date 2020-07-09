const mysql = require('mysql');
const config = require('./config');

var con = mysql.createConnection({
  host: config.DB_CREDENTIALS.HOST,
  user: config.DB_CREDENTIALS.USER,
  password: config.DB_CREDENTIALS.PASSWORD,
  database: config.DB_CREDENTIALS.DATABASE
});

con.connect();

addtoDatabase = async (prices) => {
  var insertsql = 
      `UPDATE goldprices.lbma_gold 
      SET EndDate = ? 
      WHERE EndDate IS NULL and StartDate < ?`;
  insertsql = mysql.format(insertsql, [prices[0], prices[0]]);
  console.log(insertsql);
  
  await con.query(insertsql, function(err, results) {
    // Neat!
    if (err) throw err;
    if(results.affectedRows)
      console.log("Row End Date marked as NULL ");
  });
  
  prices.push(prices[0]);
  var sql = `INSERT INTO goldprices.lbma_gold 
      SELECT ? as 'StartDate', NULL as 'EndDate', ? as 'USD(AM)', ? as 'USD(PM)', 
      ? as 'GBP(AM)', ? as 'GBP(PM)', ? as 'EURO(AM)', 
      ? as 'EURO(PM)'
      WHERE NOT EXISTS (SELECT * FROM goldprices.lbma_gold WHERE StartDate=?)`;
  sql = mysql.format(sql, prices);
  console.log(sql);
  
  con.query(sql, function (err, results) {
    // Neat!
    if (err)
      throw err;
    if (results.affectedRows)
      console.log("Data updated in DB for " + prices);
  });
  
  /*con.end(function(err) {
    // The connection is terminated now
  });*/
};

module.exports = {
    addtoDatabase
};