const Maybe = value => ({
  exists: typeof value !== 'undefined' && value !== null,
  value,
  chain: cb => cb(Maybe(value)),
  map: cb => cb(value)
})
Maybe.Just = value => Maybe(value)
Maybe.Nothing = Maybe(null)

const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

const benchmark = name => async fn => {
  const start = Date.now()
  const result = await fn()
  console.log(`[wallet#${name}]: +${Date.now() - start}ms`)

  return result
}

const safeAlgebra = (number) => +(Math.round(number + "e+" + 4)  + "e-" + 4);
const Algebra = left => ({
  add: (right) => Algebra(safeAlgebra(left + right)),
  subtract: (right) => Algebra(safeAlgebra(left - right)),
  multiply: (right) => Algebra(safeAlgebra(left * right)),
  divide: (right) => Algebra(safeAlgebra(left / right)),
  value: left
});

const buildReducer = (initialState, handlers) => events => events.reduce((state, event) => {
  if (handlers[event.type]) {
    return handlers[event.type](state, event)
  }
  return state
}, initialState)

module.exports = { benchmark, Algebra, pipe, buildReducer }