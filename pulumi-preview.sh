#!/bin/bash
set -e

export ENVIRONMENT_SUFFIX="f657c4d4"
export PULUMI_CONFIG_PASSPHRASE="temp-passphrase-for-testing"
export STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"

echo "Environment Suffix: $ENVIRONMENT_SUFFIX"
echo "Stack Name: $STACK_NAME"

pulumi stack select $STACK_NAME
pulumi preview
