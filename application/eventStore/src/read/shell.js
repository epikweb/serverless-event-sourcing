const {unmarshalStream} = require("./core");
const {marshalRead} = require("./core");
module.exports = ({ client, tableName }) => async(aggregateId) => {
  const payload = marshalRead(aggregateId, tableName)
  const stream = await client.query(payload).promise()

  const {events, expectedVersion} = unmarshalStream(stream)

  return {
    events, expectedVersion
  }
}