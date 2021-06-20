const unmarshalHttpRequestBody = cmd => JSON.parse(cmd.body)

const marshalQuery = (projectionTableName, walletId) => ({
  TableName: projectionTableName,
  ConsistentRead: true,
  KeyConditionExpression: 'lookupKey = :lookupKey',
  ExpressionAttributeValues: {
    ':lookupKey': walletId
  },
  ScanIndexForward: true
})
const unmarshalQuery = ({ Items }) => JSON.parse(Items[0].state)
const marshalHttpResponse = unmarshalledState => ({
  statusCode: 200,
  headers: {},
  body: JSON.stringify(unmarshalledState)
})

module.exports = {
  unmarshalHttpRequestBody,
  marshalQuery,
  unmarshalQuery,
  marshalHttpResponse
}