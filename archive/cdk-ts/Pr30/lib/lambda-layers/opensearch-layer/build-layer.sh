#!/bin/bash

# Script to build the Lambda layer
set -e

echo "Building OpenSearch Lambda layer..."

# Create python directory for Lambda layer
mkdir -p python

# Install dependencies
pip install -r requirements.txt -t python/

# Create zip file
zip -r opensearch-layer.zip python/

echo "Layer built successfully: opensearch-layer.zip"
echo "Upload this to AWS Lambda as a layer, or use it with CDK LayerVersion"
