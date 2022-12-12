const fs = require('fs')
const path = require('path')
const {encode} = require('georender-pack')
const varint = require('varint')
const osmItemKey = require('./level-osm-item-key')

// read notes below about the checks that are made on incoming data
const enforceCheck = true

// {
//   leveldb : level,
//   georender : string | WriteStream,
//   format : 'base64'|'hex',
//   debug : boolean,
//   id: string|[string]|undefined
// } => undefined
// Write the contents of the OSM levelleveldb into a georender
// encoded new line delimited file
module.exports = async function levelToGeorender ({
  leveldb,
  georender,
  format='base64',
  debug=false,
  id,
}) {
  const createWriteStream = (filePath) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    return fs.createWriteStream(filePath)
  }
  
  const target = typeof georender === 'string'
    ? createWriteStream(georender)
    : georender && typeof georender.write === 'function' && typeof georender.end === 'function'
      ? georender // has write & end, we can use it to write data
      : process.stdout

   const itemsIteratorForIds = async (idArray) => {
     const items = await leveldb.getMany(idArray)
     return () => items[Symbol.iterator]()
   }

  const items = Array.isArray(id)
    ? await itemsIteratorForIds(id)
    : typeof id === 'string'
      ? await itemsIteratorForIds([id])
      : () => leveldb.values()

  const getDep = (item) => {
    const key = osmItemKey(item)
    return new Promise((resolve, reject) => {
      leveldb.get(key, (error, value) => {
        if (error) {
          if (debug) console.log('get-id:error:', key)
          return resolve()
        }
        if (!value && debug) console.log('get-dep:not-found:', key)
        resolve(value)
      })
    })
  }

  const getRefs = async (item, deps) => {
    if (!Array.isArray(item.refs) || item.refs.length === 0) return Promise.resolve()
    const getters = item.refs.map((refId) => {
      return new Promise(async (resolve, reject) => {
        try {
          const refItem = await getDep({ type: 'node',  id: refId })
          if (refItem) {
            deps[refId] = refItem  
          }
          resolve()  
        }
        catch (error) {
          reject(error)
        }
      })
    })
    return await Promise.all(getters)
  }

  const getMembers = async (item, deps) => {
    const getters = item.members
      .filter((member) => {
        return member && member.id && member.type === 'way' &&
          (member.role === 'inner' || member.role === 'outer')
      })
      .map((member) => {
        return new Promise(async (resolve, reject) => {
          try {
            const way = await getDep(member)
            if (way) {
              deps[member.id] = way
              await getRefs(way, deps)  
            }
            resolve()  
          }
          catch (error) {
            reject(error)
          }
        })
      })
    return await Promise.all(getters)
  }

  try {
    for await (const item of items()) {
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
      if (!encodedItem) {
        if (debug) console.log('no-encoded-item', item.id, item.type)
        continue
      }
      if (enforceCheck) {
        const pnt = getPoint(encodedItem)
        if (pnt === null) {
          if (debug) console.log('null-point', item.id, item.type)
          continue
        }
        const valid = validPoint(pnt)
        if (!valid) {
          if (debug) console.log('nan-point', item.id, item.type)
          continue
        }
      }
      target.write(encodedItem.toString(format) + '\n')
    }  
    target.end()
  }
  catch (error) {
    throw (error)
  }

  // plucked from georender-eyros, should better understand
  // why we might get a null or nan point as described above
  // and if we should filter from them in georender-eyros, or
  // prevent them from occuring upstream
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

}
