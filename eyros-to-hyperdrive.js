const Corestore = require('corestore')
const Hyperdrive = require('hyperdrive')
const Localdrive = require('localdrive')
const MirrorDrive = require('mirror-drive')

// { eyrosDir : string, hyperdriveDir : string, key : Buffer|null, debug : boolean } => { drive : Hyperdrive }
// read all of the files off the of the file system and import
// them into a hyperdrive. 
module.exports = async function eyrosToHyperdrive ({ eyrosDir, hyperdriveDir, key=null, debug=false }) {
  const src = new Localdrive(eyrosDir)
  // const files = await allFiles(eyrosDir)
  const store = new Corestore(hyperdriveDir)
  await store.ready()
  const dst = new Hyperdrive(store, key)
  await dst.ready()
  const mirror = new MirrorDrive(src, dst)
  await mirror.done()
  return { drive: dst }
}
