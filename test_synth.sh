#!/bin/bash
export ENVIRONMENT_SUFFIX=synthtrainr479cdkjava
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1

echo "Testing CDK synthesis with environment:"
echo "ENVIRONMENT_SUFFIX: $ENVIRONMENT_SUFFIX"
echo "CDK_DEFAULT_ACCOUNT: $CDK_DEFAULT_ACCOUNT"
echo "CDK_DEFAULT_REGION: $CDK_DEFAULT_REGION"

# First compile the Java code
./gradlew build -x test -x integrationTest -x jacocoTestReport -x jacocoTestCoverageVerification

# Try to run synthesis
echo "Starting synthesis..."
./gradlew run --args="--app 'java -cp build/libs/iac-test-automations.jar app.Main' synth"
