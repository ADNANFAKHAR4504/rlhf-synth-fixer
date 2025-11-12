# Payment Processing Infrastructure

Complete Pulumi TypeScript implementation for payment processing infrastructure in AWS Ohio (us-east-2).

## Architecture Overview

This infrastructure implements a production-ready payment processing system with:

- **Network Layer**: VPC across 3 availability zones with public/private subnets, NAT gateways, VPC endpoints
- **API Layer**: API Gateway REST API with throttling and Lambda integration
- **Compute Layer**: Three Lambda functions (validator, processor, notifier)
- **Data Layer**: DynamoDB table with point-in-time recovery, S3 bucket with versioning
- **Monitoring Layer**: CloudWatch logs, dashboard, alarms, and SNS notifications
- **Security**: KMS encryption, VPC isolation, IAM least-privilege policies

## Components

### NetworkingStack
- VPC with CIDR 10.0.0.0/16
- 3 public subnets, 3 private subnets across 3 AZs
- NAT Gateways in each AZ
- VPC endpoints for S3 and DynamoDB
- VPC Flow Logs
- Transit Gateway for multi-region connectivity

### DataStack
- DynamoDB table: transactions-{environmentSuffix}
- S3 bucket: payment-audit-logs-{environmentSuffix}
- KMS key for backup encryption

### ComputeStack
- payment-validator: Input validation and fraud checks
- payment-processor: Transaction processing and storage
- payment-notifier: Stakeholder notifications

### ApiGatewayStack
- REST API with /payments endpoint
- Request throttling: 10,000 requests per minute
- Lambda proxy integration

### MonitoringStack
- CloudWatch Log Groups (7-day retention)
- CloudWatch Dashboard with key metrics
- CloudWatch Alarms (>1% error rate triggers SNS)
- SNS topic with email subscription

## Prerequisites

- Node.js 18+
- Pulumi CLI 3.x
- AWS CLI v2 configured
- AWS credentials with appropriate permissions

## Deployment