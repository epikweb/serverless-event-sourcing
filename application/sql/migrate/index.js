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
  database
})

const migrations = [
  '2021-06-20-2-initial-command',
  '2021-06-20-2-initial-query'
];

(async() => {
  await client.connect()
  await client.query(`begin transaction;`)

  const ranMigrations = await client.query(`select name from _migrations`).then(data => data.rows)


  for (let migration of migrations) {
    if (ranMigrations.includes(migration)) {
      continue;
    }

    const start = Date.now()
    await require('./' + migration).up(client)
    console.log(`${migration} => Migrated in ${Date.now() - start}ms`)

    await client.query(`insert into _migrations(name, ran_at) values($1, $2)`, [
      migration,
      new Date()
    ])
  }

  await client.query(`commit;`)
  console.log(`Database ${database} migrated`)

  await client.end()
})()