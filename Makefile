# used to coordinate scripts consistently.

.PHONY: ri-server ri-clean pr-server pr-clean clean

# all: rhode-island-eyros
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
	node osm-to-level pr.osm.pbf pr.level

data/pr.georender: data/pr.osm.pbf
	NODE_OPTIONS=--max_old_space_size=8192 node osm-to-georender.js data/pr.osm.pbf data/pr.georender

data/pr.georender-rs: data/pr.osm.pbf
	RUST_BACKTRACE=1 cargo run data/pr.osm.pbf > data/pr.georender-rs # hex encoded values come out of this

data/pr.eyros: data/pr.georender
	cat data/pr.georender | npx georender-eyros --datadir data/pr.eyros --format base64

data/pr.eyros-rs: data/pr.georender-rs
	cat data/pr.georender-rs | npx georender-eyros --datadir data/pr.eyros-rs --format hex

data/pr.eyros.hyperdrive: data/pr.eyros
	node fs-to-hyperdrive.js data/pr.eyros data/pr.eyros.hyperdrive

data/pr.eyros-rs.hyperdrive: data/pr.eyros-rs
	node fs-to-hyperdrive.js data/pr.eyros-rs data/pr.eyros-rs.hyperdrive

pr-server: data/pr.eyros.hyperdrive
	npx peermaps http hyper://8dd32c75f010a4c43a57eeeefa7b7875bd2f602a4bec0a0dacefd10ac7196e2b --port 8081 --datadir data/pr.eyros.hyperdrive

pr-server-rs: data/pr.eyros-rs.hyperdrive
	npx peermaps http hyper://6705b5654922833faea8860faf800712100b7b6538cee7ed9f90a0059d8f0bf3 --port 8081 --datadir data/pr.eyros-rs.hyperdrive

pr-clean:
	rm -rf data/pr*

clean: ri-clean pr-clean
