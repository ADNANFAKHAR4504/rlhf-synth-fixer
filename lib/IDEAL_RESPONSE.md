# CloudFormation Template for PCI-DSS Compliant Secure Data Processing Infrastructure

This solution implements a secure data processing infrastructure for PCI-DSS compliant financial transaction processing using CloudFormation with JSON format.

## Architecture Overview

The infrastructure includes:
- VPC with 2 private subnets across different availability zones (no internet gateway)
- S3 bucket with KMS encryption, versioning, and lifecycle policies
- Lambda function deployed in VPC private subnets for data processing
- Customer-managed KMS keys for all encryption operations with automatic rotation
- VPC Flow Logs with 90-day retention and KMS encryption
- Security groups with explicit egress rules (no 0.0.0.0/0 CIDR blocks)
- IAM roles with least privilege permissions (no wildcard permissions)
- Comprehensive resource tagging (Environment, Owner, CostCenter)

## Key Security Features

### 1. Encryption at Rest
- Customer-managed KMS key with automatic rotation enabled (365-day rotation period)
- S3 bucket encrypted with KMS using bucket key optimization
- CloudWatch Logs encrypted with KMS (VPC Flow Logs and Lambda Logs)
- KMS key policy with proper CloudWatch Logs permissions including encryption context condition

### 2. Network Isolation
- VPC with private subnets only (no internet gateway)
- Lambda functions run in VPC private subnets across 2 availability zones
- Security group with explicit egress rules restricted to VPC CIDR (10.0.0.0/16)
- No 0.0.0.0/0 CIDR blocks in security group rules
- VPC Flow Logs enabled for all traffic monitoring

### 3. IAM Least Privilege
- Separate IAM roles for Lambda execution and VPC Flow Logs
- Specific S3 permissions limited to the data bucket (bucket ARN and bucket/*)
- Specific KMS permissions for decrypt and generate data key operations
- Specific CloudWatch Logs permissions scoped to exact log group ARN
- No wildcard (*) permissions in resource ARNs

### 4. Compliance Controls
- All resources tagged with Environment, Owner, and CostCenter
- VPC Flow Logs with 90-day retention and KMS encryption
- S3 versioning enabled
- S3 lifecycle policies for cost optimization (transition to IA at 30 days, Glacier at 90 days)
- Public access blocked on S3 bucket (all four settings enabled)
- No Retain deletion policies (all resources can be destroyed)

### 5. Operational Excellence
- Lambda error handling with proper exception catching
- CloudWatch Logs with 90-day retention
- Proper resource dependencies defined with DependsOn
- Parameterized template with EnvironmentSuffix for multi-environment support
- Comprehensive stack outputs for integration testing

## Critical Fix Applied

The original MODEL_RESPONSE had an incorrect KMS key policy for CloudWatch Logs that caused deployment failure. The IDEAL solution includes:

- Separate KMS key policy statement for CloudWatch Logs service principal
- Region-specific service principal format (logs.${AWS::Region}.amazonaws.com)
- Required encryption context condition for CloudWatch Logs
- Additional KMS actions required by CloudWatch Logs (Encrypt, ReEncrypt*, DescribeKey)

This fix ensures CloudWatch Logs can successfully encrypt log groups with the customer-managed KMS key.