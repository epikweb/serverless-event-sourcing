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
const streamClient = new AWS.DynamoDBStreams(options)
const ddlClient = new AWS.DynamoDB(options)


const arrangeEventTable = async eventTableName => {
  await ddlClient.createTable({
    TableName: eventTableName,
    AttributeDefinitions: [
      {AttributeName: 'aggregateId', AttributeType: 'S'},
      {AttributeName: 'aggregateName', AttributeType: 'S'},
      {AttributeName: 'version', AttributeType: 'N'}
    ],
    KeySchema: [
      {AttributeName: 'aggregateId', KeyType: 'HASH'},
      {AttributeName: 'version', KeyType: 'RANGE'}
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'AggregateName',
        KeySchema: [
          {AttributeName: 'aggregateName', KeyType: 'HASH'},
          {AttributeName: 'aggregateId', KeyType: 'RANGE'}
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    StreamSpecification: {
      StreamEnabled: true,
      StreamViewType: 'NEW_AND_OLD_IMAGES'
    }
  }).promise()
}

const arrangeProjectionTable = async projectionTableName => {
  await ddlClient.createTable({
    TableName: projectionTableName,
    AttributeDefinitions: [
      {AttributeName: 'lookupKey', AttributeType: 'S'}
    ],
    KeySchema: [
      {AttributeName: 'lookupKey', KeyType: 'HASH'}
    ],
    BillingMode: 'PAY_PER_REQUEST'
  }).promise()
}


module.exports = {
  arrangeEventTable,
  arrangeProjectionTable,
  client,
  streamClient
}