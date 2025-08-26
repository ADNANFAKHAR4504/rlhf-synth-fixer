#!/bin/bash
# Wrapper script to ensure proper environment for CDK Java

# Set node path
export PATH="/Users/django/.nvm/versions/node/v22.17.0/bin:$PATH"

# Run gradle with the proper environment
./gradlew run