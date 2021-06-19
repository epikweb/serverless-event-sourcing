describe('Blue green deployments', () => {
  it('should perform a zero downtime, blue green deployment', async() => {
    const response = await sut()
    console.log(response)
  })
})