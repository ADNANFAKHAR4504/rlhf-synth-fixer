#!/bin/bash
set -euo pipefail

ALARM_PREFIX="$1"
AWS_REGION="$2"

aws cloudwatch describe-alarms \
  --alarm-names "${ALARM_PREFIX}" \
  --region "${AWS_REGION}" \
  --query 'MetricAlarms[?StateValue==`ALARM`]' || \
  echo "Alarm check completed"

