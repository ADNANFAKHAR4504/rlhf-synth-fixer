# Production EKS Cluster with Terraform

This Terraform configuration deploys a production-ready Amazon EKS cluster with advanced security and cost optimization features.

## Architecture

- **VPC**: 3 public and 3 private subnets across 3 availability zones
- **EKS Cluster**: Private API endpoint with Kubernetes 1.28+
- **Node Groups**: Mixed instance types (t3.medium, t3.large) with Spot instances
- **Security**: KMS encryption for secrets, IRSA for pod-level IAM permissions
- **Monitoring**: CloudWatch logs for all control plane components
- **Networking**: NAT gateways for private subnet outbound connectivity

## Prerequisites

- Terraform 1.5 or higher
- AWS CLI configured with appropriate permissions
- kubectl 1.28 or higher

## Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region for deployment | `us-east-1` |
| `environment_suffix` | Unique suffix for resource names | Required |
| `cluster_name` | Name of the EKS cluster | `microservices` |
| `kubernetes_version` | Kubernetes version | `1.28` |
| `vpc_cidr` | CIDR block for VPC | `10.0.0.0/16` |
| `node_group_min_size` | Minimum number of nodes | `2` |
| `node_group_max_size` | Maximum number of nodes | `10` |
| `node_group_desired_size` | Desired number of nodes | `3` |

## Deployment

1. Initialize Terraform:
