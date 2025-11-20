#!/bin/bash

# Validation script for CloudFormation template

set -e

TEMPLATE_FILE="./infrastructure-template.json"
AWS_REGION="us-east-1"

echo "Validating CloudFormation template structure..."

# Check JSON validity
jq empty ${TEMPLATE_FILE}
echo "JSON syntax valid"

# Validate with CloudFormation
aws cloudformation validate-template \
  --template-body file://${TEMPLATE_FILE} \
  --region ${AWS_REGION} > /dev/null

echo "CloudFormation template valid"

# Check for required sections
for section in "AWSTemplateFormatVersion" "Description" "Parameters" "Conditions" "Resources" "Outputs"; do
  if jq -e ".${section}" ${TEMPLATE_FILE} > /dev/null; then
    echo "Section ${section} present"
  else
    echo "Missing section: ${section}"
    exit 1
  fi
done

# Check environmentSuffix usage
SUFFIX_COUNT=$(jq '[paths(. == "EnvironmentSuffix")] | length' ${TEMPLATE_FILE})
echo "EnvironmentSuffix referenced ${SUFFIX_COUNT} times"

echo ""
echo "All validations passed!"
