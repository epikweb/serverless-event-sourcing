require('dotenv').config()
const { Client } = require('pg')
const {
  user,
  password,
  host,
  port,
  database
} = require('pg-connection-string').parse(process.env.DATABASE_URL)

const client = new Client({
  user,
  password,
  host,
  port,
  database: 'postgres'
});


(async () => {
  await client.connect()
  await client.query(`drop database ${database};`)
    .catch(err => {
      console.error(`Unable to drop db, does it exist?`, err)
    })
  await client.end()
  console.log(`Database ${database} dropped`)
})()