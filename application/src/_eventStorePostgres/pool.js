require('dotenv').config()

const config = require("./config");
const { Pool } = require('pg')

const d = new Pool({
  connectionString: config.pgConnectionString
})
module.exports = { pool }