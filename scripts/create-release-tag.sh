#!/bin/bash
set -e

echo "🏷️  Creating release tag..."

# Validate required environment variables
if [ -z "$IMAGE_TAG" ]; then
  echo "Error: IMAGE_TAG environment variable is not set"
  exit 1
fi

# Generate release tag based on timestamp
RELEASE_TAG="release-$(date -u +'%Y%m%d-%H%M%S')"

echo "Creating release tag: ${RELEASE_TAG}"
echo "Image tag: ${IMAGE_TAG}"

# Log the release information
echo "Release Information:" > release-info.txt
echo "  Tag: ${RELEASE_TAG}" >> release-info.txt
echo "  Image: ${IMAGE_TAG}" >> release-info.txt
echo "  Date: $(date -u +'%Y-%m-%d %H:%M:%S UTC')" >> release-info.txt
echo "  Commit: ${GITHUB_SHA:-unknown}" >> release-info.txt

cat release-info.txt

echo "✅ Release tag created: ${RELEASE_TAG}"
