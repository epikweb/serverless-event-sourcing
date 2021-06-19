const { spawn } = require('child_process')
const path = require('path')

module.exports.runCommand = (cmd, args, env) => {
  const ls = spawn(/^win/.test(process.platform) ? `${cmd}.cmd` : cmd, args, {
    env: {
      ...process.env,
      ...env
    },
    cwd: path.join(__dirname, '..')
  })


  return new Promise(
    (resolve, reject) => {
      ls.stdout.on('data', function (data) {
        console.log('stdout: ' + data.toString());
      });

      ls.stderr.on('data', function (data) {
        console.log('stderr: ' + data.toString());
      });

      ls.on('exit', function (code) {
        console.log('child process exited with code ' + code.toString())
        if (code === 0) {
          resolve()
        }
      });
    }
  )
}