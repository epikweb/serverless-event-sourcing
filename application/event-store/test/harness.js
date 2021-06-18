const {EventStore} = require("../src");
const AWS = require('aws-sdk')
const options = {
  region: 'dummy',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
  }
}

const client = new AWS.DynamoDB.DocumentClient(options)
const ddlClient = new AWS.DynamoDB(options)

const tableName = 'test_events'
const eventStore = EventStore({ tableName, client })

const createTestTableIfNotExists = async () => {
  const { TableNames } = await ddlClient.listTables({}).promise()

  const exists = TableNames.find(name => name === tableName)

  if (!exists) {
    await ddlClient.createTable({
      TableName: 'test_events',
      AttributeDefinitions: [
        {AttributeName: 'aggregateId', AttributeType: 'S'},
        {AttributeName: 'version', AttributeType: 'N'}
      ],
      KeySchema: [
        {AttributeName: 'aggregateId', KeyType: 'HASH'},
        {AttributeName: 'version', KeyType: 'RANGE'}
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }).promise()
  }
}

const truncateTable = async() => {
  const { Items } = await ddlClient.scan({
    TableName: tableName,
    AttributesToGet: ['aggregateId', 'version']
  }).promise()

  await Promise.all(
    Items.map(
      element => ddlClient.deleteItem({
        TableName: tableName,
        Key: element,
      }).promise()
    )
  )
}


module.exports = {
  eventStore,
  ddlClient,
  setup: () => createTestTableIfNotExists().then(truncateTable)
}