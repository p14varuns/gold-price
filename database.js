const mysql = require('mysql');
const config = require('./config');

getConnection = () => {
  return mysql.createConnection({
    host: config.DB_CREDENTIALS.HOST,
    user: config.DB_CREDENTIALS.USER,
    password: config.DB_CREDENTIALS.PASSWORD,
    database: config.DB_CREDENTIALS.DATABASE
  });
};

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

getReturnsAsOf = async (date, callback) => {
  var con = getConnection();
  var sql = 
  `SELECT A.StartDate, B.StartDate as "PastDate", ROUND(A.\`USD(PM)\` - B.\`USD(PM)\`,2) as "Amount",
  100*ROUND(A.\`USD(PM)\` / B.\`USD(PM)\` - 1,4) as "%Return"
  FROM (SELECT * from lbma_gold where EndDate IS NULL) A
  CROSS JOIN (Select * from lbma_gold where 
  StartDate <= DATE_SUB( TODAY_DATE, INTERVAL 30 DAY) AND DATE_SUB(TODAY_DATE, INTERVAL 30 DAY) < EndDate
  OR StartDate <= DATE_SUB(TODAY_DATE, INTERVAL 6 MONTH) AND DATE_SUB(TODAY_DATE, INTERVAL 6 MONTH) < EndDate
  OR StartDate <= DATE_SUB(TODAY_DATE, INTERVAL 1 YEAR) AND DATE_SUB(TODAY_DATE, INTERVAL 1 YEAR) < EndDate
  OR StartDate <= DATE_SUB(TODAY_DATE, INTERVAL 5 YEAR) AND DATE_SUB(TODAY_DATE, INTERVAL 5 YEAR) < EndDate
  OR StartDate <= DATE_SUB(TODAY_DATE, INTERVAL 20 YEAR) AND DATE_SUB(TODAY_DATE, INTERVAL 20 YEAR) < EndDate) B
  ORDER BY B.StartDate DESC`;

  sql = sql.replace(/TODAY_DATE/g, "'" + date.format("YYYY-MM-DD") + "'");

  con.query(sql, function (err, results) {
    if (err)
      throw err;
    con.destroy();
    var returns = {};
    if(results){
      timeframe = ["30 Days", "6 Months", "1 Year", "5 Years", "20 Years"];
      for(i = 0; i < timeframe.length; i++){
        returns[timeframe[i]] = {
          "Amount": results[i]["Amount"],
          "%Return": results[i]["%Return"]    
        }
      };
    }
    callback(returns);
  });
};

module.exports = {
    addtoDatabase,
    getReturnsAsOf
};