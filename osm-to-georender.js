const fs = require('fs')
const through = require('through2')
const parseOSM = require('osm-pbf-parser')
const {encode} = require('georender-pack')
 
const osm = parseOSM()
const allItems = {}
const deps = {}

let currentType = undefined

const source = process.argv[2]
const target = process.argv[3]
  ? fs.createWriteStream(process.argv[3])
  : process.stdout

const refDeps = (item) => {
  item.refs.forEach(function (ref) {
    if (!deps[ref] && allItems[ref] && allItems[ref].type === 'node') {
      deps[ref] = allItems[ref]
    }
    else if (!deps[ref] && allItems[ref] && allItems[ref].type === 'way') {
      deps[ref] = allItems[ref]
      refDeps(allItems[ref])
    }
  })
}

const membersDeps = (item) => {
  item.members.forEach(function (member) {
    if (member.id &&
        member.type === 'way' &&
        !deps[member.id] &&
        allItems[member.id]) {
      deps[member.id] = allItems[member.id]
      refDeps(allItems[member.id])
    }
  })
}

fs.createReadStream(source)
  .pipe(osm)
  .pipe(through.obj(accumulate, pack))
  .pipe(target)

function accumulate (items, enc, next) {
  items.forEach(async function (item) {
    allItems[item.id] = item
    if (item.type === 'node') {
      // continue
    }
    else if (item.type === 'way') {
      refDeps(item)
    }
    else if (item.type === 'relation') {
      membersDeps(item)
    }
  })
  next()
}

function pack (next) {
  Object.values(allItems)
    .map((item) => {
      const encoded = encode(item, deps)
      if (!encoded) {
        console.log('could-not-encode')
        console.log(item)
      }
      this.push(encoded.toString('base64') + '\n')
    })
  next()
}
