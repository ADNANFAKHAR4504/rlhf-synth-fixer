# PCI-DSS Compliant Secure Data Processing Pipeline

## Overview

I've created a comprehensive CloudFormation JSON template that implements a secure data processing pipeline for handling sensitive payment card data in compliance with PCI-DSS requirements.

## Implementation Summary

The template deploys a multi-layered security architecture with the following components:

### Network Architecture (Requirements 1, 4)

- **VPC** with 10.0.0.0/16 CIDR block spanning 3 availability zones
- **3 Private Subnets** (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) with no internet access
- **VPC Endpoints** for S3 (Gateway) and KMS (Interface) to keep traffic within AWS backbone
- **Route Table** associating all private subnets for internal routing

### Security Groups (Requirement 7)

- **Lambda Security Group**: Allows egress to KMS endpoint only on port 443
- **KMS Endpoint Security Group**: Allows ingress from Lambda on port 443
- No 0.0.0.0/0 egress rules, all traffic explicitly scoped to security groups

### Encryption & Key Management (Requirement 3)

- **Customer-Managed KMS Key** with comprehensive key policy
- Key policy grants access to Lambda, S3, and CloudWatch Logs services
- **KMS Key Alias**: alias/pci-data-key-${EnvironmentSuffix} for easy reference
- **S3 Bucket** with SSE-KMS encryption using customer-managed key
- Bucket policy enforces encryption and denies non-HTTPS traffic

### Data Processing (Requirement 2)

- **Lambda Function** with 1GB memory running in all 3 private subnets
- Node.js 16.x runtime with inline code for payment data validation
- Environment variables for bucket and KMS key access
- VPC configuration with no internet gateway access

### IAM Roles (Requirement 5)

- **Lambda Execution Role** with least privilege permissions
  - S3: GetObject, PutObject on data bucket only
  - KMS: Decrypt, Encrypt, GenerateDataKey on specific key only
  - VPC access via AWS managed policy
- **VPC Flow Logs Role** for CloudWatch Logs access
- **AWS Config Role** using correct managed policy (service-role/AWS_ConfigRole)

### Audit & Compliance (Requirements 6, 9)

- **VPC Flow Logs** capturing ALL traffic with 90-day retention
- **CloudWatch Logs** log group encrypted with KMS
- **PCI Tags** on all resources (DataClassification=PCI, ComplianceScope=Payment)
- **Resource naming** includes EnvironmentSuffix for uniqueness

### Optional Enhancements Implemented

- **SNS Topic** for security alerts encrypted with KMS
- **3 Config Rules**: encrypted-volumes, s3-bucket-ssl-requests-only, iam-password-policy
- **SSM Parameters** for centralized configuration management

### Data Protection (Requirement 10)

- **KMS Key DeletionPolicy**: Retain (protects encryption key)
- **S3 Data Bucket DeletionPolicy**: Retain (protects PCI data)
- **S3 Versioning** enabled with 90-day lifecycle policy
- **Public Access Block** on all buckets

## Resource Count

The template creates:

- 1 VPC with 3 private subnets across 3 AZs
- 2 VPC endpoints (S3 Gateway, KMS Interface)
- 2 security groups with explicit egress rules
- 1 customer-managed KMS key with alias
- 2 S3 buckets (data + config)
- 1 Lambda function (1GB memory)
- 3 IAM roles (Lambda, Flow Logs, Config)
- 1 VPC flow log with CloudWatch Logs
- 1 SNS topic for alerts
- 3 Config rules for compliance
- 2 SSM parameters
- 12 outputs for stack integration

Total: 31+ resources implementing all 10 mandatory requirements plus optional enhancements.

## Deployment Validation

The template follows all deployment requirements:

- EnvironmentSuffix parameter used in all named resources
- DeletionPolicy: Retain applied to KMS key and data bucket
- Security groups have explicit egress rules with no wildcards
- IAM roles follow least privilege (no wildcard actions)
- All resources properly tagged for PCI compliance
- AWS Config uses correct managed policy
- Lambda uses Node.js 16.x runtime
