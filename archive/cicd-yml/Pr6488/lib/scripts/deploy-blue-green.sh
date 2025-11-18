#!/usr/bin/env bash
set -euo pipefail
log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [deploy-blue-green] $*"; }
retry() { a="${1:-5}"; shift; c=0; until "$@"; do c=$((c+1)); [ "$c" -ge "$a" ] && { log "Command failed after ${a} attempts: $*"; return 1; }; log "Command failed (attempt ${c}), retrying..."; sleep 5; done; }
ENVIRONMENT="${1:?ENVIRONMENT (staging) is required}"
ECR_REGISTRY="${2:?ECR_REGISTRY is required}"
IMAGE_TAG="${3:?IMAGE_TAG is required}"
ECS_CLUSTER="${ECS_CLUSTER:?ECS_CLUSTER env is required}"
SERVICE_NAMES="${SERVICE_NAMES:-order-service payment-service inventory-service notification-service}"
BLUE_TG_ARN="${BLUE_TG_ARN:?BLUE_TG_ARN env is required}"
GREEN_TG_ARN="${GREEN_TG_ARN:?GREEN_TG_ARN env is required}"
LISTENER_ARN="${LISTENER_ARN:?LISTENER_ARN env is required}"
SECURITY_GROUPS_JSON="${SECURITY_GROUPS:?SECURITY_GROUPS env (JSON array) is required}"
SUBNET_IDS_JSON="${SUBNET_IDS:?SUBNET_IDS env (JSON array) is required}"
log "Starting blue-green deploy for env=${ENVIRONMENT} cluster=${ECS_CLUSTER}"
NETWORK_CFG="awsvpcConfiguration={assignPublicIp=DISABLED,securityGroups=${SECURITY_GROUPS_JSON},subnets=${SUBNET_IDS_JSON}}"
for SERVICE in ${SERVICE_NAMES}; do
  GREEN_SERVICE="${SERVICE}-${ENVIRONMENT}-green"
  FULL_IMAGE="${ECR_REGISTRY}/${SERVICE}:${IMAGE_TAG}"
  log "Updating GREEN service=${GREEN_SERVICE} image=${FULL_IMAGE}"
  TASK_DEF_ARN="$(aws ecs describe-services --cluster "${ECS_CLUSTER}" --services "${GREEN_SERVICE}" --query 'services[0].taskDefinition' --output text)"
  [ -z "${TASK_DEF_ARN}" ] || [ "${TASK_DEF_ARN}" = "None" ] && { log "Missing GREEN service or task definition for ${GREEN_SERVICE}"; exit 1; }
  aws ecs describe-task-definition --task-definition "${TASK_DEF_ARN}" --query 'taskDefinition' --output json > /tmp/bg-task-def.json
  jq --arg img "${FULL_IMAGE}" '.containerDefinitions |= (map(.image = $img)) | del(.revision,.taskDefinitionArn,.status,.requiresAttributes,.compatibilities)' /tmp/bg-task-def.json > /tmp/bg-task-def-updated.json
  NEW_TASK_DEF_ARN="$(aws ecs register-task-definition --cli-input-json file:///tmp/bg-task-def-updated.json --query 'taskDefinition.taskDefinitionArn' --output text)"
  log "New GREEN task definition: ${NEW_TASK_DEF_ARN}"
  retry 5 aws ecs update-service --cluster "${ECS_CLUSTER}" --service "${GREEN_SERVICE}" --task-definition "${NEW_TASK_DEF_ARN}" --network-configuration "${NETWORK_CFG}" --force-new-deployment >/dev/null
  log "Waiting for GREEN service stable: ${GREEN_SERVICE}"
  retry 10 aws ecs wait services-stable --cluster "${ECS_CLUSTER}" --services "${GREEN_SERVICE}"
done
log "Checking GREEN target group health: ${GREEN_TG_ARN}"
HEALTH_OUTPUT="$(aws elbv2 describe-target-health --target-group-arn "${GREEN_TG_ARN}")"
UNHEALTHY_COUNT="$(echo "${HEALTH_OUTPUT}" | jq '[.TargetHealthDescriptions[] | select(.TargetHealth.State!="healthy")] | length')"
[ "${UNHEALTHY_COUNT}" -ne 0 ] && { log "GREEN target group has ${UNHEALTHY_COUNT} unhealthy targets, aborting and keeping BLUE"; exit 1; }
log "Switching listener ${LISTENER_ARN} to GREEN target group: ${GREEN_TG_ARN}"
aws elbv2 modify-listener --listener-arn "${LISTENER_ARN}" --default-actions "Type=forward,TargetGroupArn=${GREEN_TG_ARN}" >/dev/null
log "Blue-green deployment completed successfully for env=${ENVIRONMENT}"
