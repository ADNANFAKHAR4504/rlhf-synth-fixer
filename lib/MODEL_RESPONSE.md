# Highly Secure AWS Infrastructure CloudFormation Template

## Overview
This CloudFormation template creates a highly secure AWS infrastructure that implements enterprise-grade security practices across networking, compute, storage, and access management components.

## Architecture Components

### 1. VPC & Networking Infrastructure
- **VPC**: Configurable CIDR block (default: 10.0.0.0/16) with DNS support enabled
- **Subnets**: 
  - 2 Public subnets (10.0.1.0/24, 10.0.2.0/24) across different AZs
  - 2 Private subnets (10.0.10.0/24, 10.0.20.0/24) across different AZs
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateways**: Dual NAT setup in public subnets for private subnet outbound access
- **Route Tables**: Separate routing for public and private subnets

### 2. Security & Encryption
- **KMS Key**: Customer-managed encryption key with automatic rotation
- **Key Policy**: Granular permissions for CloudFormation, EC2, S3, and Secrets Manager
- **Encryption**: Applied to EBS volumes, S3 bucket, and Secrets Manager

### 3. Compute Infrastructure
- **Launch Template**: Configured with Amazon Linux 2, encrypted EBS volumes
- **Auto Scaling Group**: Minimum 1, maximum 3 instances in private subnets
- **Security Group**: Conditional SSH access with configurable CIDR restrictions
- **Instance Profile**: IAM role with SSM access and resource-specific permissions

### 4. Storage & Data Management
- **S3 Bucket**: 
  - KMS encryption enabled
  - Public access completely blocked
  - Bucket policy restricting access to EC2 role only
  - Versioning enabled for data protection
- **Secrets Manager**: Database credentials with KMS encryption

### 5. IAM Security Framework
- **EC2 Instance Role**: 
  - SSM managed instance core policy for secure access
  - Scoped S3 access to specific bucket
  - KMS decrypt permissions for encrypted resources
  - Secrets Manager access to specific secret
- **Least Privilege**: All policies use resource-specific ARNs, no wildcards

## Key Security Features

### Network Security
- Private subnets with no direct internet access
- Outbound internet through NAT Gateways only
- Security groups with minimal ingress rules
- Conditional SSH access with restricted CIDR

### Data Protection
- Encryption at rest for all data stores
- Customer-managed KMS keys with rotation
- Secrets stored in AWS Secrets Manager
- S3 bucket with public access blocked

### Access Control
- Instance access through SSM Session Manager (no SSH keys required)
- IAM roles with resource-specific permissions
- No administrative privileges on instances

## Template Parameters
- Environment, Project, Owner for resource tagging
- Network CIDR blocks for VPC and subnets
- Instance type selection (t3.micro to t3.large)
- Optional SSH key pair configuration
- NAT Gateway enable/disable option

## Outputs
The template provides comprehensive outputs for integration and testing:
- VPC and subnet identifiers
- KMS key ID and ARN
- S3 bucket name
- Auto Scaling Group name
- IAM role ARNs
- Secrets Manager ARN
- Launch template and security group IDs

## Compliance & Best Practices
- Follows AWS Well-Architected Framework security pillar
- Implements defense in depth strategy
- Uses resource-specific IAM policies
- Enables comprehensive logging and monitoring capabilities
- Supports infrastructure as code deployment patterns