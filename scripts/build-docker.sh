#!/bin/bash
set -e

echo "🐳 Building Docker image..."

# Validate required environment variables
if [ -z "$ECR_REGISTRY" ]; then
  echo "Error: ECR_REGISTRY environment variable is not set"
  exit 1
fi

if [ -z "$ECR_REPOSITORY" ]; then
  echo "Error: ECR_REPOSITORY environment variable is not set"
  exit 1
fi

if [ -z "$IMAGE_TAG" ]; then
  echo "Error: IMAGE_TAG environment variable is not set"
  exit 1
fi

# Build the Docker image
IMAGE_NAME="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"

echo "Building image: ${IMAGE_NAME}"

docker build \
  --tag "${IMAGE_NAME}" \
  --build-arg NODE_VERSION="${NODE_VERSION:-18}" \
  --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  --build-arg VCS_REF="${GITHUB_SHA:-unknown}" \
  --label "org.opencontainers.image.created=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  --label "org.opencontainers.image.revision=${GITHUB_SHA:-unknown}" \
  --label "org.opencontainers.image.source=${GITHUB_SERVER_URL:-unknown}/${GITHUB_REPOSITORY:-unknown}" \
  .

echo "✅ Docker image built successfully: ${IMAGE_NAME}"

# Display image details
docker images "${IMAGE_NAME}"
