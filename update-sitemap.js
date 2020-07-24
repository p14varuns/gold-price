var cron = require('node-cron');
const config = require("./config");
const SitemapGenerator = require('sitemap-generator');
 
var filepath = config.PROD? '/var/www/goldometer.org/public_html/sitemap.xml': './sitemap.xml';
console.log(filepath);

// create generator
const generator = SitemapGenerator('https://goldometer.org', {
  filepath: filepath,
  stripQuerystring: true,
  lastMod: true
});


// register event listeners
generator.on('done', () => {
  // sitemaps created
  const sitemap = generator.getSitemap();
  console.log("Done");
  
});
 

cron.schedule('0 1 * * *', () => {
  console.log("Running Sitemap Cron");
  // start the crawler
  generator.start();
},{
timezone: "America/New_York"
});