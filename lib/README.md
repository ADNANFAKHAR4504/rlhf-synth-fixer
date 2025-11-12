# EKS Payment Processing Platform

Production-ready Amazon EKS cluster for payment processing with GPU support, comprehensive security, and observability.

## Architecture Overview

This infrastructure creates:

- **EKS Cluster**: Kubernetes 1.28+ with IPv6 support across 3 availability zones
- **4 Node Groups**:
  - 2x General purpose (t3.large): min 2, max 10, desired 4 each
  - 1x Memory optimized (r5.xlarge): min 1, max 5, desired 2
  - 1x GPU enabled (g4dn.xlarge): min 1, max 3, desired 1
- **Security**: Private endpoints, KMS encryption, IRSA, pod security standards
- **Networking**: VPC with public/private subnets, AWS Load Balancer Controller
- **Observability**: Container Insights, CloudWatch dashboards, 30-day log retention
- **Automation**: Cluster autoscaler with proper tagging

## Prerequisites

- AWS CLI configured with appropriate credentials
- CDK CLI installed (`npm install -g aws-cdk`)
- Python 3.9+
- Docker (for Lambda functions if any)

## Deployment

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Bootstrap CDK (first time only)

```bash
cdk bootstrap aws://ACCOUNT-ID/ap-southeast-1
```

### 3. Deploy Infrastructure

```bash
# Deploy with custom environment suffix
cdk deploy --context environmentSuffix=prod

# Or use default 'dev'
cdk deploy
```

### 4. Configure kubectl

After deployment, configure kubectl to access the cluster:

```bash
aws eks update-kubeconfig --region ap-southeast-1 --name payment-eks-{environmentSuffix}
```

### 5. Verify Cluster

```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

## Configuration

### Environment Variables

- `CDK_DEFAULT_ACCOUNT`: AWS account ID (auto-detected)
- `CDK_DEFAULT_REGION`: AWS region (default: ap-southeast-1)

### Context Parameters

- `environmentSuffix`: Unique identifier for multi-environment deployments (default: dev)

## Features

### Security

- **Private Endpoint Access**: Control plane accessible only within VPC
- **KMS Encryption**: Automatic key rotation for secrets encryption
- **IRSA**: Pod-level IAM permissions via service accounts
- **Pod Security Standards**: Restricted baseline policy applied
- **OIDC Integration**: GitHub Actions authentication configured

### Service Accounts

Three pre-configured service accounts with appropriate IAM roles:

1. **cluster-autoscaler**: Manages node group scaling
2. **aws-load-balancer-controller**: Manages ALB/NLB resources
3. **external-secrets-operator**: Retrieves secrets from AWS Secrets Manager

### Node Groups

All node groups use **Bottlerocket AMI** for enhanced security:

- **general-a & general-b**: Standard workloads with high availability
- **memory-optimized**: Cache and database workloads
- **gpu-enabled**: ML inference and fraud detection (tainted for GPU-only pods)

### Monitoring

- **Container Insights**: Enabled for cluster-level metrics
- **CloudWatch Dashboards**: CPU, memory, and node health visualization
- **Audit Logs**: 30-day retention for compliance

### Autoscaling

Cluster autoscaler tags applied to all node groups:
- `k8s.io/cluster-autoscaler/enabled: true`
- `k8s.io/cluster-autoscaler/payment-eks-{environmentSuffix}: owned`

## Outputs

After deployment, the following values are available:

- **ClusterEndpoint**: EKS API server endpoint
- **OIDCIssuerURL**: For configuring external OIDC clients
- **ClusterName**: Full cluster name
- **KubectlConfigCommand**: Command to configure kubectl
- **ClusterSecurityGroupId**: For additional security rules
- **GitHubOIDCProviderArn**: For GitHub Actions workflows
- **VPCId**: For network integrations
- **KMSKeyArn**: For encryption operations

## Testing

Integration tests validate:
- Cluster creation and accessibility
- Node group configurations
- IRSA setup
- Load balancer controller installation
- CloudWatch metrics and dashboards

Run tests:

```bash
pytest tests/integration/ -v
```

## Cleanup

To avoid charges, destroy the infrastructure:

```bash
cdk destroy --context environmentSuffix={your-suffix}
```

## Cost Optimization

- Uses Bottlerocket (lighter than standard AMIs)
- Autoscaling prevents over-provisioning
- GPU nodes tainted to prevent unnecessary usage
- CloudWatch logs retained for only 30 days

## Troubleshooting

### kubectl access denied

Ensure your IAM user/role is mapped in the cluster:

```bash
kubectl edit configmap aws-auth -n kube-system
```

### Node group not scaling

Verify autoscaler tags and IRSA permissions:

```bash
kubectl logs -n kube-system -l app=cluster-autoscaler
```

### Load balancer not creating

Check ALB controller logs:

```bash
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
```

## Support

For issues or questions, refer to:
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [CDK Python Reference](https://docs.aws.amazon.com/cdk/api/v2/python/)
- [Bottlerocket Documentation](https://bottlerocket.dev/)
