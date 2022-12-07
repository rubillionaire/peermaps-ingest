const fsp = require('fs/promises')
const path = require('path')
const glob = require('glob')
const Hyperdrive = require('hyperdrive')

// { eyrosDir : string, hyperdriveDir : string, key : Buffer|null, debug : boolean } => { drive : Hyperdrive }
// read all of the files off the of the file system and import
// them into a hyperdrive. 
module.exports = async function eyrosToHyperdrive ({ eyrosDir, hyperdriveDir, key=null, debug=false }) {
  const files = await allFiles(eyrosDir)
  const drive = new Hyperdrive(hyperdriveDir, key)
  await drive.promises.ready()
  for (const file of files) {
    const absFile = path.join(eyrosDir, file)
    try {
      const contents = await fsp.readFile(absFile)
      await drive.promises.writeFile(file, contents)
    }
    catch (error) {
      if (debug) console.log(error)
    }
  }
  return { drive }
  
}

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
