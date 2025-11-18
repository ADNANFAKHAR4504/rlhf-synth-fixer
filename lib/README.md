# Production-Ready EKS Cluster Infrastructure

This Pulumi TypeScript project creates a complete production-grade Amazon EKS cluster with advanced configuration for hosting microservices.

## Architecture

### Network Infrastructure
- **VPC**: Custom VPC with 3 public and 3 private subnets across availability zones
- **NAT Gateway**: Single NAT gateway for cost optimization
- **Subnets**: Properly tagged for EKS load balancer discovery

### EKS Cluster
- **Version**: Kubernetes 1.28+
- **Control Plane Logging**: All log types enabled (api, audit, authenticator, controllerManager, scheduler)
- **OIDC Provider**: Configured for IRSA (IAM Roles for Service Accounts)
- **Networking**: Private worker nodes with public API endpoint

### Node Groups
1. **General Workloads**: c7g.large Graviton3 on-demand instances (2-10 nodes)
2. **Batch Processing**: c7g.xlarge Graviton3 spot instances (2-10 nodes) with taint

### Add-ons and Controllers
- **AWS Load Balancer Controller**: IRSA-enabled ingress management
- **EBS CSI Driver**: For persistent volume support
- **Cluster Autoscaler**: Automatic node scaling based on pod demands
- **CloudWatch Container Insights**: Comprehensive cluster monitoring

### Security
- **Pod Security Standards**: Restricted enforcement level by default
- **Network Policies**: Namespace isolation with deny-all default
- **IRSA**: All service accounts use IAM roles for AWS API access
- **Private Nodes**: Worker nodes deployed in private subnets only

## Prerequisites

- Node.js 20+
- Pulumi CLI
- AWS CLI configured with appropriate credentials
- kubectl (for cluster interaction)

## Configuration

Set the environment suffix for resource naming:
