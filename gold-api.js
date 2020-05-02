var HTMLParser = require('node-html-parser');
const puppeteer = require('puppeteer');

const getHTML = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
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
    //res.json(localPrices);
  });
  return localPrices;
};

module.exports = {
  goldprice
};
