# Amazon EKS Cluster Deployment with Enhanced Security

## Overview

Create infrastructure using **CloudFormation with YAML** to deploy a production-ready Amazon EKS cluster with enhanced security controls and comprehensive monitoring capabilities.

## Business Context

Your organization is expanding its microservices architecture and needs a managed Kubernetes cluster on AWS. The platform team requires a standardized EKS deployment that can be replicated across multiple AWS accounts with consistent security and networking configurations.

## Infrastructure Requirements

### 1. EKS Cluster Configuration
- Create an EKS cluster with Kubernetes version 1.28 or higher
- Configure private endpoint access only for enhanced security
- Set up OIDC identity provider for IAM Roles for Service Accounts (IRSA)
- Enable envelope encryption for Kubernetes secrets using AWS KMS

### 2. KMS Encryption
- Create a dedicated KMS key for envelope encryption of Kubernetes secrets
- Configure appropriate key policies for EKS cluster access
- Enable key rotation for security compliance

### 3. Managed Node Group
- Deploy a managed node group using only Graviton2 instance types (ARM64 architecture)
- Use t4g.medium as the default instance type for cost optimization
- Configure auto-scaling with minimum 2 and maximum 10 nodes
- Deploy all worker nodes in private subnets only with no direct internet access
- Ensure nodes have appropriate IAM roles with least-privilege policies

### 4. IRSA (IAM Roles for Service Accounts)
- Set up OIDC identity provider for the EKS cluster
- Enable pod-level AWS permissions through IRSA
- Configure trust relationships for Kubernetes service accounts

### 5. Monitoring and Observability
- Enable CloudWatch Container Insights for comprehensive cluster monitoring
- Configure appropriate CloudWatch log groups for EKS cluster logs
- Set up metrics collection for nodes and pods

### 6. IAM Roles and Policies
- Create EKS cluster IAM role with least-privilege policies
- Create node group IAM role with necessary permissions
- Ensure roles follow AWS security best practices

### 7. Networking
- Create VPC with CIDR 10.0.0.0/16
- Create 3 public subnets and 3 private subnets across different availability zones
- Deploy Internet Gateway for public subnet connectivity
- Deploy NAT Gateway in public subnet for private subnet egress
- All worker nodes must be deployed in private subnets only
- Configure appropriate route tables and security groups for cluster and node communication

## Technical Constraints

- EKS cluster must use Kubernetes version 1.28 or higher
- Worker nodes must use only Graviton2 (ARM64) instances for cost optimization
- Enable IRSA (IAM Roles for Service Accounts) for pod-level AWS permissions
- Configure OIDC provider for the EKS cluster
- Use only private subnets for worker nodes with no direct internet access
- Enable EKS managed node groups with auto-scaling between 2-10 nodes
- Configure CloudWatch Container Insights for cluster monitoring
- Implement envelope encryption for Kubernetes secrets using AWS KMS
- Set cluster endpoint access to private-only for enhanced security

## Environment

Production-grade EKS cluster deployment in eu-central-1 region using CloudFormation YAML. Creates complete VPC infrastructure with public and private subnets across 3 availability zones. AWS CLI must be configured with appropriate permissions for EKS, EC2, IAM, VPC, and KMS services. The infrastructure includes VPC with IGW and NAT Gateway, EKS control plane, managed node groups with Graviton2 instances, OIDC provider for IRSA, KMS key for secrets encryption, and CloudWatch Container Insights for monitoring. All worker nodes deployed within private subnets with egress through NAT gateways.

## Expected Deliverables

1. Complete CloudFormation YAML template (lib/TapStack.yml) that provisions:
   - VPC with public and private subnets across 3 availability zones
   - Internet Gateway and NAT Gateway for connectivity
   - Amazon EKS cluster with private endpoint access
   - KMS key for secrets encryption
   - OIDC identity provider
   - Managed node group with Graviton2 instances
   - Auto-scaling configuration
   - CloudWatch Container Insights
   - All necessary IAM roles, policies, and security groups

2. CloudFormation Parameters:
   - EnvironmentSuffix (for resource naming)
   - Kubernetes version (default: 1.28)
   - Node instance type (default: t4g.medium)
   - Min/Max/Desired node counts for auto-scaling

3. CloudFormation Outputs:
   - EKS cluster endpoint
   - OIDC issuer URL
   - Node group ARN
   - Cluster name
   - KMS key ID

4. Unit tests verifying:
   - EKS cluster is created with correct configuration
   - KMS encryption is enabled
   - OIDC provider is configured
   - Node group uses Graviton2 instances
   - CloudWatch Container Insights is enabled
   - All resources use EnvironmentSuffix for naming

5. Integration tests validating:
   - EKS cluster is accessible and healthy
   - Node group has expected capacity
   - CloudWatch logs are being collected
   - OIDC provider is properly configured

## AWS Services Required

- Amazon EKS (Elastic Kubernetes Service)
- Amazon EC2 (for node groups)
- AWS IAM (Identity and Access Management)
- AWS KMS (Key Management Service)
- Amazon CloudWatch (Container Insights and logging)
- Amazon VPC (Virtual Private Cloud)

## Success Criteria

- All CloudFormation resources deploy successfully
- EKS cluster is accessible via private endpoint
- Node group auto-scales between 2-10 nodes
- CloudWatch Container Insights shows cluster metrics
- All security controls are properly configured
- Unit tests achieve 90%+ code coverage
- Integration tests pass successfully
- Infrastructure follows AWS Well-Architected Framework best practices
