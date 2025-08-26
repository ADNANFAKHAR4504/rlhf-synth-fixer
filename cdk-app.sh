#!/bin/bash
# CDK app wrapper script to run Java Main class

# Build the project first if necessary
if [ ! -d iac-test-automations ]; then
  ./gradlew build --quiet >/dev/null 2>&1
  tar -xf build/distributions/iac-test-automations.tar
fi

# Run the Java application using the distribution scripts
exec ./iac-test-automations/bin/iac-test-automations