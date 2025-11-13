#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-prod}"

CLUSTER_NAME="shop-${ENVIRONMENT}-cluster"
SERVICES=(
  "order-service"
  "payment-service"
  "inventory-service"
  "notification-service"
)

echo "Rolling back ECS services in ${ENVIRONMENT}"

for svc in "${SERVICES[@]}"; do
  echo "Fetching previous task definition for service ${svc}"
  TASK_DEF_ARN=$(aws ecs describe-services     --cluster "${CLUSTER_NAME}"     --services "${svc}"     --query 'services[0].taskDefinition'     --output text)

  PREV_TASK_DEF_ARN=$(aws ecs list-task-definitions     --family-prefix "$(basename "${TASK_DEF_ARN}")"     --status ACTIVE     --sort DESC     --max-items 2     --query 'taskDefinitionArns[1]'     --output text)

  echo "Updating service ${svc} to previous task definition ${PREV_TASK_DEF_ARN}"
  aws ecs update-service     --cluster "${CLUSTER_NAME}"     --service "${svc}"     --task-definition "${PREV_TASK_DEF_ARN}"     --force-new-deployment     --region "${AWS_REGION:-us-east-1}"     >/dev/null
done

echo "Waiting for services to stabilize..."
for svc in "${SERVICES[@]}"; do
  aws ecs wait services-stable     --cluster "${CLUSTER_NAME}"     --services "${svc}"     --region "${AWS_REGION:-us-east-1}"
done

echo "ECS rollback completed for ${ENVIRONMENT}"
