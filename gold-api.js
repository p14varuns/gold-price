const config = require('./config');
const fetchJson = require('fetch-json');
const moment = require('moment-timezone');
moment.tz.setDefault("Europe/London");

// Uses Quandl LBMA prices
var eodPrice = async (date) => {
  const url = 'https://www.quandl.com/api/v3/datasets/LBMA/GOLD';
  const params = { 
    end_date: date.format("YYYY-MM-DD"),
    start_date: date.format("YYYY-MM-DD"),
    api_key: config.API_KEY 
  };
  
  var prices = null;
  // Split this function to return prices variable only
  await fetchJson.get(url, params).then((data) => {
    if(data.dataset.data[0])
      prices = data.dataset.data[0];
  });
  return prices;
};

// Uses Quandl LBMA prices
var eodPriceAsOf = async (date) => {
  var eodPrices = null;
  while(1){  
    var prices = await eodPrice(date);
    if(!prices){
      date = date.subtract(1,'days');
    }else{
      eodPrices = {
        "date": prices[0],
        "USD": prices[2],
        "GBP": prices[4],
        "EUR": prices[6]
      };     
      return [eodPrices, date];
    }
  };
};

var getFXRates = async (date) => {
  const url = 'https://api.exchangeratesapi.io/history';
  var dateString = date.format("YYYY-MM-DD");
  const params = { 
    end_at: dateString,
    start_at: dateString,
    base: "USD"
  };
  var fxRates = null;
  await fetchJson.get(url, params).then((data) => {
    fxRates = data["rates"][dateString];
  });
  return fxRates;
};

var getPriceData = async (date) => {
  // Call Gold Price
  const [lastPrices, lastDate] = await eodPriceAsOf(date);
  const lastFXRates = await getFXRates(lastDate);
  const [prevPrices, prevDate] = await eodPriceAsOf(lastDate.subtract(1,'days'));
  const prevFXRates = await getFXRates(prevDate);
  // Calculate change and return val
  var prices = {};
  currs = Object.keys(lastPrices);
  for(curr of currs){
    if(curr != 'date'){
      prices[curr] = {
        "price": lastPrices[curr].toFixed(2),
        "change%": (100 * ( lastPrices[curr]/prevPrices[curr] - 1)).toFixed(2)
      }
    }
  };

  var otherCurrs = ["AUD","CAD","CHF","JPY","ZAR","INR","CNY","HKD"];
  for(curr of otherCurrs){
    prices[curr] = {
      "price": (lastPrices["USD"] * lastFXRates[curr]).toFixed(2),
      "change%": (100*((lastFXRates[curr]*lastPrices["USD"])/(prevFXRates[curr]*prevPrices["USD"]) - 1)).toFixed(2),
    }
  }
  
  prices['lastDate'] = lastPrices.date;
  return prices;
};

module.exports = {
  getPriceData,
  eodPrice
};