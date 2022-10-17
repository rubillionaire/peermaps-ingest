const fs = require('fs')
const through = require('through2')
const parseOSM = require('osm-pbf-parser')
const {encode} = require('georender-pack')
// const lpb = require('length-prefixed-buffers')
 
const osm = parseOSM()
const allItems = {}
const itemsRefsObject = {}

const source = process.argv[2]
const target = process.argv[3]
  ? fs.createWriteStream(process.argv[3])
  : process.stdout

fs.createReadStream(source)
  .pipe(osm)
  .pipe(through.obj(accumulate, pack))
  .pipe(target)

function accumulate (items, enc, next) {
  items.forEach(function (item) {
    if (item.type === 'node') {
      allItems[item.id] = item
    }
    else if (item.type === 'way') {
      allItems[item.id] = item
      item.refs.forEach(function (ref) {
        if (!itemsRefsObject[ref]) itemsRefsObject[ref] = allItems[ref]
        else return
      })
    }
  })
  next()
}
function pack (next) {
  Object.values(allItems)
    .map((item) => {
      this.push(
        (encode(item, itemsRefsObject)).toString('base64') + '\n'
        // lpb.from(encode(item, itemsRefsObject))
      )
    })
  next()
}
