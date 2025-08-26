#!/bin/bash
export PATH="/Users/django/.nvm/versions/node/v22.17.0/bin:$PATH"
export NODE_PATH="/Users/django/.nvm/versions/node/v22.17.0/lib/node_modules"
export JSII_RUNTIME="/Users/django/.nvm/versions/node/v22.17.0/bin/node"
export _JAVA_OPTIONS="-Djava.security.manager=allow"
./gradlew run "$@"