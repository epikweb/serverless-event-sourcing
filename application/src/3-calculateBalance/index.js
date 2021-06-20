const AWS = require('aws-sdk')
const {unmarshalEvents, unmarshalPrevState, computeNextState, marshalStateMutationQuery, marshalCurrentStateQuery} = require("./core");

const log = (...args) => console.log(`[calculateBalance]:`, ...args)
module.exports.calculateBalance = async(cmd, context, { client=new AWS.DynamoDB.DocumentClient(), projectionTableName = process.env.PROJECTION_TABLE_NAME }) => {
  const { walletId, events } = await unmarshalEvents(cmd)
  log(`Received events for wallet id`, walletId, events)

  const marshalledStateQuery = marshalCurrentStateQuery(projectionTableName, walletId)
  log(`Marshalled state query:`, marshalledStateQuery)

  const queryResponse = await client.query(marshalledStateQuery).promise()
  log(`Query response:`, queryResponse)

  const prevState = unmarshalPrevState(queryResponse)
  log(`Prev state:`, prevState)

  const nextState = computeNextState(prevState, events)
  log(`Mutating state to:`, nextState)

  const stateMutationQuery = marshalStateMutationQuery(projectionTableName, walletId, nextState)
  log(`State mutation query:`, stateMutationQuery)

  await client.put(stateMutationQuery).promise()
}