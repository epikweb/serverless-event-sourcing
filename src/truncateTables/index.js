const {infrastructureConfig} = require("../../infrastructure/config");
const {dynamoClient} = require("../aws-clients");

const truncate = ({ TableName, KeySchema }) =>
  dynamoClient.scan({
    TableName,
    AttributesToGet: KeySchema.map(({ AttributeName }) => AttributeName)
  }).promise()
    .then(
      ({ Items }) => {
        console.log(`Deleting ${Items.length} records for table: ${TableName}`);

        return Promise.all(
          Items.map(
            element => dynamoClient.delete({
              TableName,
              Key: element,
            }).promise()
          )
        )
      }
    )

module.exports.truncateAllTables = () =>
  Promise.all(infrastructureConfig.dynamoTables.map(truncate))