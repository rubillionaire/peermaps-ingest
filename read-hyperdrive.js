const Hyperdrive = require('hyperdrive')

const source = process.argv[2]
const files = process.argv.slice(3)

;(async () => {
  const drive = new Hyperdrive(source, null)
  await drive.promises.ready()
  console.log(drive.key.toString('hex'))
  for (const file of files) {
    console.log(file)
    console.log(await drive.promises.stat(file))
  }
})()
