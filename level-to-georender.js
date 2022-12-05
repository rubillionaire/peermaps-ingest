const fs = require('fs')
const {Level} = require('level')
const through = require('through2')
const {encode} = require('georender-pack')
const varint = require('varint')

const enforceCheck = true

const dbFileName = process.argv[2]
const writeFile = process.argv[3]
  ? fs.createWriteStream(process.argv[3])
  : process.stdout

const db = new Level(dbFileName, { valueEncoding: 'json' })

const getDep = (id) => {
  return new Promise((resolve, reject) => {
    db.get(id, (error, value) => {
      if (error) {
        console.log('get-id:error:', id)
        return resolve()
      }
      resolve(value)
    })
  })
}

const getRefs = async (item, deps) => {
  if (!Array.isArray(item.refs) || item.refs.length === 0) return Promise.resolve()
  const getters = item.refs.map((refId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const ref = await getDep(refId)
        if (!ref) return resolve()
        if (ref.type === 'node') deps[refId] = ref
        if (ref.type === 'way') {
          deps[refId] = ref
          await getRefs(ref, deps)
        }
        resolve()  
      }
      catch (error) {
        reject(error)
      }
    })
  })
  await Promise.all(getters)
}

const getMembers = async (item, deps) => {
  const getters = item.members
    .filter((member) => {
      return member && member.id
    })
    .map((member) => {
      return new Promise(async (resolve, reject) => {
        try {
          const way = await getDep(member.id)
          if (!way) return resolve()
          deps[member.id] = way
          await getRefs(way, deps)
          resolve()  
        }
        catch (error) {
          reject(error)
        }
      })
    })
  await Promise.all(getters)
}

;(async () => {
  try {
    for await (const item of db.values()) {
      const deps = {}
      if (item.type === 'node') {
        // no deps
      }
      else if (item.type === 'way') {
        await getRefs(item, deps)
      }
      else if (item.type === 'relation') {
        await getMembers(item, deps)
      }
      const encodedItem = encode(item, deps)
      if (enforceCheck) {
        const pnt = getPoint(encodedItem)
        if (pnt === null) {
          console.log('null-point', item.id, item.type)
          continue
        }
        const valid = validPoint(pnt)
        // at this junction we could just put the pnt straight into
        // the eyros db? but we do this to break it down. 
        // this could be modified to be a stream that then writes
        // to a file, or writes directly to the eyros db
        if (!valid) {
          console.log('nan-point', item.id, item.type)
          continue
        }
      }
      writeFile.write(encodedItem.toString('base64') + '\n')
    }  
    if (typeof writeFile.end === 'function') writeFile.end()
  }
  catch (error) {
    console.log(error)
  }
})()

function getPoint(buf) {
  var ft = buf[0]
  if (ft !== 1 && ft !== 1 && ft !== 2 && ft !== 3 && ft !== 4) return null
  var offset = 1
  var t = varint.decode(buf, offset)
  offset += varint.decode.bytes
  var id = varint.decode(buf, offset)
  offset += varint.decode.bytes
  if (ft === 0x01) {
    var lon = buf.readFloatLE(offset)
    offset += 4
    var lat = buf.readFloatLE(offset)
    offset += 4
    return [lon,lat]
  } else  if (ft === 0x02 || ft === 0x03 || ft === 0x04) {
    var pcount = varint.decode(buf, offset)
    offset += varint.decode.bytes
    if (pcount === 0) return null
    var point = [[Infinity,-Infinity],[Infinity,-Infinity]]
    for (var i = 0; i < pcount; i++) {
      var lon = buf.readFloatLE(offset)
      offset += 4
      var lat = buf.readFloatLE(offset)
      offset += 4
      point[0][0] = Math.min(point[0][0], lon)
      point[0][1] = Math.max(point[0][1], lon)
      point[1][0] = Math.min(point[1][0], lat)
      point[1][1] = Math.max(point[1][1], lat)
    }
    if (pcount === 1) return point[0]
    return point
  }
  return null
}

function isNumber (v) {
  return typeof v === 'number' && !isNaN(v)
}

function validPoint (pnt) {
  if (!Array.isArray(pnt)) return false
  return pnt.flat().find(p => !isNumber(p)) === undefined
}
