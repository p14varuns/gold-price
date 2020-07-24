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
 
// start the crawler
generator.start();