.PHONY: build clean test deps

# Build the Lambda function for AWS (Linux ARM64)
build:
	@echo "Building Lambda function for AWS Lambda..."
	GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -o bootstrap .
	@echo "Creating deployment package..."
	zip bootstrap.zip bootstrap
	@echo "Build complete: bootstrap.zip"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f bootstrap bootstrap.zip
	@echo "Clean complete!"

# Run tests
test:
	@echo "Running tests..."
	go test -v ./...
	@echo "Tests complete!"

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy
	@echo "Dependencies ready!"

# Build for local testing (current OS/arch)
build-local:
	@echo "Building for local testing..."
	go build -o bootstrap-local .
	@echo "Local build complete: bootstrap-local"

