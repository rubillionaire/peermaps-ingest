const Hyperdrive = require('hyperdrive')
const drive = Hyperdrive(
  'rhode-island.eyros.hyperdrive',
  'aaacbad57211d680f95bc217d32ff5c2b14f9195590d085eecd54f63a05d1f18'
)

;(async () => {
  await drive.promises.ready()
  drive.readFile('/meta', (error, contents) => {
    console.log(error)
    console.log(contents)
  })
})()
