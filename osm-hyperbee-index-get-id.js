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
const id = process.argv[3]

const db = new Hyperbee(hypercore(source), {
  keyEncoding: 'utf-8',
  valueEncoding: 'binary',
})

;(async () => {
  const result = await db.get(osmId(id))
  if (!result || !result.value) return console.log('not found')
  console.log(JSON.parse(result.value))
})()
