const {benchmark} = require("../auxiliary");
const {readAllEvents} = require("../../../src/readAllEvents");


const findOpened = events => events.reduce(
  (wallets, event) => {
    switch (event.type) {
      case 'Opened':
        return [...wallets, { id: event.payload.walletId, currency: event.payload.currency, playerId: event.payload.playerId, balance: 0 }]
    }
    return wallets
  }
  , [])

module.exports.openWallets = {
  find: () => benchmark('findTopCadWallet')(() =>
    readAllEvents.havingAggregateName('wallet')
      .then(findOpened)
  ),
  subscribe: () => {

  }
}