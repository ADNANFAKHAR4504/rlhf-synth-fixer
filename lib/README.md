# Secure Data Processing Infrastructure

This Terraform configuration deploys a comprehensive secure data processing infrastructure for financial services with PCI-DSS compliance.

## Architecture

### Network Security
- VPC with private subnets across 3 availability zones
- No public internet access (no IGW or NAT Gateway)
- VPC endpoints for S3 and DynamoDB
- Network ACLs blocking unauthorized ports (FTP, Telnet, RDP, SMB, NetBIOS)
- Security groups with least privilege access (HTTPS and PostgreSQL only)

### Data Security
- Customer-managed KMS encryption for S3 buckets
- S3 versioning and access logging enabled
- DynamoDB with encryption and point-in-time recovery
- Secrets Manager with 30-day automatic rotation

### Compute
- Lambda functions with VPC connectivity (private subnets only)
- IAM roles with least privilege and explicit deny policies
- CloudWatch Logs with 90-day retention and KMS encryption

### Threat Detection
- GuardDuty with S3 protection enabled
- EventBridge rules for HIGH severity findings
- SNS notifications for security alerts
- VPC Flow Logs for network monitoring

## Prerequisites

- Terraform 1.5 or later
- AWS CLI configured with appropriate credentials
- AWS account with administrative access
- Python 3.11 for Lambda functions

## Important Notes

### GuardDuty Limitation
GuardDuty is an account-level service. Only one detector can exist per AWS account per region. If you already have GuardDuty enabled in your account:

1. Option 1: Remove the `aws_guardduty_detector` resource from `monitoring.tf`
2. Option 2: Import the existing detector: `terraform import aws_guardduty_detector.main <detector-id>`
3. Option 3: Deploy GuardDuty separately at the account level

### Lambda Deployment Packages
Before deploying, create ZIP files for Lambda functions:
