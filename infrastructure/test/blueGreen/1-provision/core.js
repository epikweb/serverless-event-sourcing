module.exports.locateDynamoEventTable = gitSha => ({ TableNames }) => {
  return TableNames.find(name => name.includes(gitSha))
}
module.exports.locateApiGatewayRestApi = gitSha => ({ items }) => {
  const match = items.find(({ tags }) => tags['aws:cloudformation:stack-name'] === gitSha)

  return `https://${match.id}.execute-api.us-east-2.amazonaws.com/prod`
}
module.exports.locateKinesisEventBus = gitSha => ({ StreamNames }) => {
  return StreamNames.find(name => name.includes(gitSha))
}
module.exports.parseKinesisEventBusArn = data => {
  return data.StreamDescription.StreamARN
}
module.exports.checkIfDynamoTableNeedsKinesisIntegration = data => data.KinesisDataStreamDestinations.length === 0