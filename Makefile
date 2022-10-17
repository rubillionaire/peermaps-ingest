.PHONY: ri-server ri-clean pr-server pr-clean clean

# all: rhode-island-eyros
all: pr.eyros.hyperdrive

# ri things

rhode-island-latest.osm.pbf: 
	curl https://download.geofabrik.de/north-america/us/rhode-island-latest.osm.pbf -o rhode-island-latest.osm.pbf

rhode-island.georender: rhode-island-latest.osm.pbf
	node osm-to-georender.js rhode-island-latest.osm.pbf rhode-island.georender

rhode-island.eyros: rhode-island.georender
	cat rhode-island.georender | npx georender-eyros --datadir rhode-island.eyros --format base64

rhode-island.eyros.hyperdrive: rhode-island.eyros
	node fs-to-hyperdrive.js rhode-island.eyros rhode-island.eyros.hyperdrive

rhode-island-index.hyperbee: rhode-island-latest.osm.pbf
	node osm-hyperbee-index.js rhode-island-latest.osm.pbf rhode-island-index.hyperbee

ri-server: rhode-island-index.hyperbee rhode-island.eyros.hyperdrive
	npx peermaps http hyper://254d4fb77d1ef37204475bdccec469cd6cdff55e88c98d09b676443957dffb76 --port 8081 --datadir rhode-island.eyros.hyperdrive

ri-clean:
	rm rhode-island-latest.osm.pbf
	rm rhode-island.georender
	rm -rf rhode-island.eyros.hyperdrive
	rm -rf rhode-island-index.hyperbee

ri-get: rhode-island-index.hyperbee
	node osm-hyperbee-index-get-id.js rhode-island-index.hyperbee 972085471

# pr things

pr.osm.pbf:
	curl https://download.geofabrik.de/north-america/us/puerto-rico-latest.osm.pbf -o pr.osm.pbf

pr.georender: pr.osm.pbf
	NODE_OPTIONS=--max_old_space_size=8192 node osm-to-georender.js pr.osm.pbf pr.georender

pr.eyros: pr.georender
	cat pr.georender | npx georender-eyros --datadir pr.eyros --format base64

pr.eyros.hyperdrive: pr.eyros
	node fs-to-hyperdrive.js pr.eyros pr.eyros.hyperdrive

pr-server: pr.eyros.hyperdrive
	npx peermaps http hyper://eabbb3f8c4025b4992ceffc8f0ceef7b61894d13f54c0f99f131d16da01a7b3e --port 8081 --datadir pr.eyros.hyperdrive

pr-clean:
	rm pr.osm.pbf
	rm pr.georender
	rm pr.eyros
	rm -rf pr.eyros.hyperdrive
# 	rm -rf rhode-island-index.hyperbee

clean: ri-clean pr-clean
