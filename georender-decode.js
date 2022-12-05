const fs = require('fs')
const through = require('through2')
const split = require('split2')
const pumpify = require('pumpify')
const {decode} = require('georender-pack')

const source = process.argv[2]

fs.createReadStream(source)
  .pipe(split())
  .pipe(through((buf, enc, next) => {
    const encodedGeorenderBuf = Buffer.from(buf.toString(), 'base64')
    const decodedGeorender = decode([encodedGeorenderBuf])
    console.log(decodedGeorender)
    next()
  }))
