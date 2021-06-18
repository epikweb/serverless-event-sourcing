const sut = require("./shell");
describe('Setup dynamodb', () => {
  it('should setup dynamodb if it does not exist', async() => {
    const response = await sut()
    console.log(response)
  })
})