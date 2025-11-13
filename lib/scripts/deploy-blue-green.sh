#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-staging}"
ECR_REGISTRY="${2:?ECR registry required}"
IMAGE_TAG="${3:?Image tag required}"

CLUSTER_NAME="shop-${ENVIRONMENT}-cluster"
BLUE_TG_ARN="${BLUE_TG_ARN:?BLUE_TG_ARN env required}"
GREEN_TG_ARN="${GREEN_TG_ARN:?GREEN_TG_ARN env required}"
LISTENER_ARN="${LISTENER_ARN:?LISTENER_ARN env required}"

SERVICES=(
  "order-service"
  "payment-service"
  "inventory-service"
  "notification-service"
)

echo "Starting blue-green deployment in ${ENVIRONMENT}"

for svc in "${SERVICES[@]}"; do
  IMAGE="${ECR_REGISTRY}/${svc}:${IMAGE_TAG}"
  echo "Updating GREEN tasks for ${svc} with image ${IMAGE}"
  aws ecs update-service     --cluster "${CLUSTER_NAME}"     --service "${svc}-green"     --force-new-deployment     --desired-count 2     --region "${AWS_REGION:-us-east-1}"     >/dev/null
done

echo "Waiting for GREEN services to stabilize..."
for svc in "${SERVICES[@]}"; do
  aws ecs wait services-stable     --cluster "${CLUSTER_NAME}"     --services "${svc}-green"     --region "${AWS_REGION:-us-east-1}"
done

echo "Switching ALB listener to GREEN target group"
aws elbv2 modify-listener   --listener-arn "${LISTENER_ARN}"   --default-actions "Type=forward,TargetGroupArn=${GREEN_TG_ARN}"   --region "${AWS_REGION:-us-east-1}"   >/dev/null

echo "Scaling down BLUE services"
for svc in "${SERVICES[@]}"; do
  aws ecs update-service     --cluster "${CLUSTER_NAME}"     --service "${svc}-blue"     --desired-count 0     --region "${AWS_REGION:-us-east-1}"     >/dev/null
done

echo "Blue-green deployment completed for ${ENVIRONMENT}"
