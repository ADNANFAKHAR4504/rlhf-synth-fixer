# Security Foundation Infrastructure

This CloudFormation template implements a comprehensive security-first infrastructure foundation for AWS, designed for financial services compliance and zero-trust principles.

## Architecture Overview

This solution creates:
- KMS customer-managed encryption key with automatic rotation
- Secrets Manager integration for database credentials with 30-day rotation
- IAM roles for cross-account access with external ID validation
- IAM policies enforcing S3 encryption and EC2 volume encryption
- Security auditor IAM group with CloudTrail and Config access
- Account-level IAM password policy with strong requirements

## Prerequisites

- AWS account with IAM permissions to create KMS keys, IAM resources, and Secrets Manager
- AWS CLI configured with appropriate credentials
- Target account ID (123456789012) for cross-account access
- External ID for security scanner role (minimum 32 characters)

## Deployment

### Using AWS CLI