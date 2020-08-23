const mysql = require('mysql');
const config = require('./config');

getConnection = (db=config.DB_CREDENTIALS.DATABASE) => {
  return mysql.createConnection({
    host: config.DB_CREDENTIALS.HOST,
    user: config.DB_CREDENTIALS.USER,
    password: config.DB_CREDENTIALS.PASSWORD,
    database: db
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
        if(returns[timeframe[i]])
          returns[timeframe[i]] = {
            "Amount": results[i]["Amount"],
            "%Return": results[i]["%Return"]
          }
      };
    }
    callback(returns);
  });
};


latestPosts = async(callback) => {
  var con = getConnection(config.WP_DATABASE);
  var sql =
  `SELECT A.*, C.meta_value as "img_link", D.meta_value as "alt-text"
  FROM (SELECT wpp.id, wpp.post_title, DATE_FORMAT(wpp.post_date, '%Y-%m-%d') as "post_date",
  REPLACE( REPLACE( wpo.option_value, '%post_id%', wpp.ID ), '%postname%', wpp.post_name ) AS permalink
  FROM wp_posts wpp
  JOIN wp_options wpo
  ON wpo.option_name = 'permalink_structure'
  WHERE wpp.post_type = 'post'
  AND wpp.post_status = 'publish')A 
  LEFT JOIN (SELECT * FROM wp_postmeta WHERE meta_key='_thumbnail_id') B ON A.id = B.post_id
  LEFT JOIN (SELECT post_id, meta_value FROM wp_postmeta where meta_key='_wp_attached_file')C ON B.meta_value=C.post_id
  LEFT JOIN (SELECT post_id, meta_value FROM wp_postmeta where meta_key='_wp_attachment_image_alt')D ON B.meta_value=D.post_id
  ORDER BY post_date DESC
  LIMIT 3`;

  con.query(sql, function (err, results) {
    if (err)
      throw err;
    con.destroy();
    console.log("Latest Posts - ");
    console.log(results);
    callback(results);
  });
};

getHistPrices = async(callback) => {
  var con = getConnection();
  var sql =
  `SELECT StartDate, \`USD(AM)\` as Price
  FROM goldprices.lbma_gold
  ORDER BY StartDate DESC
  LIMIT 30`;

  con.query(sql, function(err, results){
    if(err)
      throw err;
    con.destroy();
    data = [];
    for(i = 0; i < results.length; i++)
      data[i] = [results[i].StartDate, results[i].Price];
    callback(data);
  })
};

module.exports = {
    addtoDatabase,
    getReturnsAsOf,
    latestPosts,
    getHistPrices
};