const {calculateBalances, filterOnlyCad, pluckFirst, sortByBalance} = require("./logic");
const {benchmark} = require("../auxiliary");
const {readAllEvents} = require("../../../src/readAllEvents");



module.exports.topCadWallet = {
  find: () => benchmark('findTopCadWallet')(() =>
    readAllEvents.havingAggregateName('wallet')
      .then(calculateBalances)
      .then(filterOnlyCad)
      .then(sortByBalance)
      .then(pluckFirst)
  ).then(
    state =>
      console.dir(state, { depth: null })
  ),
  subscribe: () => {

  }
}