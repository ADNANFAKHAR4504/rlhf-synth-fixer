#!/bin/bash

# Ensure Node is in PATH
export PATH="/Users/django/.nvm/versions/node/v22.17.0/bin:$PATH"

# Run the gradle command
./gradlew run "$@"