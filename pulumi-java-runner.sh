#!/bin/bash
set -e

# Build if necessary
if [ ! -f "build/libs/app.jar" ]; then
    echo "Building application..."
    ./gradlew build --no-daemon --no-parallel
fi

# Run the application using the fat JAR
exec java -jar build/libs/app.jar "$@"