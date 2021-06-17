const {appendToStream} = require("../../../src/appendToStream");
const {readLatestStreamForwards} = require("../../../src/readLatestStreamForwards");
const safeAlgebra = (number) => +(Math.round(number + "e+" + 4)  + "e-" + 4);
const Algebra = left => ({
  add: (right) => Algebra(safeAlgebra(left + right)),
  subtract: (right) => Algebra(safeAlgebra(left - right)),
  multiply: (right) => Algebra(safeAlgebra(left * right)),
  divide: (right) => Algebra(safeAlgebra(left / right)),
  value: left
});


module.exports.creditMoney = ({ walletId, amount }) =>
  readLatestStreamForwards(walletId)
    .then(
      ({ streamId, expectedVersion }) =>
        appendToStream({
          aggregateName: 'wallet',
          aggregateId: walletId,
          streamId,
          expectedVersion,
          events: [
            {
              type: 'Credited',
              payload: {
                amount
              }
            }
          ]
        })
    )