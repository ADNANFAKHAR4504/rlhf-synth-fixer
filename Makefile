.PHONY: help install build test deploy-dev deploy-prod clean

help:
	@echo "Available commands:"
	@echo "  make install     - Install Go dependencies"
	@echo "  make build       - Build Lambda functions"
	@echo "  make test        - Run tests"
	@echo "  make deploy-dev  - Deploy to development environment"
	@echo "  make deploy-prod - Deploy to production environment"
	@echo "  make clean       - Clean build artifacts"

install:
	go mod download
	npm install -g aws-cdk

build:
	cd lib/lambda/validation && \
	GOOS=linux GOARCH=amd64 go build -o bootstrap main.go && \
	zip -j function.zip bootstrap

test:
	go test ./... -v

deploy-dev:
	cdk deploy PaymentStack-dev \
		-c environment=dev \
		-c environmentSuffix=dev-v1

deploy-prod:
	cdk deploy PaymentStack-prod \
		-c environment=prod \
		-c environmentSuffix=prod-v1

clean:
	rm -rf cdk.out
	rm -f lib/lambda/*/bootstrap
	rm -f lib/lambda/*/function.zip
