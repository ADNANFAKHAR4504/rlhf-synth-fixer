#!/bin/bash
set -euo pipefail

ECR_REPOSITORY="$1"
IMAGE_TAG="$2"
AWS_REGION="$3"

echo "Waiting for ECR image scan to complete..."
sleep 30

SCAN_STATUS=$(aws ecr describe-image-scan-findings \
  --repository-name "${ECR_REPOSITORY}" \
  --image-id imageTag="${IMAGE_TAG}" \
  --region "${AWS_REGION}" \
  --query 'imageScanStatus.status' \
  --output text || echo "PENDING")

if [ "$SCAN_STATUS" != "COMPLETE" ]; then
  echo "Scan still in progress, waiting..."
  sleep 60
fi

CRITICAL_COUNT=$(aws ecr describe-image-scan-findings \
  --repository-name "${ECR_REPOSITORY}" \
  --image-id imageTag="${IMAGE_TAG}" \
  --region "${AWS_REGION}" \
  --query 'imageScanFindings.findingCounts.CRITICAL' \
  --output text || echo "0")

if [ "$CRITICAL_COUNT" != "0" ] && [ "$CRITICAL_COUNT" != "None" ]; then
  echo "Critical vulnerabilities found: $CRITICAL_COUNT"
  exit 1
fi

echo "Image scan passed with $CRITICAL_COUNT critical findings"

