const fs = require('fs')
const through = require('through2')
const parseOSM = require('osm-pbf-parser')
const {encode} = require('georender-pack')
// const lpb = require('length-prefixed-buffers')
 
const osm = parseOSM()
const allItems = {}
const itemsRefsObject = {}

let currentType = undefined

const source = process.argv[2]
const target = process.argv[3]
  ? fs.createWriteStream(process.argv[3])
  : process.stdout

const refsForWay = (item) => {
  item.refs.forEach(function (ref) {
    if (!itemsRefsObject[ref]) {
      itemsRefsObject[ref] = allItems[ref]
    }
  })
}

const membersForRelation = (item) => {
  item.members.forEach(function (member) {
    if (member.id &&
        member.type === 'way' &&
        !itemsRefsObject[member.id] &&
        allItems[member.id]) {
      itemsRefsObject[member.id] = allItems[member.id]
      refsForWay(allItems[member.id])
    }
  })
}

fs.createReadStream(source)
  .pipe(osm)
  .pipe(through.obj(accumulate, pack))
  .pipe(target)

function accumulate (items, enc, next) {
  items.forEach(async function (item) {
    if (item.type === 'node') {
      allItems[item.id] = item
    }
    else if (item.type === 'way') {
      allItems[item.id] = item
      refsForWay(item)
    }
    else if (item.type === 'relation') {
      allItems[item.id] = item
      membersForRelation(item)
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
