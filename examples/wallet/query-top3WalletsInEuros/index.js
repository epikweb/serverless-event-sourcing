const {Top3WalletsInEurosProjection} = require("./logic");
const {benchmark} = require("../auxiliary");
const {readAllEvents} = require("../../../src/readAllEvents");


module.exports.top3WalletsInEuros = {
  find: () =>
    benchmark('top3WalletsInEuros')(() =>
      readAllEvents.havingAggregateName('wallet')
        .then(Top3WalletsInEurosProjection.build)
    )
}