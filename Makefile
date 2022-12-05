# Used to coordinate peermaps ingest scripts
# - ri - Rhode Island OSM data
# - pr - Puerto Rico OSM data
# data is stored in data/, any command related to this
# has to do with the data transforms necessary to serve
# peermaps georender data.

.PHONY: ri-server ri-clean pr-server pr-clean clean decode-georender-7117066

all: data/pr.eyros.hyperdrive

# ri things

data/rhode-island-latest.osm.pbf: 
	curl https://download.geofabrik.de/north-america/us/rhode-island-latest.osm.pbf -o data/rhode-island-latest.osm.pbf

data/rhode-island.georender: data/rhode-island-latest.osm.pbf
	node osm-to-georender.js data/rhode-island-latest.osm.pbf data/rhode-island.georender

data/rhode-island.eyros: data/rhode-island.georender
	cat data/rhode-island.georender | npx georender-eyros --datadir data/rhode-island.eyros --format base64

data/rhode-island.eyros.hyperdrive: data/rhode-island.eyros
	node fs-to-hyperdrive.js data/rhode-island.eyros data/rhode-island.eyros.hyperdrive

data/rhode-island-index.hyperbee: data/rhode-island-latest.osm.pbf
	node osm-hyperbee-index.js data/rhode-island-latest.osm.pbf data/rhode-island-index.hyperbee

ri-server: rhode-island-index.hyperbee rhode-island.eyros.hyperdrive
	npx peermaps http hyper://254d4fb77d1ef37204475bdccec469cd6cdff55e88c98d09b676443957dffb76 --port 8081 --datadir rhode-island.eyros.hyperdrive

ri-clean:
	rm data/rhode-island*

ri-get: rhode-island-index.hyperbee
	node osm-hyperbee-index-get-id.js rhode-island-index.hyperbee 972085471

# pr things

data/pr.osm.pbf:
	curl https://download.geofabrik.de/north-america/us/puerto-rico-latest.osm.pbf -o data/pr.osm.pbf

data/pr.level: data/pr.osm.pbf
	node osm-to-level data/pr.osm.pbf data/pr.level

# data/pr.georender: data/pr.osm.pbf
# 	NODE_OPTIONS=--max_old_space_size=8192 node osm-to-georender.js data/pr.osm.pbf data/pr.georender

data/pr.georender: data/pr.level
	node level-to-georender.js data/pr.level data/pr.georender

# data/pr.georender-rs: data/pr.osm.pbf
# 	RUST_BACKTRACE=1 cargo run data/pr.osm.pbf > data/pr.georender-rs # hex encoded values come out of this

data/pr.eyros: data/pr.georender
	cat data/pr.georender | npx georender-eyros --datadir data/pr.eyros --format base64

# data/pr.eyros-rs: data/pr.georender-rs
# 	cat data/pr.georender-rs | npx georender-eyros --datadir data/pr.eyros-rs --format hex

data/pr.eyros.hyperdrive: data/pr.eyros
	node fs-to-hyperdrive.js data/pr.eyros data/pr.eyros.hyperdrive

# data/pr.eyros-rs.hyperdrive: data/pr.eyros-rs
# 	node fs-to-hyperdrive.js data/pr.eyros-rs data/pr.eyros-rs.hyperdrive

pr-server: data/pr.eyros.hyperdrive
	npx peermaps http hyper://49feb44d2d957b80acc967f07a7a7b3ab44c911e6d730548af91ed97c65677cc --port 8084 --datadir data/pr.eyros.hyperdrive

# pr-server-rs: data/pr.eyros-rs.hyperdrive
# 	npx peermaps http hyper://6705b5654922833faea8860faf800712100b7b6538cee7ed9f90a0059d8f0bf3 --port 8081 --datadir data/pr.eyros-rs.hyperdrive

pr-clean:
	rm data/pr.georender
	rm -rf data/pr.eyros
	rm -rf data/pr.eyros.hyperdrive

data/pr.georender-7117066: data/pr.level
	node level-deps-georender.js data/pr.level 7117066 data/pr.georender-7117066

decode-georender-7117066: data/pr.georender-7117066
	node georender-decode.js data/pr.georender-7117066

data/pr.eyros-7117066: data/pr.georender-7117066
	cat data/pr.georender-7117066 | npx georender-eyros --datadir data/pr.eyros-7117066 --format base64

data/pr.eyros.hyperdrive-7117066: data/pr.eyros-7117066
# 	npx hyperdrive-cmd import data/pr.eyros-7117066 -o data/pr.eyros.hyperdrive-7117066
	node fs-to-hyperdrive.js data/pr.eyros-7117066 data/pr.eyros.hyperdrive-7117066

pr-hyper-addr-7117066: data/pr.eyros.hyperdrive-7117066
	npx hyperdrive-cmd addr -o data/pr.eyros.hyperdrive-7117066

pr-server-7117066: data/pr.eyros.hyperdrive-7117066
	npx peermaps http hyper://8f87f38f03b46485d88f742bc7a6a2a7d5260994d579116c0d3935370f279660 --port 8081 --datadir data/pr.eyros.hyperdrive-7117066

pr-hyper-share-7117066: data/pr.eyros.hyperdrive-7117066
	npx hyperdrive-cmd share -o data/pr.eyros.hyperdrive-7117066

pr-query-server-7117066: data/pr.eyros.hyperdrive-7117066
	npx peermaps query hyper://8f87f38f03b46485d88f742bc7a6a2a7d5260994d579116c0d3935370f279660 -f base64 --bbox=-66.12053,18.46412,-66.11023,18.46823  --datadir data/pr.eyros.hyperdrive-7117066

pr-read-hyper-7117066: data/pr.eyros.hyperdrive-7117066
	node read-hyperdrive.js data/pr.eyros.hyperdrive-7117066 /meta

pr-clean-7117066:
	rm data/pr.georender-7117066
	rm -rf data/pr.eyros-7117066
	rm -rf data/pr.eyros.hyperdrive-7117066

# `hyperdrive-cmd share` a hyperdrive that you want to query
query-peermaps:
	npx peermaps query hyper://3dd1656d6408a718fae1117b5283fb18cb1f9139b892ce0f8cacbb6737ec1d67 \
  -f base64 --bbox=-149.91,61.213,-149.89,61.223 | head -n3

clean: ri-clean pr-clean
