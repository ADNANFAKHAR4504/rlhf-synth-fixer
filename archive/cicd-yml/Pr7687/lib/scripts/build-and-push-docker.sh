#!/bin/bash
set -euo pipefail

ECR_REGISTRY="$1"
ECR_REPOSITORY="$2"
IMAGE_TAG="$3"
AWS_REGION="$4"

IMAGE_URI="${ECR_REGISTRY}/${ECR_REPOSITORY}"

aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_REGISTRY}"
docker push "${IMAGE_URI}:${IMAGE_TAG}"
docker tag "${IMAGE_URI}:${IMAGE_TAG}" "${IMAGE_URI}:latest"
docker push "${IMAGE_URI}:latest"

