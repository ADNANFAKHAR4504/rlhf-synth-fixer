#!/usr/bin/env bash
set -euo pipefail
log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [rollback-ecs] $*"; }
retry() { a="${1:-5}"; shift; c=0; until "$@"; do c=$((c+1)); [ "$c" -ge "$a" ] && { log "Command failed after ${a} attempts: $*"; return 1; }; log "Command failed (attempt ${c}), retrying..."; sleep 5; done; }
ENVIRONMENT="${1:?ENVIRONMENT is required}"
ECS_CLUSTER="${ECS_CLUSTER:?ECS_CLUSTER env is required}"
SERVICE_NAMES="${SERVICE_NAMES:-order-service payment-service inventory-service notification-service}"
log "Starting ECS rollback for env=${ENVIRONMENT}, cluster=${ECS_CLUSTER}"
for SERVICE in ${SERVICE_NAMES}; do
  SERVICE_NAME="${SERVICE}-${ENVIRONMENT}"
  log "Rolling back service=${SERVICE_NAME}"
  CURRENT_TASK_DEF_ARN="$(aws ecs describe-services --cluster "${ECS_CLUSTER}" --services "${SERVICE_NAME}" --query 'services[0].taskDefinition' --output text)"
  [ -z "${CURRENT_TASK_DEF_ARN}" ] || [ "${CURRENT_TASK_DEF_ARN}" = "None" ] && { log "No current task definition found for ${SERVICE_NAME}"; exit 1; }
  FAMILY=$(echo "${CURRENT_TASK_DEF_ARN}" | awk -F'/' '{print $2}' | cut -d':' -f1)
  [ -z "${FAMILY}" ] && { log "Failed to parse family from ${CURRENT_TASK_DEF_ARN}"; exit 1; }
  ARNS=$(aws ecs list-task-definitions --family-prefix "${FAMILY}" --sort DESC --max-items 2 --query 'taskDefinitionArns' --output text)
  PREV_TASK_DEF_ARN=""; IDX=0
  for ARN in ${ARNS}; do IDX=$((IDX+1)); [ "${IDX}" -eq 2 ] && { PREV_TASK_DEF_ARN="${ARN}"; break; }; done
  [ -z "${PREV_TASK_DEF_ARN}" ] && { log "No previous task definition to roll back to for family=${FAMILY}"; exit 1; }
  log "Rolling back ${SERVICE_NAME} to ${PREV_TASK_DEF_ARN}"
  retry 5 aws ecs update-service --cluster "${ECS_CLUSTER}" --service "${SERVICE_NAME}" --task-definition "${PREV_TASK_DEF_ARN}" >/dev/null
  log "Waiting for service stabilization: ${SERVICE_NAME}"
  retry 10 aws ecs wait services-stable --cluster "${ECS_CLUSTER}" --services "${SERVICE_NAME}"
  log "Service ${SERVICE_NAME} rolled back successfully"
done
log "All ECS services rolled back for env=${ENVIRONMENT}"
