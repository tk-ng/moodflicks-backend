const { Client } = require("pg");
const { getDatabaseUrl } = require("./config");

const DB_URI = getDatabaseUrl();

let db = new Client({ connectionString: DB_URI });
db.connect();

module.exports = db;
