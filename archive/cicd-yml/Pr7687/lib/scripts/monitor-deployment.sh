#!/bin/bash
set -euo pipefail

APP_NAME="$1"
GROUP_NAME="$2"
AWS_REGION="$3"

echo "Monitoring deployment for 5 minutes..."
sleep 300

DEPLOYMENT_ID=$(aws codedeploy list-deployments \
  --application-name "${APP_NAME}" \
  --deployment-group-name "${GROUP_NAME}" \
  --region "${AWS_REGION}" \
  --query 'deployments[0]' \
  --output text)

aws codedeploy get-deployment \
  --deployment-id "${DEPLOYMENT_ID}" \
  --region "${AWS_REGION}" \
  --query 'deploymentInfo.status' || \
  echo "Deployment monitoring completed"

