# Serverless Fraud Detection Pipeline - CDKTF Python Implementation

## Summary

Comprehensive serverless fraud detection pipeline implemented using **CDKTF with Python** for AWS. The system processes transactions through API Gateway, stores them in DynamoDB, analyzes for fraud patterns via Lambda, queues suspicious transactions in SQS, and sends email alerts via SNS.

## AWS Services Deployed

1. **KMS** - Customer-managed key with automatic rotation
2. **VPC** - 10.0.0.0/16 CIDR with 2 private subnets
3. **EC2** - Security groups for Lambda functions
4. **DynamoDB** - transactions table (on-demand, streams enabled)
5. **Lambda** - 3 functions: api-handler, fraud-detection (VPC), notification-handler
6. **API Gateway** - REST API with /transactions POST endpoint
7. **SQS** - Main queue (6-min visibility) + DLQ (14-day retention)
8. **SNS** - Fraud alerts topic with email subscription
9. **CloudWatch Logs** - 7-day retention for all Lambda functions
10. **X-Ray** - Distributed tracing on all Lambdas and API Gateway
11. **IAM** - Least privilege roles for each Lambda function

## Key Features

- Transaction validation and storage via REST API
- Real-time fraud detection using DynamoDB streams
- Multi-rule fraud detection: high-value, suspicious merchant, pattern analysis, location-based
- Risk scoring (0-100) for all suspicious transactions
- Automated email notifications for fraud alerts
- Complete encryption at rest using KMS
- VPC isolation for sensitive data processing
- API throttling at 1000 requests/second
- Reserved concurrency of 100 for all Lambda functions

## Compliance

All mandatory constraints met:
- Python 3.11 runtime
- KMS-encrypted environment variables
- IAM least privilege (no wildcards)
- VPC for sensitive Lambdas
- 14-day DLQ retention
- 6-minute SQS visibility timeout
- 7-day CloudWatch log retention
- X-Ray tracing enabled
- environment_suffix in all resource names
- All resources fully destroyable

## Testing

Comprehensive test coverage:
- Unit tests for all Lambda functions
- Unit tests for infrastructure stack
- Integration tests for end-to-end transaction flow
- All tests passing