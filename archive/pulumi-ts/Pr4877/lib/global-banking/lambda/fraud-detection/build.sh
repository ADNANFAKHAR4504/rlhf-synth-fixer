#!/bin/bash

# Build script for Fraud Detection Lambda
# This script builds the Lambda function and packages it for deployment

set -e  # Exit on any error

echo "================================"
echo "Building Fraud Detection Lambda"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}Error: Maven is not installed${NC}"
    echo "Please install Maven: https://maven.apache.org/install.html"
    exit 1
fi

# Check Java version
JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo -e "${RED}Error: Java 17 or later is required${NC}"
    echo "Current Java version: $JAVA_VERSION"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Clean previous builds
echo "Cleaning previous builds..."
mvn clean -q

# Run tests
echo "Running tests..."
if mvn test -q; then
    echo -e "${GREEN}✓ All tests passed${NC}"
else
    echo -e "${RED}✗ Tests failed${NC}"
    exit 1
fi
echo ""

# Package the Lambda
echo "Packaging Lambda function..."
if mvn package -DskipTests -q; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo ""

# Get the JAR file name
JAR_FILE=$(ls target/*.jar | grep -v original)
JAR_SIZE=$(du -h "$JAR_FILE" | cut -f1)

echo "================================"
echo -e "${GREEN}Build Complete!${NC}"
echo "================================"
echo ""
echo "JAR file: $JAR_FILE"
echo "Size: $JAR_SIZE"
echo ""
echo "Next steps:"
echo "  1. Deploy with Pulumi: pulumi up"
echo "  2. Or manually upload: aws lambda update-function-code --function-name fraud-detection --zip-file fileb://$JAR_FILE"
echo ""
echo "To test locally:"
echo "  sam local invoke -e test-event.json"
echo ""
