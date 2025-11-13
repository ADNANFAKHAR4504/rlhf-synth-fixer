#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-dev}"
ECR_REGISTRY="${2:?ECR registry required}"
IMAGE_TAG="${3:?Image tag required}"

CLUSTER_NAME="shop-${ENVIRONMENT}-cluster"
SERVICES=(
  "order-service"
  "payment-service"
  "inventory-service"
  "notification-service"
)

echo "Deploying ECS services to environment: ${ENVIRONMENT}"
for svc in "${SERVICES[@]}"; do
  IMAGE="${ECR_REGISTRY}/${svc}:${IMAGE_TAG}"
  echo "Updating service ${svc} with image ${IMAGE}"
  aws ecs update-service     --cluster "${CLUSTER_NAME}"     --service "${svc}"     --force-new-deployment     --desired-count 2     --deployment-configuration "maximumPercent=200,minimumHealthyPercent=50"     --network-configuration "awsvpcConfiguration={assignPublicIp=DISABLED,securityGroups=[],subnets=[]}"     --region "${AWS_REGION:-us-east-1}"     >/dev/null
done

echo "Waiting for services to stabilize..."
for svc in "${SERVICES[@]}"; do
  aws ecs wait services-stable     --cluster "${CLUSTER_NAME}"     --services "${svc}"     --region "${AWS_REGION:-us-east-1}"
done

echo "ECS deployment completed for ${ENVIRONMENT}"
