const {dynamoClient} = require("../aws-clients");
const {marshalDeletes, marshalScan} = require('./core')

module.exports.truncateAllTables = () =>
  dynamoClient.scan(marshalScan()).promise()
    .then(
      marshalDeletes
    )
    .then(
      cmds => Promise.all(
        cmds.map(input => dynamoClient.delete(input).promise())
      )
    )