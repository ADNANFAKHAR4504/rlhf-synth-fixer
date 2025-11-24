# EKS Cluster with Mixed Node Groups

This CloudFormation template deploys a production-grade Amazon EKS cluster with both managed and self-managed node groups, designed for financial services microservices requiring PCI compliance.

## Architecture

- **EKS Cluster**: Version 1.28 with private endpoint access only
- **Managed Node Group**: t3.large instances (2-6 nodes) with IMDSv2
- **Self-Managed Node Group**: m5.xlarge instances (1-4 nodes) with IMDSv2
- **VPC**: 10.0.0.0/16 CIDR with 3 private subnets across availability zones
- **High Availability**: NAT Gateway in each AZ
- **Security**: KMS encryption, CloudWatch logging, least privilege IAM roles
- **IRSA**: OIDC provider for IAM Roles for Service Accounts

## Parameters

- `EnvironmentSuffix`: Unique suffix for resource naming (default: prod)
- `VpcCidr`: CIDR block for VPC (default: 10.0.0.0/16)
- `EKSVersion`: EKS cluster version (default: 1.28)

## Deployment

### Prerequisites

1. AWS CLI 2.x configured with appropriate credentials
2. IAM permissions to create EKS, VPC, EC2, IAM, KMS resources
3. kubectl 1.28+ for cluster access

### Deploy Stack