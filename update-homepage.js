const puppeteer = require('puppeteer');
const config = require("./config");
fs = require('fs');
var cron = require('node-cron');
require('log-timestamp');

const url = "https://www.goldometer.org/";
var filepath = config.PROD? '/var/www/goldometer.org/public_html/index.html': 'index.html';

async function run () {
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  console.log(1);
  await page.goto(url, {waitUntil: 'networkidle0'});
  console.log(2);
  const html = await page.content(); // serialized HTML of page DOM.
  console.log(3);
  await browser.close();
  fs.writeFile(filepath, html, function(err){
    if (err) return console.log(err);
    console.log("File Updated: " + filepath);
  });
  console.log(4);
};

run();

cron.schedule('5 * * * *', () => {
    console.log("Update Homepage HTML every hour");
    run();
},{
  timezone: "America/New_York"
});