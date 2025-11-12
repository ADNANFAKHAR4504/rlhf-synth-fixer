# Infrastructure Refactoring and Optimization

This Terraform configuration provides a comprehensive refactoring of AWS infrastructure with modern best practices for variable management, resource lifecycle, tagging, and state management.

## Architecture Overview

This infrastructure includes:
- VPC with public and private subnets across multiple availability zones
- Application Load Balancer for traffic distribution
- EC2 instances managed through a reusable module
- RDS MySQL database with encryption and lifecycle protection
- S3 backend with DynamoDB state locking
- Comprehensive IAM roles with least privilege access
- Security groups with proper ingress/egress rules

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS Secrets Manager secret containing database credentials with keys: username and password

## Key Features

### 1. Variable Extraction
All hardcoded values are extracted into validated variables:
- Instance types, regions, CIDR blocks
- Validation rules for all inputs
- Clear descriptions for each variable

### 2. For_each Resource Management
All resources use for_each instead of count:
- Prevents resource recreation on list reordering
- Enables map-based resource management
- Safer infrastructure updates

### 3. Comprehensive Tagging
Consistent tags applied via locals.common_tags:
- Environment
- Project
- ManagedBy
- CostCenter
- Region

### 4. Lifecycle Management
- RDS instances: prevent_destroy = true
- ALB target groups: create_before_destroy = true
- EC2 instances: ignore_changes = [ami]

### 5. Dynamic AMI Lookup
Uses data.aws_ami to fetch latest Amazon Linux 2023 AMI automatically.

### 6. Reusable EC2 Module
Located in modules/ec2/ with:
- Flexible instance configuration
- Security group management
- IAM instance profile support
- Detailed monitoring options
- Encrypted root volumes
- IMDSv2 enforcement

### 7. Secure State Management
- S3 backend with encryption at rest using KMS
- DynamoDB table for state locking
- Versioning enabled on state bucket
- Public access blocked

### 8. Comprehensive Outputs
All critical resource IDs, endpoints, and ARNs exported for other teams.

## Deployment Instructions

### Initial Setup

1. Create the required AWS Secrets Manager secret: