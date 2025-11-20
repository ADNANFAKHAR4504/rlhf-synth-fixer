# Secure Financial Data Processing Pipeline - CloudFormation Template

This CloudFormation template deploys a comprehensive, production-ready secure data processing pipeline for financial transactions with enterprise-grade security, compliance, and monitoring capabilities.

## Architecture Overview

The infrastructure implements a multi-layered security approach:

- **Encryption Layer**: Customer-managed KMS key with automatic rotation
- **Network Layer**: Isolated VPC with private subnets across 3 AZs, no internet access
- **Storage Layer**: Encrypted S3 bucket with versioning and DynamoDB with point-in-time recovery
- **Compute Layer**: Lambda functions in VPC with encrypted environment variables
- **API Layer**: API Gateway with request validation and API key authentication
- **Secrets Layer**: Secrets Manager with automatic 30-day credential rotation
- **Monitoring Layer**: CloudWatch Logs with encryption and alarms for failures

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS account with permissions to create:
  - KMS keys
  - VPC resources (VPC, subnets, route tables, security groups, VPC endpoints)
  - S3 buckets
  - DynamoDB tables
  - Lambda functions
  - IAM roles and policies
  - API Gateway resources
  - Secrets Manager secrets
  - CloudWatch Logs and Alarms

## Deployment

### Quick Start
