const fsp = require('fs/promises')
const path = require('path')
const glob = require('glob')
const Hyperdrive = require('hyperdrive')

const source = process.argv[2]
const target = process.argv[3]
const key = process.argv[4]
  ? Buffer.from(process.argv[4], 'hex')
  : null

;(async () => {
  const files = await allFiles(source)
  const drive = new Hyperdrive(target, key)
  await drive.promises.ready()
  for (const file of files) {
    const absFile = path.join(source, file)
    try {
      const contents = await fsp.readFile(absFile)
      await drive.promises.writeFile(file, contents)
    }
    catch (error) {
      console.log(error)
    }
  }
  console.log(`hyper://${drive.key.toString('hex')}`)
})()

function allFiles (dir) {
  const options = {
    cwd: dir,
    nodir: true,
  }
  return new Promise((resolve, reject) => {
    glob('**/*', options, (error, files) => {
      if (error) return reject(error)
      resolve(files)
    })
  })  
}
