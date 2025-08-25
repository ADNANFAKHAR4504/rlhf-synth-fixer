#!/bin/bash
echo '{}' > cfn-outputs/flat-outputs.json
jq -r '.[] | "\(.OutputKey)=\(.OutputValue)"' cfn-outputs/stack-outputs.json | while IFS='=' read -r key value; do
  jq --arg key "$key" --arg value "$value" '. + {($key): $value}' cfn-outputs/flat-outputs.json > cfn-outputs/temp.json
  mv cfn-outputs/temp.json cfn-outputs/flat-outputs.json
done
cat cfn-outputs/flat-outputs.json