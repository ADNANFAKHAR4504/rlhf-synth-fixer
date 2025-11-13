# EKS Fargate Cluster - Terraform Infrastructure

This Terraform configuration deploys a production-ready Amazon EKS cluster running entirely on AWS Fargate in the ap-southeast-1 region.

## Architecture Overview

- **EKS Cluster**: Version 1.28 with private endpoint access only
- **Compute**: AWS Fargate profiles (no EC2 node groups)
- **Networking**: VPC with 3 AZs, public and private subnets, NAT gateways
- **Security**: OIDC provider for IRSA, pod execution roles with minimal permissions
- **Monitoring**: CloudWatch Container Insights, control plane logging
- **Addons**: CoreDNS, kube-proxy, VPC CNI
- **Load Balancing**: AWS Load Balancer Controller with IRSA

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI v2
- kubectl 1.28+
- AWS credentials configured
- Appropriate IAM permissions

## Resource Naming

All resources follow the naming convention: `{resource-type}-{environment-suffix}`

The `environment_suffix` variable ensures unique resource names across deployments.

## Deployment Instructions

### 1. Initialize Terraform
