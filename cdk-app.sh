#!/bin/bash
set -euo pipefail

# Compile and run the CDK app
cd "$(dirname "$0")"

# Compile the Java code
mvn -q compile

# Run the CDK app
mvn -q exec:java -Dexec.mainClass="app.Main"
