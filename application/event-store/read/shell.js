const {unmarshalStream, marshalRead} = require("./core");
const {dynamoClient} = require("../aws-clients");

module.exports.read = async(aggregateId) => {
  const payload = marshalRead(aggregateId)
  const stream = await dynamoClient.query(payload).promise()

  const {events, expectedVersion} = unmarshalStream(stream)

  return {
    events, expectedVersion
  }
}