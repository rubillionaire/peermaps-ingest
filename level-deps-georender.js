// make a georender file from a single osm item given its id

const fs = require('fs')
const through = require('through2')
const {Level} = require('level')
const {encode} = require('georender-pack')

// node level-deps-resolution.js data/pr.level 7117066 data/pr.georender-7117066

const dbFileName = process.argv[2]
const rootId = process.argv[3]
const writeFile = process.argv[4]
  ? fs.createWriteStream(process.argv[4])
  : { end: () => {} }

const db = new Level(dbFileName, { valueEncoding: 'json' })

const deps = {}

const getDep = (id) => {
  return new Promise((resolve, reject) => {
    db.get(id, (error, value) => {
      if (error) return reject(error)
      resolve(value)
    })
  })
}

const getRefs = async (item) => {
  const getters = item.refs.map((refId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const ref = await getDep(refId)
        if (ref.type === 'node') deps[refId] = ref
        resolve()  
      }
      catch (error) {
        reject(error)
      }
    })
  })
  await Promise.all(getters)
}

const getMembers = async (item) => {
  const getters = item.members
    .filter((member) => {
      return member && member.id
    })
    .map((member) => {
      return new Promise(async (resolve, reject) => {
        try {
          const way = await getDep(member.id)
          deps[member.id] = way
          await getRefs(way)
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
    const item = await db.get(rootId)
    if (item.type === 'node') {
      // no deps
    }
    else if (item.type === 'way') {
      await getRefs(item)
    }
    else if (item.type === 'relation') {
      await getMembers(item)
    }
    writeFile.write((encode(item, deps)).toString('base64') + '\n')
    writeFile.end()
  }
  catch (error) {
    console.log(error)
  }  
})()
