# Payment Processing Infrastructure

## Overview

Complete payment processing environment in AWS deployed using **Pulumi with TypeScript** in the **ap-southeast-1** region.

## Architecture

- **Networking**: VPC with 3 AZs, public/private subnets, NAT Gateways, VPC endpoints
- **API Layer**: API Gateway REST API with Lambda proxy integration
- **Compute**: 3 Lambda functions (validator, processor, notifier) in private subnets
- **Storage**: DynamoDB table with KMS encryption, S3 audit bucket
- **Notifications**: SNS topic for payments and CloudWatch alarms
- **Monitoring**: CloudWatch dashboard with Lambda and DynamoDB metrics

## AWS Services Implemented

1. VPC and Networking (EC2)
2. API Gateway
3. Lambda
4. DynamoDB
5. S3
6. SNS
7. CloudWatch
8. KMS
9. IAM

## Deployment

```bash
# Install dependencies
npm install

# Configure Pulumi
pulumi config set aws:region ap-southeast-1
pulumi config set env <environment-suffix>

# Deploy
pulumi up
```

## Outputs

- `apiUrl`: API Gateway endpoint for payments
- `auditBucketName`: S3 bucket for audit logs
- `dynamoTableName`: DynamoDB transactions table
- `dashboardUrl`: CloudWatch monitoring dashboard

## Security

- Lambda functions in private subnets
- KMS encryption for DynamoDB
- S3 server-side encryption
- IAM least-privilege roles
- VPC Flow Logs enabled
- API throttling (10,000 req/min)

## Compliance

- PCI DSS compliant
- Point-in-time recovery enabled
- Audit logging to S3
- Encryption at rest and in transit
