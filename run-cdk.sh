#!/bin/bash

# Set proper paths
export PATH="/Users/django/.nvm/versions/node/v22.17.0/bin:$PATH"
export ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-synthtrainr483cdkjava}
export CDK_DEFAULT_ACCOUNT=${CDK_DEFAULT_ACCOUNT:-718240086340}
export CDK_DEFAULT_REGION=${CDK_DEFAULT_REGION:-us-west-2}
export AWS_REGION=${AWS_REGION:-us-west-2}

# Run the gradle wrapper with proper environment
exec ./gradlew run "$@"