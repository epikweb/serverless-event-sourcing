const {buildReducer} = require("../auxiliary");
const {pipe} = require("../auxiliary");
const {Algebra} = require("../auxiliary");

const eurForexRates = {
  CAD: 0.5,
  USD: 0.75,
  EUR: 1
}

const forexToEur = (currency, amount) => Algebra(amount).multiply(eurForexRates[currency]).value
const forexWalletsToEur = wallets => wallets.map(({ balance, currency, ...other }) => ({ ...other, eurBalance: forexToEur(currency, balance), homeBalance: { balance, currency } }))
const pluckTop3 = wallets => wallets.sort((a, b) => b.eurBalance - a.eurBalance).slice(0, 3)

const calculateBalances = buildReducer([], {
  'Opened': (wallets, event) => [
    ...wallets, {
      id: event.aggregateId,
      currency: event.payload.currency,
      playerId: event.payload.playerId,
      balance: 0,
      numberOfTransactions: 0
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
          balance: event.payload.balance,
          numberOfTransactions: 0
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
        balance: Algebra(wallet.balance).add(event.payload.amount).value,
        numberOfTransactions: wallet.numberOfTransactions + 1
      }
    ]
  },
  'Debited': (wallets, event) => {
    const wallet = wallets.find(w => w.id === event.aggregateId)

    return [
      ...wallets.filter(w => w.id !== event.aggregateId),
      {
        ...wallet,
        balance: Algebra(wallet.balance).subtract(event.payload.amount).value,
        numberOfTransactions: wallet.numberOfTransactions + 1
      }
    ]
  }
})


module.exports.Top3WalletsInEurosProjection = {
  build: events => pipe(
    calculateBalances,
    forexWalletsToEur,
    pluckTop3
  )(events)
}