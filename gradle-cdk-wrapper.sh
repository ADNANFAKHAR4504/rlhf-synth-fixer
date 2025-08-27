#!/bin/bash
# Wrapper script to run CDK with Gradle

# Ensure PATH contains node
export PATH="/Users/django/.nvm/versions/node/v22.17.0/bin:$PATH"

# Run gradle with proper path
exec ./gradlew run "$@"