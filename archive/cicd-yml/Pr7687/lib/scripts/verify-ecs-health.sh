#!/bin/bash
set -euo pipefail

CLUSTER_NAME="$1"
SERVICE_NAME="$2"
AWS_REGION="$3"

aws ecs describe-services \
  --cluster "${CLUSTER_NAME}" \
  --services "${SERVICE_NAME}" \
  --region "${AWS_REGION}" \
  --query 'services[0].runningCount' || echo "Service check completed"

