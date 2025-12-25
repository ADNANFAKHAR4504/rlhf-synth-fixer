#!/bin/bash
# CDK run script for Java application
set -e

# Change to the directory containing this script
cd "$(dirname "$0")"

# Build and run the CDK app using Gradle
./gradlew run --quiet
