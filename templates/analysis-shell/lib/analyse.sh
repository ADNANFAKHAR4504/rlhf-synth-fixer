#!/bin/bash
set -e

echo "=== Unused EBS Volumes ==="
aws ec2 describe-volumes \
    --filters Name=status,Values=available \
    --query 'Volumes[*].{VolumeId:VolumeId,Size:Size}' \
    --output table

echo "=== Publicly Exposed Security Groups ==="
aws ec2 describe-security-groups \
    --query 'SecurityGroups[?IpPermissions[?IpRanges[?CidrIp==`0.0.0.0/0`]]].[GroupId,GroupName]' \
    --output table

echo "=== Average Size of CloudWatch Log Streams ==="
GROUP_NAME="${1:-/test-group}"
STREAMS_JSON=$(aws logs describe-log-streams \
    --log-group-name "$GROUP_NAME" \
    --query 'logStreams[*].storedBytes' \
    --output json)
if [ "$(echo "$STREAMS_JSON" | jq length)" -eq 0 ]; then
    echo "No log streams found in $GROUP_NAME"
else
    AVG_SIZE=$(echo "$STREAMS_JSON" | jq '[.[]] | add / length')
    echo "Average log stream size in $GROUP_NAME: $AVG_SIZE bytes"
fi