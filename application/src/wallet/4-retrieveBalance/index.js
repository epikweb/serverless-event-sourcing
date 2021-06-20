const AWS = require('aws-sdk')
const {unmarshalHttpRequestBody, marshalQuery, unmarshalQuery, marshalHttpResponse} = require("./core");



const log = (...args) => console.log(`[retrieveBalance]:`, ...args)
module.exports.retrieveBalance = async(cmd, context, { client=new AWS.DynamoDB.DocumentClient(), projectionTableName = process.env.PROJECTION_TABLE_NAME }) => {
  log('Cmd received', cmd)

  const { walletId } = unmarshalHttpRequestBody(cmd)
  log(`Wallet ID:`, walletId)

  const query = marshalQuery(projectionTableName, walletId)
  log(`Marshalled query:`, query)

  const queryResponse = await client.query(query).promise()
  log(`Query response:`, queryResponse)

  const unmarshalledState = unmarshalQuery(queryResponse)
  log(`Unmarshalled state:`, unmarshalledState)

  const response = marshalHttpResponse(unmarshalledState)
  log(`Http response:`, response)

  return response
}