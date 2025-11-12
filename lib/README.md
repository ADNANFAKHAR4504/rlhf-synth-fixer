# EKS Fargate Infrastructure

This CDKTF Python implementation creates a complete AWS EKS cluster running exclusively on Fargate profiles with integrated AWS services for a fintech microservices platform.

## Architecture Overview

- **EKS Cluster**: Version 1.28 with private endpoint access and comprehensive logging
- **Fargate Profiles**: Separate profiles for production (m5.large) and development (t3.medium) workloads
- **Networking**: VPC across 3 AZs with private subnets and NAT gateways
- **Security**: KMS encryption, pod security standards, IRSA for fine-grained permissions
- **Monitoring**: CloudWatch logging enabled for all cluster components
- **OIDC Provider**: Configured for IAM Roles for Service Accounts (IRSA)

## Prerequisites

- Python 3.9+
- Terraform 1.5+
- AWS CLI configured with appropriate credentials
- kubectl 1.28+
- Node.js 18+ (for CDKTF)

## Installation

```bash
# Install dependencies
pipenv install

# Install CDKTF providers
cdktf get
```

## Deployment

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="ap-southeast-1"
export TERRAFORM_STATE_BUCKET="your-state-bucket"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"

# Synthesize Terraform configuration
pipenv run python tap.py

# Deploy infrastructure
cd cdktf.out/stacks/TapStackdev
terraform init
terraform plan
terraform apply
```

## Post-Deployment Configuration

### Configure kubectl

```bash
aws eks update-kubeconfig --name eks-cluster-${ENVIRONMENT_SUFFIX} --region ap-southeast-1
```

### Verify Fargate Profiles

```bash
kubectl get nodes
aws eks describe-fargate-profile --cluster-name eks-cluster-${ENVIRONMENT_SUFFIX} --fargate-profile-name fargate-prod-${ENVIRONMENT_SUFFIX}
aws eks describe-fargate-profile --cluster-name eks-cluster-${ENVIRONMENT_SUFFIX} --fargate-profile-name fargate-dev-${ENVIRONMENT_SUFFIX}
```

### Create Namespaces

```bash
kubectl create namespace production
kubectl create namespace development
```

### Label Namespaces for Pod Security Standards

```bash
# Production - Restricted
kubectl label namespace production pod-security.kubernetes.io/enforce=restricted
kubectl label namespace production pod-security.kubernetes.io/audit=restricted
kubectl label namespace production pod-security.kubernetes.io/warn=restricted

# Development - Baseline
kubectl label namespace development pod-security.kubernetes.io/enforce=baseline
kubectl label namespace development pod-security.kubernetes.io/audit=baseline
kubectl label namespace development pod-security.kubernetes.io/warn=baseline
```

## Resource Naming Convention

All resources use the `environmentSuffix` variable for unique naming:
- EKS Cluster: `eks-cluster-${environmentSuffix}`
- VPC: `eks-vpc-${environmentSuffix}`
- Fargate Profiles: `fargate-prod-${environmentSuffix}`, `fargate-dev-${environmentSuffix}`

## Pod Security Standards

- **Production namespace**: Restricted enforcement (highest security)
- **Development namespace**: Baseline enforcement (moderate security)

## Fargate Profile Configuration

### Production Profile
- Namespace: `production`
- Pod size: m5.large equivalent resources
- Execution role: Dedicated with enhanced permissions

### Development Profile
- Namespace: `development`
- Pod size: t3.medium equivalent resources
- Execution role: Standard permissions

## Network Architecture

- **VPC CIDR**: 10.0.0.0/16
- **Private Subnets**: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24 (Fargate pods)
- **Public Subnets**: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24 (NAT gateways)
- **NAT Gateways**: One per AZ for high availability

## Add-ons Installed

1. **VPC CNI**: Enhanced with security groups per pod
2. **CoreDNS**: Configured for Fargate with resource limits
3. **kube-proxy**: Standard configuration for Fargate

## Testing

```bash
# Run unit tests
pytest tests/unit/

# Run integration tests (requires deployed infrastructure)
pytest tests/integration/
```

## Cleanup

```bash
cd cdktf.out/stacks/TapStackdev
terraform destroy
```

## Troubleshooting

### Fargate Pods Not Starting

Check Fargate profile selectors and ensure namespace labels match:

```bash
aws eks describe-fargate-profile --cluster-name eks-cluster-${ENVIRONMENT_SUFFIX} --fargate-profile-name fargate-prod-${ENVIRONMENT_SUFFIX}
```

### CoreDNS Issues

Verify CoreDNS is running on Fargate:

```bash
kubectl get pods -n kube-system -l k8s-app=kube-dns -o wide
```

## Security Considerations

- KMS encryption enabled for EKS secrets
- Private endpoint access for cluster API
- Security groups per pod enabled via VPC CNI
- Pod security standards enforced at namespace level
- Least privilege IAM roles for all service accounts

## Cost Optimization

- Fargate pricing based on vCPU and memory consumption
- NAT gateways are primary cost driver (consider VPC endpoints for cost reduction)
- CloudWatch log retention set to 7 days
