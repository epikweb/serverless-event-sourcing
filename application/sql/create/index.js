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
  await client.query(`create database ${database};`)
    .catch(err => {
      console.error(`Unable to create db, does it already exist?`, err)
    })

  const dbClient = new Client({
    user,
    password,
    host,
    port,
    database
  });

  await dbClient.connect()
  await dbClient.query(`
      create table _migrations
      (
          name    varchar(255)    not null,
          ran_at      timestamptz  not null
      );
  `)
  await dbClient.end()
  await client.end()
  console.log(`Database ${database} created`)
})()