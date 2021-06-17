const {appendToStream} = require("../../../src/appendToStream");
const Event = {
  Opened: 'Opened'
}

module.exports.openWallet = async({ walletId, playerId, currency }) =>
  appendToStream({
    aggregateName: 'wallet',
    aggregateId: walletId,
    streamId: walletId,
    expectedVersion: 0,
    events: [
      {
        type: Event.Opened,
        payload: {
          walletId,
          playerId,
          currency
        }
      }
    ]
  })