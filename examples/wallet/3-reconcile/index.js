const {buildReducer} = require("../auxiliary");
const {Algebra} = require("../auxiliary");
const {reconcileAggregate} = require("../../../src/reconcileAggregate");

const reduce = buildReducer({}, {
  'Opened': (state, event) => ({ ...state, balance: 0, currency: event.payload.currency, playerId: event.payload.playerId }),
  'Reconciled': (state, event) => ({ ...state, balance: state.balance, currency: event.payload.currency, playerId: event.payload.playerId }),
  'Debited': (state, event) => ({ ...state, balance: Algebra(state.balance).subtract(event.payload.amount).value }),
  'Credited': (state, event) => ({...state, balance: Algebra(state.balance).add(event.payload.amount).value })
})

module.exports.reconcileWallet = ({ walletId }) => reconcileAggregate({ aggregateId: walletId, getState: reduce })