# EKS Cluster Infrastructure with Auto Scaling for Microservices

This CloudFormation template deploys a production-ready Amazon EKS cluster with Auto Scaling node groups for hosting microservices workloads.

## Architecture Overview

The infrastructure includes:
- Amazon EKS cluster version 1.28 in private subnets across 3 availability zones
- Managed node group with 3-6 t3.medium instances using Auto Scaling
- KMS encryption for EKS secrets
- OIDC provider for IAM Roles for Service Accounts (IRSA)
- Security groups for pod communication (ports 443, 10250, 53)
- CloudWatch Logs for EKS control plane
- Least-privilege IAM roles

## File: lib/TapStack.json

Complete CloudFormation JSON template implementing all requirements.

The template has been generated and is located at `lib/TapStack.json`.

Key resources include:

1. **EksKmsKey**: KMS key for encrypting EKS secrets at rest with automatic key rotation
2. **EksClusterRole**: IAM role for EKS cluster with AmazonEKSClusterPolicy
3. **EksClusterSecurityGroup**: Security group for EKS control plane
4. **EksNodeSecurityGroup**: Security group for worker nodes with ingress rules for ports 443, 10250, and 53
5. **EksClusterLogGroup**: CloudWatch log group for EKS control plane logs
6. **EksCluster**: EKS cluster version 1.28+ with private endpoint, KMS encryption, and all logging enabled
7. **EksNodeRole**: IAM role for worker nodes with required AWS managed policies
8. **EksNodeGroup**: Managed node group with Auto Scaling (3-6 t3.medium instances) using Amazon Linux 2

## File: lib/README.md

Comprehensive documentation file is being created separately.

## Implementation Details

### Security Features

- **Private Cluster**: Endpoint is private-only, no public access
- **KMS Encryption**: All EKS secrets encrypted at rest with customer-managed KMS key
- **OIDC Provider**: Cluster exposes OpenIdConnectIssuerUrl for IRSA configuration
- **Security Groups**: Restricted ingress for ports 443 (HTTPS), 10250 (kubelet), and 53 (DNS)
- **Least Privilege IAM**: Uses AWS managed policies with no wildcard permissions

### Logging

All five EKS control plane log types enabled:
- api
- audit
- authenticator
- controllerManager
- scheduler

### Auto Scaling

- Minimum Size: 3 nodes
- Maximum Size: 6 nodes
- Desired Size: 3 nodes
- Instance Type: t3.medium
- AMI Type: Amazon Linux 2 (AL2_x86_64)

### Resource Naming

All resources include environmentSuffix parameter:
- EKS Cluster: `eks-cluster-{environmentSuffix}`
- Node Group: `eks-node-group-{environmentSuffix}`
- Security Groups: `eks-cluster-sg-{environmentSuffix}`, `eks-node-sg-{environmentSuffix}`
- IAM Roles: `eks-cluster-role-{environmentSuffix}`, `eks-node-role-{environmentSuffix}`
- KMS Key: `eks-kms-key-{environmentSuffix}`

### Deletion Policy

All resources have `DeletionPolicy: Delete` for clean teardown.

## Deployment

Deploy using AWS CLI:

```bash
aws cloudformation create-stack \
  --stack-name eks-microservices-dev \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxxxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-xxx,subnet-yyy,subnet-zzz" \
    ParameterKey=EksVersion,ParameterValue=1.28 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Outputs

The stack exports 12 outputs including:
- EksClusterName, EksClusterArn, EksClusterEndpoint
- EksClusterSecurityGroupId, EksNodeSecurityGroupId
- EksKmsKeyId, EksKmsKeyArn
- EksOidcIssuer (for IRSA configuration)
- EksNodeGroupName
- EksClusterRoleArn, EksNodeRoleArn
- EnvironmentSuffix

All outputs include environmentSuffix in export names for cross-stack references.
