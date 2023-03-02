start: createfolders build
	mkdir -p log
	docker-compose up

createfolders:
	mkdir -p log || true

build:
	docker-compose build
