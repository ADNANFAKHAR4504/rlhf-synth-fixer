#!/bin/bash
#
# Integration tests for EKS cluster deployment
# Validates that the deployed infrastructure meets all requirements
#

set -e

# Configuration
CLUSTER_NAME="eks-cluster-synthar3eg"
REGION="us-east-2"
NODE_GROUP_NAME="node-group-synthar3eg"

echo "==================================================================="
echo "Running Integration Tests for EKS Cluster: $CLUSTER_NAME"
echo "==================================================================="
echo ""

# Test 1: EKS Cluster Status
echo "[TEST 1] Validating EKS cluster is ACTIVE..."
CLUSTER_STATUS=$(aws eks describe-cluster --name "$CLUSTER_NAME" --region "$REGION" --query 'cluster.status' --output text)
if [ "$CLUSTER_STATUS" = "ACTIVE" ]; then
    echo "✅ PASS: EKS cluster is ACTIVE"
else
    echo "❌ FAIL: EKS cluster status is $CLUSTER_STATUS (expected ACTIVE)"
    exit 1
fi

# Test 2: Kubernetes Version
echo "[TEST 2] Validating Kubernetes version is 1.28..."
K8S_VERSION=$(aws eks describe-cluster --name "$CLUSTER_NAME" --region "$REGION" --query 'cluster.version' --output text)
if [ "$K8S_VERSION" = "1.28" ]; then
    echo "✅ PASS: Kubernetes version is 1.28"
else
    echo "❌ FAIL: Kubernetes version is $K8S_VERSION (expected 1.28)"
    exit 1
fi

# Test 3: Node Group Status and Configuration
echo "[TEST 3] Validating node group is ACTIVE with correct configuration..."
NODE_GROUP_INFO=$(aws eks describe-nodegroup --cluster-name "$CLUSTER_NAME" --nodegroup-name "$NODE_GROUP_NAME" --region "$REGION")
NODE_STATUS=$(echo "$NODE_GROUP_INFO" | jq -r '.nodegroup.status')
INSTANCE_TYPE=$(echo "$NODE_GROUP_INFO" | jq -r '.nodegroup.instanceTypes[0]')
MIN_SIZE=$(echo "$NODE_GROUP_INFO" | jq -r '.nodegroup.scalingConfig.minSize')
MAX_SIZE=$(echo "$NODE_GROUP_INFO" | jq -r '.nodegroup.scalingConfig.maxSize')

if [ "$NODE_STATUS" = "ACTIVE" ] && [ "$INSTANCE_TYPE" = "t4g.medium" ] && [ "$MIN_SIZE" = "3" ] && [ "$MAX_SIZE" = "15" ]; then
    echo "✅ PASS: Node group is ACTIVE with t4g.medium instances, min=3, max=15"
else
    echo "❌ FAIL: Node group configuration incorrect"
    echo "   Status: $NODE_STATUS (expected ACTIVE)"
    echo "   Instance Type: $INSTANCE_TYPE (expected t4g.medium)"
    echo "   Min Size: $MIN_SIZE (expected 3)"
    echo "   Max Size: $MAX_SIZE (expected 15)"
    exit 1
fi

# Test 4: VPC Configuration
echo "[TEST 4] Validating VPC configuration (public and private access)..."
VPC_CONFIG=$(aws eks describe-cluster --name "$CLUSTER_NAME" --region "$REGION" --query 'cluster.resourcesVpcConfig')
PUBLIC_ACCESS=$(echo "$VPC_CONFIG" | jq -r '.endpointPublicAccess')
PRIVATE_ACCESS=$(echo "$VPC_CONFIG" | jq -r '.endpointPrivateAccess')

if [ "$PUBLIC_ACCESS" = "true" ] && [ "$PRIVATE_ACCESS" = "true" ]; then
    echo "✅ PASS: Cluster has both public and private endpoint access enabled"
else
    echo "❌ FAIL: Endpoint access configuration incorrect"
    echo "   Public Access: $PUBLIC_ACCESS (expected true)"
    echo "   Private Access: $PRIVATE_ACCESS (expected true)"
    exit 1
fi

# Test 5: Control Plane Logging
echo "[TEST 5] Validating control plane logging is enabled..."
LOGGING=$(aws eks describe-cluster --name "$CLUSTER_NAME" --region "$REGION" --query 'cluster.logging.clusterLogging[0]')
API_ENABLED=$(echo "$LOGGING" | jq -r '.types | contains(["api"])')
AUDIT_ENABLED=$(echo "$LOGGING" | jq -r '.types | contains(["audit"])')

if [ "$API_ENABLED" = "true" ] && [ "$AUDIT_ENABLED" = "true" ]; then
    echo "✅ PASS: API and Audit logging are enabled"
else
    echo "❌ FAIL: Control plane logging not properly configured"
    exit 1
fi

# Test 6: EKS Encryption
echo "[TEST 6] Validating cluster encryption is enabled..."
ENCRYPTION=$(aws eks describe-cluster --name "$CLUSTER_NAME" --region "$REGION" --query 'cluster.encryptionConfig[0]')
if [ -n "$ENCRYPTION" ] && [ "$ENCRYPTION" != "null" ]; then
    echo "✅ PASS: Cluster encryption is configured"
else
    echo "❌ FAIL: Cluster encryption is not configured"
    exit 1
fi

# Test 7: EKS Add-ons
echo "[TEST 7] Validating EKS add-ons are installed..."
ADDONS=$(aws eks list-addons --cluster-name "$CLUSTER_NAME" --region "$REGION" --query 'addons' --output json)
VPC_CNI=$(echo "$ADDONS" | jq -r '. | contains(["vpc-cni"])')
COREDNS=$(echo "$ADDONS" | jq -r '. | contains(["coredns"])')
KUBE_PROXY=$(echo "$ADDONS" | jq -r '. | contains(["kube-proxy"])')

if [ "$VPC_CNI" = "true" ] && [ "$COREDNS" = "true" ] && [ "$KUBE_PROXY" = "true" ]; then
    echo "✅ PASS: All required add-ons are installed (vpc-cni, coredns, kube-proxy)"
else
    echo "❌ FAIL: Missing required add-ons"
    exit 1
fi

# Test 8: OIDC Provider
echo "[TEST 8] Validating OIDC provider is configured..."
OIDC_URL=$(aws eks describe-cluster --name "$CLUSTER_NAME" --region "$REGION" --query 'cluster.identity.oidc.issuer' --output text)
if [ -n "$OIDC_URL" ] && [ "$OIDC_URL" != "None" ]; then
    echo "✅ PASS: OIDC provider is configured"
else
    echo "❌ FAIL: OIDC provider is not configured"
    exit 1
fi

# Test 9: Node Health
echo "[TEST 9] Validating node group has no health issues..."
HEALTH_ISSUES=$(aws eks describe-nodegroup --cluster-name "$CLUSTER_NAME" --nodegroup-name "$NODE_GROUP_NAME" --region "$REGION" --query 'nodegroup.health.issues' --output json)
if [ "$HEALTH_ISSUES" = "[]" ]; then
    echo "✅ PASS: Node group has no health issues"
else
    echo "❌ FAIL: Node group has health issues: $HEALTH_ISSUES"
    exit 1
fi

# Test 10: kubectl Connectivity (optional - requires kubeconfig)
echo "[TEST 10] Testing kubectl connectivity..."
if aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION" --kubeconfig /tmp/kubeconfig-test >/dev/null 2>&1; then
    NODE_COUNT=$(kubectl --kubeconfig /tmp/kubeconfig-test get nodes --no-headers 2>/dev/null | wc -l | tr -d ' ')
    if [ "$NODE_COUNT" -ge "3" ]; then
        echo "✅ PASS: kubectl can connect to cluster and see $NODE_COUNT nodes"
    else
        echo "⚠️  WARN: kubectl connected but only see $NODE_COUNT nodes (expected >= 3)"
    fi
    rm -f /tmp/kubeconfig-test
else
    echo "⚠️  WARN: Could not test kubectl connectivity (kubeconfig setup may be required)"
fi

echo ""
echo "==================================================================="
echo "All Integration Tests Passed! ✅"
echo "==================================================================="
echo ""
echo "Deployment Summary:"
echo "- Cluster: $CLUSTER_NAME (Kubernetes 1.28)"
echo "- Node Group: $NODE_GROUP_NAME (3-15 t4g.medium instances)"
echo "- Region: $REGION"
echo "- Status: All systems operational"
echo ""
