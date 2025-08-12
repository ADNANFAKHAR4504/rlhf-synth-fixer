#!/bin/bash
set -e

echo "Starting QA validation for trainr241..."
echo "Current directory: $(pwd)"

# Set environment suffix
export ENVIRONMENT_SUFFIX="synthtrainr241"

echo "1. Running lint..."
npm run lint

echo "2. Running build..."
npm run build

echo "3. Running synthesis..."
npm run cdk:synth

echo "QA script completed!"