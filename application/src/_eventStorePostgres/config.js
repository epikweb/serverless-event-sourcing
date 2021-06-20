require('dotenv').config()
module.exports = {
  pgConnectionString: process.env.DATABASE_URL
}