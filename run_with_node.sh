#!/bin/bash
export PATH=/Users/django/.nvm/versions/node/v22.17.0/bin:$PATH
export NODE_PATH=/Users/django/.nvm/versions/node/v22.17.0/bin/node
java -cp "build/classes/java/main:$(find ~/.gradle/caches -name '*.jar' | tr '\n' ':')" app.Main
