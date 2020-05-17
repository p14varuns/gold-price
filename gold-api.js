const HTMLParser = require('node-html-parser');
const puppeteer = require('puppeteer'); 
const config = require('./config');
const fetchJson = require('fetch-json');
const moment = require('moment-timezone');
moment.tz.setDefault("Europe/London");

const getHTML = async () => {
  console.log(config.PROD);
  let browser;
  if(config.PROD){
    browser = config.PROD ? await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox']
      }) : await puppeteer.launch();
  } else {
    browser = await puppeteer.launch();
  };
  
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (request) => {
      var allowedRequests = ['document', 'xhr', 'script'];
      if (allowedRequests.includes(request.resourceType())) {
          request.continue();
      } else {
          request.abort();
      }
  });

  await page.goto('https://www.gold.org/goldhub/data/gold-prices', {waitUntil: 'networkidle2'});
  const html = await page.content(); // serialized HTML
  await browser.close();
  return html;
};


var goldprice = async () => {

  var localPrices = {};
  // Fetch API results
  await getHTML().then(result => {
    var root = HTMLParser.parse(result);
    var table = root.querySelector(".table-spotprice");
    var tbody = table.querySelector("tbody");
    var trs = tbody.querySelectorAll("tr");

    for(tr of trs){
      curr = tr.querySelector("th").text;
      value = tr.querySelector("td").text;
      localPrices[curr] = value;
    }
    // London Time
    localPrices["timestamp"] = root.querySelector(".spotprice-update-time").text;

  });
  return localPrices;
};


var eodPrice = async (date) => {
  const url = 'https://www.quandl.com/api/v3/datasets/LBMA/GOLD';
  const params = { 
    end_date: date,
    start_date: date,
    api_key: config.API_KEY 
  };
  const handleData = (data) => {
    var prices = data.dataset.data[0];
    var eodPrices = {
      "USD": prices[2],
      "GBP": prices[4],
      "EUR": prices[6]
    };
    console.log(eodPrices);
    
    return eodPrices;
  }
  
  fetchJson.get(url, params).then(handleData);
};


var getChange = async () => {
  // Call Gold Price

  // Find eod Price for prev day if reqd, else memorize 
  localLondonTime = moment();
  if(localLondonTime.day() == 0){
    prevDate = localLondonTime.subtract(2,'days');
  } else {
    prevDate = localLondonTime.subtract(1,'days');
  };
  console.log(prevDate.format('YYYY-MM-DD'));

  // Calculate change and return val
}

eodPrice("2020-05-15");

module.exports = {
  goldprice,
  eodPrice
};
