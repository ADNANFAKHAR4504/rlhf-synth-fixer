#!/bin/bash
# Script to clean up failed EKS node groups from previous deployments
# Usage: ./cleanup-failed-nodegroups.sh <cluster-name> <node-group-name>

set -e

CLUSTER_NAME="${1:-payments-platform-eks-prod}"
NODE_GROUP_NAME="${2}"

if [ -z "$NODE_GROUP_NAME" ]; then
  echo "Usage: $0 <cluster-name> [node-group-name]"
  echo "If node-group-name is omitted, all node groups in CREATE_FAILED or DELETE_FAILED state will be cleaned up"
  exit 1
fi

# Function to check and delete a node group if it's in a failed state
cleanup_nodegroup() {
  local cluster=$1
  local nodegroup=$2
  
  echo "Checking node group: $nodegroup in cluster: $cluster"
  
  # Check if node group exists and get its status
  STATUS=$(aws eks describe-nodegroup \
    --cluster-name "$cluster" \
    --nodegroup-name "$nodegroup" \
    --query 'nodegroup.status' \
    --output text 2>/dev/null || echo "NOT_FOUND")
  
  if [ "$STATUS" = "NOT_FOUND" ]; then
    echo "Node group $nodegroup does not exist, skipping..."
    return 0
  fi
  
  if [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "DELETE_FAILED" ]; then
    echo "Node group $nodegroup is in $STATUS state, deleting..."
    aws eks delete-nodegroup \
      --cluster-name "$cluster" \
      --nodegroup-name "$nodegroup" \
      --no-cli-pager
    
    echo "Waiting for node group $nodegroup to be deleted..."
    aws eks wait nodegroup-deleted \
      --cluster-name "$cluster" \
      --nodegroup-name "$nodegroup" || true
    
    echo "Node group $nodegroup deleted successfully"
  else
    echo "Node group $nodegroup is in $STATUS state, skipping (not in failed state)"
  fi
}

# If specific node group name provided, clean it up
if [ -n "$NODE_GROUP_NAME" ]; then
  cleanup_nodegroup "$CLUSTER_NAME" "$NODE_GROUP_NAME"
else
  # Otherwise, list all node groups and clean up failed ones
  echo "Listing all node groups in cluster: $CLUSTER_NAME"
  NODE_GROUPS=$(aws eks list-nodegroups \
    --cluster-name "$CLUSTER_NAME" \
    --query 'nodegroups[]' \
    --output text 2>/dev/null || echo "")
  
  if [ -z "$NODE_GROUPS" ]; then
    echo "No node groups found in cluster $CLUSTER_NAME"
    exit 0
  fi
  
  for ng in $NODE_GROUPS; do
    cleanup_nodegroup "$CLUSTER_NAME" "$ng"
  done
fi

echo "Cleanup complete"

