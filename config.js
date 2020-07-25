
const PROD = 0; // 0 for dev and 1 for prod
const API_KEY = "<QUANDL_API_KEY>";

const DB_CREDENTIALS = {
    HOST: "localhost",
    USER: "<USERNAME>",
    PASSWORD: "<PASSWORD>",
    DATABASE: "goldprices"
};

const WP_DATABASE = "goldometer_blog"; //WP Blog

module.exports = {
    PROD,
    API_KEY,
    DB_CREDENTIALS,
    WP_DATABASE
};