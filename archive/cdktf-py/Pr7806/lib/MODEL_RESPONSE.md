# Serverless Fraud Detection Pipeline Implementation

## Overview

This implementation provides a comprehensive serverless fraud detection pipeline using **CDKTF with Python**. The solution processes transaction data through API Gateway, stores it in DynamoDB, analyzes it for fraud patterns using Lambda functions, and sends notifications for suspicious transactions via SNS.

## Architecture Components

1. **API Gateway REST API** - Receives transaction data via POST /transactions endpoint
2. **API Handler Lambda** - Validates and stores transactions in DynamoDB
3. **DynamoDB Table** - Stores transaction records with streams enabled
4. **Fraud Detection Lambda** - Analyzes transactions from DynamoDB streams (VPC-enabled)
5. **SQS Queue** - Queues suspicious transactions with dead letter queue (14-day retention)
6. **Notification Lambda** - Processes suspicious transactions and sends SNS alerts
7. **SNS Topic** - Delivers fraud alert notifications via email
8. **KMS Key** - Encrypts data at rest across all services
9. **VPC** - Provides secure networking for sensitive data processing Lambdas
10. **CloudWatch Logs** - Captures logs with 7-day retention
11. **X-Ray** - Provides distributed tracing

## Implementation

All infrastructure code is in `/var/www/turing/iac-test-automations/worktree/synth-79256968/lib/tap_stack.py`

Lambda function handlers are in `/var/www/turing/iac-test-automations/worktree/synth-79256968/lib/lambda/`:
- `api_handler.py` - API transaction handler
- `fraud_detection.py` - Fraud analysis engine
- `notification_handler.py` - SNS notification sender

## Deployment

1. Package Lambda functions: `cd lib/lambda && bash package_lambdas.sh`
2. Synthesize: `cdktf synth`
3. Deploy: `cdktf deploy`

## AWS Services

All required services implemented:
- KMS, VPC, EC2 (Subnets/SG), DynamoDB, Lambda (3 functions)
- API Gateway, SQS (main + DLQ), SNS, CloudWatch Logs, X-Ray, IAM

## Constraints Met

- DLQ: 14-day retention
- Lambda: Python 3.11, KMS-encrypted env vars, reserved concurrency 100
- VPC: Fraud detection Lambda in private subnets
- API Gateway: 1000 req/sec throttling
- DynamoDB: On-demand billing, streams enabled
- SQS: 6-minute visibility timeout
- All resources include environment_suffix
- All resources fully destroyable
- CloudWatch: 7-day retention
- X-Ray: Enabled on all Lambdas and API Gateway
- IAM: Least privilege, no wildcards