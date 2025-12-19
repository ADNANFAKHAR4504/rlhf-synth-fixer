#!/bin/bash
set -euo pipefail

TOPIC_ARN="$1"
MESSAGE="$2"
SUBJECT="$3"
AWS_REGION="$4"

aws sns publish \
  --topic-arn "${TOPIC_ARN}" \
  --message "${MESSAGE}" \
  --subject "${SUBJECT}" \
  --region "${AWS_REGION}" || echo "SNS notification sent"

