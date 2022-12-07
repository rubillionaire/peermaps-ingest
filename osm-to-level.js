const fs = require('fs')
const pump = require('pump')
const through = require('through2')
const parseOSM = require('osm-pbf-parser')
const osmItemKey = require('./level-osm-item-key')

// { osmFilePath : string, leveldb : level } => undefined
// write OSM items in the input PBF file into a leveldb so
// we can seek for dependencies as we need to assemble our
// georender files.
module.exports = function osmToLevel ({ osmFilePath, leveldb }) {
  
  return new Promise((resolve, reject) => {
    pump(
      fs.createReadStream(osmFilePath),
      parseOSM(),
      through.obj(writeLevel),
      function (error) {
        if (error) return reject(error)
        else resolve()
      }
    )
  })

  function writeLevel (items, enc, next) {
    const puts = []
    items.forEach((item) => {
      puts.push({
        type: 'put',
        key: osmItemKey(item),
        value: item,
      })
    })
    leveldb.batch(puts, next)
  }
}
