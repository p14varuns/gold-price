const HTMLParser = require('node-html-parser');
const puppeteer = require('puppeteer'); 
const config = require('./config');
const fetchJson = require('fetch-json');
const moment = require('moment-timezone');
moment.tz.setDefault("Europe/London");

// Fetches HTML from gold.org
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

// Processes data from gold.org
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

// Uses Quandl LBMA prices
var eodPrice = async (date) => {
  const url = 'https://www.quandl.com/api/v3/datasets/LBMA/GOLD';
  const params = { 
    end_date: date.format("YYYY-MM-DD"),
    start_date: date.format("YYYY-MM-DD"),
    api_key: config.API_KEY 
  };
  
  await fetchJson.get(url, params).then((data) => {
    var prices = data.dataset.data[0];
    if(!prices){ // No data for this date
      eodPrices = null;
    } else {
      eodPrices = {
        "date": prices[0],
        "USD": prices[2],
        "GBP": prices[4],
        "EUR": prices[6]
      };      
    }
  });
  return eodPrices;
};

// Uses Quandl LBMA prices
var eodPriceAsOf = async (date) => {
  var prices = null;
  while(1){  
    prices = await eodPrice(date);
    if(!prices){
      date = date.subtract(1,'days');
    }else{
      return [prices, date];
    }
  };
};

var getPriceData = async (date) => {
  // Call Gold Price
  const [lastPrices, lastDate] = await eodPriceAsOf(date);
  const [prevPrices, prevDate] = await eodPriceAsOf(lastDate.subtract(1,'days'));
  
  // Calculate change and return val
  var prices = {};
  currs = Object.keys(lastPrices);
  for(curr of currs){
    if(curr != 'date'){
      prices[curr] = {
        "price": lastPrices[curr],
        "change%": (100 * ( lastPrices[curr]/prevPrices[curr] - 1)).toFixed(2)
      }
    }
  };

  prices['lastDate'] = lastPrices.date;
  return prices;
};

module.exports = {
  getPriceData
};
