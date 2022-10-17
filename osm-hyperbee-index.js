const Hyperbee = require('hyperbee')
const hypercore = require('hypercore')
const fs = require('fs')
const through = require('through2')
const parseOSM = require('osm-pbf-parser')

const osm = parseOSM()
const osmId = (id) => {
  return `osm!${id}`
}

const source = process.argv[2]
const target = process.argv[3]

const db = new Hyperbee(hypercore(target), {
  keyEncoding: 'utf-8',
  valueEncoding: 'binary',
})

fs.createReadStream(source)
  .pipe(osm)
  .pipe(through.obj(features, report))
  .on('finish', process.exit)
  .on('end', process.exit)

function features (items, enc, next) {
  const putters = items.map((item) => {
    return new Promise((resolve, reject) => {
      db.put(osmId(item.id), JSON.stringify(item))
        .then(() => resolve())
        .catch((error) => reject(error))
    })
  })
  Promise.all(putters)
    .then(() => {
      console.log('next')
      next()
    })
    .catch((error) => {
      console.log(error)
      next()
    })
}

function report (next) {
  console.log('done')
  next()
}
