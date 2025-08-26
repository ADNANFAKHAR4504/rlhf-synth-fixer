#!/bin/bash
export PATH="/Users/django/.nvm/versions/node/v22.17.0/bin:$PATH"
export ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-synthtrainr468cdkjava}

# Build the project first
./gradlew build --console=plain

# Create a simple Java runner that doesn't use CDK CLI but generates CloudFormation directly
java -cp "build/classes/java/main:$(./gradlew -q printClasspath)" app.Main > cdk.out/TapStack${ENVIRONMENT_SUFFIX}.template.json 2>&1 || true

echo "Manual synthesis attempt completed"
