#!/usr/bin/env bash
set -euo pipefail
log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [deploy-ecs] $*"; }
retry() { a="${1:-5}"; shift; c=0; until "$@"; do c=$((c+1)); [ "$c" -ge "$a" ] && { log "Command failed after ${a} attempts: $*"; return 1; }; log "Command failed (attempt ${c}), retrying..."; sleep 5; done; }
ENVIRONMENT="${1:?ENVIRONMENT (dev|staging|prod) is required}"
ECR_REGISTRY="${2:?ECR_REGISTRY is required}"
IMAGE_TAG="${3:?IMAGE_TAG is required}"
SECURITY_GROUPS_JSON="${SECURITY_GROUPS:?SECURITY_GROUPS env (JSON array) is required}"
SUBNET_IDS_JSON="${SUBNET_IDS:?SUBNET_IDS env (JSON array) is required}"
ECS_CLUSTER="${ECS_CLUSTER:?ECS_CLUSTER env is required}"
SERVICE_NAMES="${SERVICE_NAMES:-order-service payment-service inventory-service notification-service}"
log "Starting ECS deploy for env=${ENVIRONMENT}, cluster=${ECS_CLUSTER}, services=${SERVICE_NAMES}"
for SERVICE in ${SERVICE_NAMES}; do
  FULL_IMAGE="${ECR_REGISTRY}/${SERVICE}:${IMAGE_TAG}"
  log "Deploying service=${SERVICE} with image=${FULL_IMAGE}"
  TASK_DEF_ARN="$(aws ecs describe-services --cluster "${ECS_CLUSTER}" --services "${SERVICE}-${ENVIRONMENT}" --query 'services[0].taskDefinition' --output text)"
  [ -z "${TASK_DEF_ARN}" ] || [ "${TASK_DEF_ARN}" = "None" ] && { log "No existing task definition found for ${SERVICE}-${ENVIRONMENT}"; exit 1; }
  log "Current task definition ARN: ${TASK_DEF_ARN}"
  aws ecs describe-task-definition --task-definition "${TASK_DEF_ARN}" --query 'taskDefinition' --output json > /tmp/task-def.json
  FAMILY=$(jq -r '.family' /tmp/task-def.json)
  [ -z "${FAMILY}" ] || [ "${FAMILY}" = "null" ] && { log "Failed to extract family from task definition"; exit 1; }
  jq --arg img "${FULL_IMAGE}" '.containerDefinitions |= (map(.image = $img)) | del(.revision,.taskDefinitionArn,.status,.requiresAttributes,.compatibilities)' /tmp/task-def.json > /tmp/task-def-updated.json
  NEW_TASK_DEF_ARN="$(aws ecs register-task-definition --cli-input-json file:///tmp/task-def-updated.json --query 'taskDefinition.taskDefinitionArn' --output text)"
  [ -z "${NEW_TASK_DEF_ARN}" ] || [ "${NEW_TASK_DEF_ARN}" = "None" ] && { log "Failed to register new task definition for ${SERVICE}-${ENVIRONMENT}"; exit 1; }
  log "Registered new task definition: ${NEW_TASK_DEF_ARN}"
  NETWORK_CFG="awsvpcConfiguration={assignPublicIp=DISABLED,securityGroups=${SECURITY_GROUPS_JSON},subnets=${SUBNET_IDS_JSON}}"
  retry 5 aws ecs update-service --cluster "${ECS_CLUSTER}" --service "${SERVICE}-${ENVIRONMENT}" --task-definition "${NEW_TASK_DEF_ARN}" --deployment-configuration "maximumPercent=200,minimumHealthyPercent=50" --network-configuration "${NETWORK_CFG}" --force-new-deployment >/dev/null
  log "Waiting for service stabilization: ${SERVICE}-${ENVIRONMENT}"
  retry 10 aws ecs wait services-stable --cluster "${ECS_CLUSTER}" --services "${SERVICE}-${ENVIRONMENT}"
  log "Service ${SERVICE}-${ENVIRONMENT} successfully updated"
done
log "All ECS services deployed successfully for env=${ENVIRONMENT}"
