const {spawn} = require('child_process')
const pump = require('pump')

module.exports = function georenderToEryos ({ georenderFilePath, eyrosDir, format }) {
  const cat = spawn('cat', [georenderFilePath])
  const georenderEyros = spawn('npx', [
    'georender-eyros',
    '--datadir',
    eyrosDir,
    '--format',
    format
  ])

  return new Promise((resolve, reject) => {
    pump(cat.stdout, georenderEyros.stdin, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}