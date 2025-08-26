#!/bin/bash

# Workaround for Java spawn helper issue on macOS
export PATH="/Users/django/.nvm/versions/node/v22.17.0/bin:$PATH"
export NODE_PATH="/Users/django/.nvm/versions/node/v22.17.0/bin/node"

# Add Java options to help with spawn issues
export _JAVA_OPTIONS="-Djdk.lang.Process.launchMechanism=vfork"
export JAVA_OPTS="-Djdk.lang.Process.launchMechanism=vfork"

# Run gradlew with proper environment
exec ./gradlew run "$@"