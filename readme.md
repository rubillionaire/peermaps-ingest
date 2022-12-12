# peermaps-ingest

Status: This has been used to successfully import an OSM PBF of Puerto Rico.

Module and CLI to read [OSM PBF](https://wiki.openstreetmap.org/wiki/PBF_Format) data, store it in an intermediary [leveldb](https://github.com/Level/level/), convert it to new line delimited [georender](https://github.com/peermaps/docs/blob/master/georender.md) file, put it into an [eyros](https://github.com/peermaps/eyros) database, and then host that as a [hyperdrive](https://github.com/hypercore-protocol/hyperdrive).

This module is glue between [osm-pbf-parser](https://www.npmjs.com/package/osm-pbf-parser), [georender-pack](https://github.com/peermaps/georender-pack) & [georender-eyros](https://github.com/peermaps/georender-eyros).

Do the entire processing pipeline, from OSM PBF to eyros hyperdrive by running:

`peermaps-ingest osm.pbf --datadir data`

This will write your OSM to a leveldb (`data/level`), write new line delimited georender of your OSM (`dadta/georender`), write an eyros db from your georender data (`data/eyros`), and a hyperdrive of the eyros db (`data/hyperdrive`).

The command can also be use in parts.

```bash
$ peermaps-ingest osm2level osm.pbf -o data/level
$ peermaps-ingest level2georender data/level -o data/georender
$ cat data/georender | npx georender-eyros --datadir data/eyros --format base64
$ peermaps-ingest eyros2hyperdrve data/eyros -o data/hyperdrive
```

To create a hyperdrive of a subset of OSM features, pass in the IDs that you want to have a hyperdrive of into `peermaps-ingest level2georender`

```bash
$ peermaps-ingest level2georender data/level -o data/georender --id relation:7117066,relation:253642,relation:2747855
```
