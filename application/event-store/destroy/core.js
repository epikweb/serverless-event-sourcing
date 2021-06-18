const {eventTableName} = require("../config");
const marshalScan = () => ({
  TableName: eventTableName,
  AttributesToGet: ['aggregateId', 'version']
})
const marshalDeletes = ({ Items }) =>
  Items.map(
    element => ({
      TableName: eventTableName,
      Key: element,
    })
  )

module.exports = { marshalScan, marshalDeletes }