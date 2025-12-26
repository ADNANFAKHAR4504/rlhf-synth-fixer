#!/bin/bash
set -euo pipefail

# Get the project root directory (parent of scripts/)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Change to project root where pom.xml is located
cd "$PROJECT_ROOT"

# Compile the Java code
mvn -q compile

# Run the CDK app
mvn -q exec:java -Dexec.mainClass="app.Main"
