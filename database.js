const mysql = require('mysql');
const config = require('./config');

getConnection = () => {
  return mysql.createConnection({
    host: config.DB_CREDENTIALS.HOST,
    user: config.DB_CREDENTIALS.USER,
    password: config.DB_CREDENTIALS.PASSWORD,
    database: config.DB_CREDENTIALS.DATABASE
  });
}


addtoDatabase = async (prices) => {
  var con = getConnection();
  var sql1 = 
      `UPDATE goldprices.lbma_gold 
      SET EndDate = ? 
      WHERE EndDate IS NULL and StartDate < ?;`;
  sql1 = mysql.format(sql1, [prices[0], prices[0]]);
  prices.push(prices[0]);
  var sql2 = 
      `INSERT INTO goldprices.lbma_gold 
      SELECT ? as 'StartDate', NULL as 'EndDate', ? as 'USD(AM)', ? as 'USD(PM)', 
      ? as 'GBP(AM)', ? as 'GBP(PM)', ? as 'EURO(AM)', 
      ? as 'EURO(PM)'
      WHERE NOT EXISTS (SELECT * FROM goldprices.lbma_gold WHERE StartDate=?)`;
  sql2 = mysql.format(sql2, prices);
  
  con.query(sql1, function(err, results) {
    if (err) throw err;
    if(results.affectedRows)
      console.log("Row End Date marked as NULL ");
      con.query(sql2, function (err, results) {
        if (err)
          throw err;
        if (results.affectedRows)
          console.log("Data updated in DB for " + prices);
        con.destroy();
      });
  });
};

module.exports = {
    addtoDatabase
};