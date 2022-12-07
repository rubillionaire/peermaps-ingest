#!/usr/bin/env node

const {Level} = require('level')
const path = require('path')
const minimist = require('minimist')
const argv = minimist(process.argv.slice(2), {
  alias: {
    i: 'input',
    o: 'output',
    f: 'format',
    l: 'levelDir',
    g: 'georenderFilePath',
    e: 'eyrosDir',
    hd: 'hyperdriveDir',
    k: 'key',
    h: 'help',
    d: 'datadir',
  },
  default: {
    datadir: '.',
    format: 'base64',
  },
})
const OSM2LEVEL = 'osm2level'
const LEVEL2GEORENDER = 'level2georender'
const EYROS2HYPERDRVE = 'eyros2hyperdrve'
const cmds = [OSM2LEVEL, LEVEL2GEORENDER, EYROS2HYPERDRVE]


if (argv._[0] === OSM2LEVEL && (argv.help || (!argv.input && !argv._[1]) || (!argv.output && !argv.levelDir))) {
  return osm2LevelUsage()
}
else if (argv._[0] === OSM2LEVEL) {
  const osmFilePath = argv.input || argv._[1]
  const levelDir = argv.levelDir || argv.output
  const leveldb = new Level(levelDir, { valueEncoding: 'json' })
  const debug = argv.debug

  const osmToLevel = require('../osm-to-level.js')

  ;(async () => {
    await osmToLevel({ osmFilePath, leveldb, debug })
  })()
}
else if (argv._[0] === LEVEL2GEORENDER && (argv.help || (!argv.levelDir && !argv.input && !argv._[1]) || (!argv.georenderFilePath && !argv.output))) {
  return level2GeorenderUsage()
}
else if (argv._[0] === LEVEL2GEORENDER) {
  const levelDir = argv.levelDir || argv.input || argv._[1]
  const leveldb = new Level(levelDir, { valueEncoding: 'json' })
  const georender = argv.georenderFilePath || argv.output
  const id = getId()
  const debug = argv.debug
  const format = argv.format

  const levelToGeorender = require('../level-to-georender.js')

  ;(async () => {
    await levelToGeorender({ leveldb, georender, id, format, debug })
  })()
}
else if (argv._[0] === EYROS2HYPERDRVE && (argv.help || (!argv.eyrosDir && !argv._[1] && !argv.input) || (!argv.output && !argv.hyperdriveDir))) {
  return eyros2HyperdriveUsage()
}
else if (argv._[0] === EYROS2HYPERDRVE) {
  const eyrosDir = argv.eyrosDir || argv.input || argv._[1]
  const hyperdriveDir = argv.hyperdriveDir || argv.output
  const key = getKey()
  const debug = argv.debug

  const eyrosToHyperdrive = require('../eyros-to-hyperdrive.js')

  ;(async () => {
    const { drive } = await eyrosToHyperdrive({ eyrosDir, hyperdriveDir, key, debug })
    console.log(`hyper://${drive.key.toString('hex')}`)
  })()
}
else if (cmds.indexOf(argv._[0]) === -1 && (argv.help || (!argv.input && !argv._[0]))) {
  return ingestUsage()
}
else if (cmds.indexOf(argv._[0]) === -1) {
  const osmFilePath = argv.input || argv._[0]
  const levelDir = argv.levelDir || path.join(argv.datadir, 'level')
  const leveldb = new Level(levelDir, { valueEncoding: 'json' })
  const georenderFilePath = argv.georenderFilePath || path.join(argv.datadir, 'georender')
  const format = argv.format
  const id = getId()
  const eyrosDir = argv.eyrosDir || path.join(argv.datadir, 'eyros')
  const hyperdriveDir = argv.hyperdriveDir || path.join(argv.datadir, 'hyperdrive')
  const key = getKey()
  const debug = argv.debug  

  const osmToLevel = require('../osm-to-level.js')
  const levelToGeorender = require('../level-to-georender.js')
  const georenderToEryos = require('../georender-to-eyros')
  const eyrosToHyperdrive = require('../eyros-to-hyperdrive.js')

  ;(async () => {
    if (debug) console.log('osmToLevel')
    await osmToLevel({ osmFilePath, leveldb, debug })
    if (debug) console.log('levelToGeorender')
    await levelToGeorender({ leveldb, georender: georenderFilePath, id, format, debug })
    if (debug) console.log('georenderToEryos')
    await georenderToEryos({ georenderFilePath, eyrosDir, format })
    if (debug) console.log('eyrosToHyperdrive')
    const { drive } = await eyrosToHyperdrive({ eyrosDir, hyperdriveDir, key, debug })
    console.log(`hyper://${drive.key.toString('hex')}`)
  })()
}
else {
  return ingestUsage()
}

function getKey () {
  return typeof argv.key === 'string'
    ? Buffer.from(argv.key, 'hex')
    : null
}

function getId () {
  return typeof argv.id === 'string'
    ? argv.id.split(',').map((s) => s.trim())
    : null
}

function ingestUsage() {
  console.log(`
    usage: peermaps-ingest [FILE] {OPTIONS}

    Read an OSM PBF file, write it to an intermediate leveldb,
    encode the features (relation, way, node) into a new line
    delimited georender file, write the georender to an eyros
    database, write the contents into a hyperdrive.

      -i --input    The input OSM PBF file to read in. Alternatively
                    pass the file in as the first argument. Required.
      -l
      --levelDir    Directory to write the leveldb. Defaults to
                    path.join(--datadir, 'level').
      -g
      --georenderFilePath
                    File path to write the new line delimited
                    georender data. Defaults to
                    path.join(--datadir, 'georender').
      -e
      --eyrosDir   Directory to write the eyros db. Defaults to
                    path.join(--datadir, 'eyros').
      -hd
      --hyperdriveDir
                    Directory to write the hyperdrive. Defaults to
                    path.join(--datadir, 'hyperdrive').
      -d --datadir  Directory to write the leveldb, georender file,
                    and eyros database, and hyperdrive.
                    Defaults to the current directory.
      -f --format   Format to encode the georender into.
                    Defaults to base64.
      -k --key   Key to assign to the hyperdrive. Optional.
      --id          Comma delimited list of OSM ID values to consider
                    for the georender file. Optional. Omitting this
                    option includes all OSM items.
      -h --help     Show this message.

    The steps of the ingest can also be performed individually,
    using the following commands:

    - peermaps-ingest osm2level
    - peermaps-ingest level2georender
    - georender-eyros
    - peermaps-ingest eyros2hyperdrive
    - peermaps-ingest eyros2hyperdrive

    Run any of these commands with --help to see usage.

  `.trim().replace(/^ {4}/gm,'') + '\n')
}

function osm2LevelUsage() {
  console.log(`
    usage: peermaps-ingest osm2level [FILE] {OPTIONS}

    Read an OSM PBF file, write it to an intermediate leveldb
    indexed by the each item's \`id\` attribute.

      -i --input    OSM PBF file to read in. Alternatively pass
                    the file in as the first argument. Required.
      -o --output   Directory to write the leveldb. Required.
      --debug       Log debug statements.
      -h --help     Show this message.

  `.trim().replace(/^ {4}/gm,'') + '\n')
}

function level2GeorenderUsage () {
  console.log(`
    usage: peermaps-ingest level2georender [DIRECTORY] {OPTIONS}

    Iterate over the values of the leveldb, encode values in georender
    and write new line delimited encoded data to the output file.

      - i --input   leveldb directory to read from. Alternatively
                    pass the directory in as the first argument. Required.
      -o --output   Directory to write the new line delimited georender.
                    Defaults to writing to process.stdout.
      -f --format   Format to encode the georender into.
                    Defaults to base64.
      --id          Comma delimited list of OSM ID values to consider
                    for the georender file. Optional. Omitting this
                    option includes all OSM items.
      --debug       Log debug statements.
      -h --help     Show this message.

  `.trim().replace(/^ {4}/gm,'') + '\n')
}

function eyros2HyperdriveUsage () {
  console.log(`
    usage: peermaps-ingest eyros2hyperdrive [DIRECTORY] {OPTIONS}

    Read all files of an eyros datatbase directory and write them to
    a hyperdrive at the output directory. Will finish by logging the
    hyperdrive's hyper:// url.

      - i --input   Eyros database directory to read in. Alternatively
                    pass the directory in as the first argument. Required.
      -o --output   Directory to write the hyperdrive to. Required.
      -k --key   Key to assign to the hyperdrive. Optional.
      --debug       Log debug statements.
      -h --help     Show this message.

  `.trim().replace(/^ {4}/gm,'') + '\n')
}