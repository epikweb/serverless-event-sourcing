const {runCommand} = require("../../harness");

module.exports.destroy = async gitSha => {
  console.log(`Preparing to destroy version with git sha: ${gitSha}`)

  await runCommand('cdk', ['destroy', '-f'], {
    GIT_SHA: gitSha
  })
}