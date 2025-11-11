#!/usr/bin/env bash
set -euo pipefail
# Blue/Green deploy to GKE with Istio traffic split.
# Usage: deploy-gke-bluegreen.sh <cluster-name>
CLUSTER="${1:?cluster name required}"
NAMESPACE="${NAMESPACE:-default}"
APP="${APP_NAME:-app-name}"
IMAGE="${IMAGE_OVERRIDE:-$(cat image.txt)}"

echo "[gke] Cluster: ${CLUSTER}, Namespace: ${NAMESPACE}, App: ${APP}, Image: ${IMAGE}"

# Assume kubecontext is already configured by CI anchor
kubectl -n "${NAMESPACE}" set image deployment/${APP}-green ${APP}="${IMAGE}"
kubectl -n "${NAMESPACE}" rollout status deployment/${APP}-green

# Shift traffic via Istio VirtualService (50/50 as an example)
# Requires your VirtualService to support weighted routes 'blue' and 'green'.
kubectl -n "${NAMESPACE}" patch virtualservice ${APP}-vs --type='merge' -p '{"spec":{"http":[{"route":[{"destination":{"host":"%s-blue"},"weight":50},{"destination":{"host":"%s-green"},"weight":50}]}]}}'

# Post-shift checks
kubectl -n "${NAMESPACE}" get pods -o wide
