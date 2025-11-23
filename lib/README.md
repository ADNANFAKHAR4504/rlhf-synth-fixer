# Production EKS Cluster with CDKTF Python

This implementation creates a production-ready Amazon EKS cluster using CDKTF with Python and LocalBackend for state management.

## Architecture

- EKS Cluster v1.28 in private subnets
- Two managed node groups (On-Demand and Spot)
- VPC CNI addon with prefix delegation
- OIDC provider for IAM roles for service accounts
- CloudWatch logging with 30-day retention
- All 5 control plane log types enabled

## Prerequisites

- Python 3.8+
- Node.js 16+
- CDKTF CLI: `npm install -g cdktf-cli`
- AWS CLI configured
- Terraform 1.0+

## Installation

1. Install Python dependencies:
```bash
pip install cdktf cdktf-cdktf-provider-aws constructs
```

2. Generate provider bindings:
```bash
cdktf get
```

## Deployment

1. Initialize CDKTF:
```bash
cdktf deploy
```

2. Confirm deployment when prompted

3. Configure kubectl:
```bash
aws eks update-kubeconfig --region us-east-1 --name eks-cluster-prod
```

## Outputs

- `cluster_endpoint`: EKS API server endpoint
- `cluster_name`: EKS cluster name
- `oidc_provider_arn`: OIDC provider ARN for IRSA
- `oidc_issuer_url`: OIDC issuer URL
- `kubectl_config_command`: Command to configure kubectl
- `on_demand_node_group_name`: On-Demand node group name
- `spot_node_group_name`: Spot node group name

## Cluster Autoscaler Configuration

Due to CDKTF Python limitations with nested list token access, the cluster autoscaler must be configured separately after cluster creation:

```bash
# Create IAM policy for cluster autoscaler
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  annotations:
    eks.amazonaws.com/role-arn: <ROLE_ARN_FROM_MANUAL_CREATION>
EOF

# Deploy cluster autoscaler
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml
```

## Node Groups

### On-Demand Node Group
- Min: 2 nodes
- Max: 5 nodes
- Desired: 2 nodes
- Instance type: t3.medium

### Spot Node Group
- Min: 3 nodes
- Max: 10 nodes
- Desired: 3 nodes
- Instance type: t3.medium

## VPC CNI Configuration

The VPC CNI addon is configured with:
- Prefix delegation enabled
- Warm prefix target: 1

This allows more pods per node for better resource utilization.

## Logging

All control plane logs are sent to CloudWatch:
- API server logs
- Audit logs
- Authenticator logs
- Controller manager logs
- Scheduler logs

Retention: 30 days

## Cleanup

```bash
cdktf destroy
```

## Known Limitations

1. **OIDC Provider Thumbprint**: Uses AWS standard thumbprint for EKS. This works for all AWS regions but is hardcoded due to CDKTF Python token access limitations.

2. **Cluster Autoscaler**: Cannot be fully automated in CDKTF Python due to nested list access issues with OIDC issuer parsing. Must be configured manually after cluster creation.

3. **Backend Configuration**: Uses LocalBackend for state management. For production, consider migrating to S3 backend after initial deployment.

## Resource Naming

All resources include the `environmentSuffix` parameter for uniqueness:
- EKS Cluster: `eks-cluster-{environmentSuffix}`
- Node Groups: `node-group-od-{environmentSuffix}`, `node-group-spot-{environmentSuffix}`
- IAM Roles: `eks-cluster-role-{environmentSuffix}`, `eks-node-role-{environmentSuffix}`
- Log Group: `/aws/eks/eks-cluster-{environmentSuffix}`

## Tags

All resources are tagged with:
- `Environment: Production`
- `ManagedBy: CDKTF`
