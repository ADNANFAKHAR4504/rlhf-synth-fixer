#!/bin/bash
set -e

# Build the fat JAR if it doesn't exist or if source files are newer
cd "$(dirname "$0")/.."

FAT_JAR="build/libs/iac-test-automations-fat.jar"

if [ ! -f "$FAT_JAR" ] || [ "lib/src/main/java/app/Main.java" -nt "$FAT_JAR" ]; then
    ./gradlew fatJar --console=plain -q
fi

# Run the fat JAR with system Java to avoid spawn helper issues
exec java -jar "$FAT_JAR" "$@"

