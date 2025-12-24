# EKS Cluster Terraform Infrastructure

This Terraform configuration deploys a production-ready Amazon EKS cluster with advanced security, networking, and operational features.

## Architecture Overview

The infrastructure includes:

- **EKS Cluster**: Version 1.28 with private endpoint access only
- **Three Managed Node Groups**:
  - System nodes (t3.medium) - for system workloads
  - Application nodes (m5.large) - for application workloads
  - Spot instances (m5.large) - for cost-optimized batch workloads
- **Network Segmentation**: Dedicated subnets for each node group type
- **Security**: KMS encryption for secrets, IMDSv2 enforcement, private endpoints
- **IRSA**: IAM Roles for Service Accounts with OIDC provider
- **EKS Addons**: EBS CSI driver, VPC CNI, CoreDNS, Kube Proxy
- **Autoscaling**: Cluster Autoscaler support with proper IAM permissions
- **Load Balancing**: AWS Load Balancer Controller IAM role configured

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.5.0
3. kubectl (for cluster access after deployment)
4. S3 bucket for Terraform state (update backend.tf)
5. DynamoDB table for state locking (update backend.tf)

## File Structure
