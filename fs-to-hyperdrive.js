const fs = require('fs')
const path = require('path')
const glob = require('glob')
const Hyperdrive = require('hyperdrive')

const source = process.argv[2]
const target = process.argv[3]

;(async () => {
  const files = await allFiles(source)
  const drive = Hyperdrive(target)
  await drive.promises.ready()
  const writers = files.map((file) => {
    const absFile = path.join(source, file)
    return new Promise ((resolve, reject) => {
      fs.readFile(absFile, (error, contents) => {
        if (error) return reject(error)
        drive.writeFile(`/${file}`, contents, (error) => {
          if (error) return reject(error)
          resolve()
        })
      })
    })
  })
  try {
    await Promise.all(writers)  
  } catch (error) {
    console.log(error)
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
