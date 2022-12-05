const fs = require('fs')
const through = require('through2')
const parseOSM = require('osm-pbf-parser')
const {Level} = require('level')

const osm = parseOSM()

const source = process.argv[2]
const dbFileName = process.argv[3]

const db = new Level(dbFileName, { valueEncoding: 'json' })

fs.createReadStream(source)
  .pipe(osm)
  .pipe(through.obj(writeLevel))

function writeLevel (items, enc, next) {
  const puts = []
  items.forEach((item) => {
    puts.push({
      type: 'put',
      key: item.id,
      value: item,
    })
  })
  db.batch(puts, next)
}
