#!/bin/bash
# Fix Pulumi state issues for RDS clusters

set -e

STACK_NAME="${STACK_NAME:-TapStackpr6857}"
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-pr6857}"

echo "🔧 Fixing Pulumi state for stack: $STACK_NAME"

# Select the stack
pulumi stack select "$STACK_NAME" --non-interactive

# Get current state
echo "📋 Current state resources:"
pulumi stack export | jq '.deployment.resources[].urn' | grep -i aurora || true

# Remove all RDS related resources from state
echo "🗑️  Removing RDS resources from Pulumi state..."

# Remove old naming convention resources
pulumi state delete 'urn:pulumi:*::TapStack::aws:rds/cluster:Cluster::aurora-primary-'${ENVIRONMENT_SUFFIX} --force --yes || true
pulumi state delete 'urn:pulumi:*::TapStack::aws:rds/clusterInstance:ClusterInstance::aurora-primary-instance-'${ENVIRONMENT_SUFFIX} --force --yes || true
pulumi state delete 'urn:pulumi:*::TapStack::aws:rds/cluster:Cluster::aurora-secondary-'${ENVIRONMENT_SUFFIX} --force --yes || true
pulumi state delete 'urn:pulumi:*::TapStack::aws:rds/clusterInstance:ClusterInstance::aurora-secondary-instance-'${ENVIRONMENT_SUFFIX} --force --yes || true

# Remove v2 naming convention resources
pulumi state delete 'urn:pulumi:*::TapStack::aws:rds/cluster:Cluster::aurora-primary-v2-'${ENVIRONMENT_SUFFIX} --force --yes || true
pulumi state delete 'urn:pulumi:*::TapStack::aws:rds/clusterInstance:ClusterInstance::aurora-primary-instance-v2-'${ENVIRONMENT_SUFFIX} --force --yes || true
pulumi state delete 'urn:pulumi:*::TapStack::aws:rds/cluster:Cluster::aurora-secondary-v2-'${ENVIRONMENT_SUFFIX} --force --yes || true
pulumi state delete 'urn:pulumi:*::TapStack::aws:rds/clusterInstance:ClusterInstance::aurora-secondary-instance-v2-'${ENVIRONMENT_SUFFIX} --force --yes || true

# Remove global clusters
pulumi state delete 'urn:pulumi:*::TapStack::aws:rds/globalCluster:GlobalCluster::aurora-global-'${ENVIRONMENT_SUFFIX} --force --yes || true
pulumi state delete 'urn:pulumi:*::TapStack::aws:rds/globalCluster:GlobalCluster::aurora-global-v2-'${ENVIRONMENT_SUFFIX} --force --yes || true

# Alternative method using URN pattern
echo "🔍 Looking for remaining RDS resources..."
pulumi stack export | jq -r '.deployment.resources[].urn' | grep -i 'rds' | while read urn; do
    echo "  Removing: $urn"
    pulumi state delete "$urn" --force --yes || true
done

echo "🔄 Refreshing stack state..."
pulumi refresh --yes --non-interactive --skip-preview

echo "✅ State cleanup complete!"
echo "📊 Remaining resources in state:"
pulumi stack export | jq '.deployment.resources[].type' | sort | uniq -c

echo ""
echo "You can now run: pulumi up --yes"