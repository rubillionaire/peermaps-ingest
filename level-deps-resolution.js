const fs = require('fs')
const through = require('through2')
const {Level} = require('level')

const dbFileName = process.argv[2]
const rootId = process.argv[3]

const allItemsKey = (id) => `allItems:${id}`

const db = new Level(dbFileName, { valueEncoding: 'json' })

const deps = {}

const getDep = (id) => {
  return new Promise((resolve, reject) => {
    db.get(allItemsKey(id), (error, value) => {
      if (error) return reject(error)
      deps[id] = value
      resolve(value)
    })
  })
}

const getRefs = async (item) => {
  const getters = item.refs.map((refId) => {
    return getDep(refId)
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
    const item = await db.get(allItemsKey(rootId))
    if (item.type === 'node') {
      // no deps
    }
    else if (item.type === 'way') {
      await getRefs(item)
    }
    else if (item.type === 'relation') {
      await getMembers(item)
    }
    console.log(deps)
  }
  catch (error) {
    console.log(error)
  }
  
})()
