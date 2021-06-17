const {pipe} = require("../auxiliary");
const {buildReducer} = require("../auxiliary");
const {Algebra} = require("../auxiliary");

const calculateBalances = buildReducer([], {
  'Opened': (wallets, event) => [
    ...wallets, {
      id: event.aggregateId,
      currency: event.payload.currency,
      playerId: event.payload.playerId,
      balance: 0
    }
  ],
  'Reconciled': (wallets, event) => {
    const wallet = wallets.find(w => w.id === event.aggregateId)

    if (!wallet) {
      return [
        ...wallets,
        {
          id: event.aggregateId,
          currency: event.payload.currency,
          playerId: event.payload.playerId,
          balance: event.payload.balance
        }
      ]
    }

    return wallets
  },

  'Credited': (wallets, event) => {
    const wallet = wallets.find(w => w.id === event.aggregateId)

    return [
      ...wallets.filter(w => w.id !== event.aggregateId),
      {
        ...wallet,
        balance: Algebra(wallet.balance).add(event.payload.amount).value
      }
    ]
  },
  'Debited': (wallets, event) => {
    const wallet = wallets.find(w => w.id === event.aggregateId)

    return [
      ...wallets.filter(w => w.id !== event.aggregateId),
      {
        ...wallet,
        balance: Algebra(wallet.balance).subtract(event.payload.amount).value
      }
    ]
  }
})

const filterOnlyCad = wallets => wallets.filter(({ currency }) => currency === 'CAD')
const sortByBalance = wallets => wallets.sort((a, b) => b.balance - a.balance)
const pluckFirst = wallets => wallets[0]

module.exports.TopCadWalletProjection = {
  build: events => pipe(
    calculateBalances,
    filterOnlyCad,
    sortByBalance,
    pluckFirst
  )(events)
}