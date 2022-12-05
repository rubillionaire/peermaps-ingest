# peermaps-ingest scripts

Collection of scripts used to obtain [OSM PBF](https://wiki.openstreetmap.org/wiki/PBF_Format) data, convert it to [georender](https://github.com/peermaps/docs/blob/master/georender.md) data, put it into an [eyros](https://github.com/peermaps/eyros) database, and then host that as a [hyperdrive](https://github.com/hypercore-protocol/hyperdrive).

This is all based on my current working knowledge of how the peermaps ecosystem works, and to support my desire to make maps using this stack.

The `Makefile.example` has a `data/pr.eyros.hyperdrive` target that has all the dependencies to produce the final data for Puerto Rico.
