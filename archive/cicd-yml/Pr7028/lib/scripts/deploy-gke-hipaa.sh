#!/bin/bash
set -euo pipefail
# Purpose: Deploy HIPAA-compliant API workloads to GKE cluster.
# Usage: deploy-gke-hipaa.sh <gke_cluster> <environment> <artifact_registry> <short_sha>

if [[ $# -lt 4 ]]; then
  echo "Usage: $0 <gke_cluster> <environment> <artifact_registry> <short_sha>" >&2
  exit 1
fi

GKE_CLUSTER="$1"
ENVIRONMENT="$2"
ARTIFACT_REGISTRY="$3"
SHORT_SHA="$4"

echo "[deploy-gke-hipaa] Deploying to cluster='${GKE_CLUSTER}', env='${ENVIRONMENT}', sha='${SHORT_SHA}'"
# TODO: kubectl apply manifests with restricted PSS, network policies, Workload Identity.
