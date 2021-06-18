const {Maybe} = require("../auxiliary");
const tableName = process.env.DYNAMODB_TABLE_NAME

const marshalCreateTableRequest = () => ({
  TableName: tableName,
  AttributeDefinitions: [
    {AttributeName: 'aggregateId', AttributeType: 'S'},
    {AttributeName: 'version', AttributeType: 'N'}
  ],
  KeySchema: [
    {AttributeName: 'aggregateId', KeyType: 'HASH'},
    {AttributeName: 'version', KeyType: 'RANGE'}
  ],
  BillingMode: 'PAY_PER_REQUEST',
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: 'NEW_IMAGE',
  }
})

const checkTableExists = ({ TableNames }) => Maybe(TableNames.find(TableName => tableName === TableName))
const checkTableIsReadyForWrites = ({ TableStatus }) => TableStatus === 'Writable'

module.exports = {
  checkTableExists,
  marshalCreateTableRequest,
  checkTableIsReadyForWrites
}