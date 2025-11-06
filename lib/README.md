# Payment Processing Platform Infrastructure

This Terraform configuration provisions a complete multi-environment AWS infrastructure for a payment processing platform.

## Architecture Overview

The infrastructure includes:

- **Networking**: Separate VPCs for dev/prod with 3 availability zones
- **Compute**: Lambda functions for payment validation and transaction processing
- **Storage**: RDS Aurora PostgreSQL with encryption, S3 buckets with versioning
- **API**: API Gateway with throttling and WAF protection
- **Monitoring**: CloudWatch dashboards, alarms, and SNS alerts
- **Security**: KMS encryption, IAM least privilege, VPC endpoints

## Prerequisites

- Terraform 1.5 or higher
- AWS CLI configured with appropriate credentials
- An email address for SNS alert subscriptions

## Directory Structure
