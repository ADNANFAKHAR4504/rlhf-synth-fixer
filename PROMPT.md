# Cryptocurrency Price Alert System - CloudFormation Template

## Background

A financial technology startup needs to process cryptocurrency price alerts in real-time. The system must handle thousands of price threshold checks per minute while maintaining strict latency requirements for alert notifications.

## Problem Statement

Create a CloudFormation template to deploy a serverless cryptocurrency price alert system.

## MANDATORY REQUIREMENTS (Must complete)

1. Create a DynamoDB table named 'PriceAlerts' with partition key 'userId' (String) and sort key 'alertId' (String) (CORE: DynamoDB)
2. Deploy a Lambda function 'ProcessPriceChecks' with Node.js 18 runtime on ARM architecture, 512MB memory (CORE: Lambda)
3. Configure the Lambda with 100 reserved concurrent executions
4. Create an SNS topic 'PriceAlertNotifications' with server-side encryption
5. Set up CloudWatch Logs group with 30-day retention for the Lambda function
6. Create a customer-managed KMS key for encrypting Lambda environment variables
7. Enable point-in-time recovery on the DynamoDB table
8. Implement IAM roles with explicit resource ARNs (no wildcards)
9. Add CloudFormation outputs for Lambda function ARN, DynamoDB table name, and SNS topic ARN
10. Tag all resources with 'Environment': 'Production' and 'Service': 'PriceAlerts'

## OPTIONAL ENHANCEMENTS (If time permits)

- Add SQS queue for buffering high-volume price updates (OPTIONAL: SQS) - improves reliability during traffic spikes
- Implement API Gateway for manual alert management (OPTIONAL: API Gateway) - enables user self-service
- Add EventBridge rule for scheduled price checks (OPTIONAL: EventBridge) - automates periodic monitoring

## Constraints

1. Lambda functions must have reserved concurrent executions set to prevent throttling
2. DynamoDB tables must use pay-per-request billing mode
3. All Lambda environment variables must be encrypted with customer-managed KMS keys
4. SNS topics must have server-side encryption enabled
5. Lambda functions must use ARM-based Graviton2 processors for cost optimization
6. CloudWatch Logs retention must be set to exactly 30 days
7. DynamoDB point-in-time recovery must be enabled
8. All IAM roles must follow least privilege with no wildcard resource permissions

## Environment

Production serverless infrastructure deployed in us-east-1 for cryptocurrency price alert processing. Core services include Lambda functions for price monitoring and alert processing, DynamoDB for storing user preferences and alert thresholds, SNS for multi-channel notifications. No VPC required as all services are AWS-managed. Lambda functions use Node.js 18 runtime on ARM architecture. Customer-managed KMS keys for encryption. CloudWatch Logs for monitoring with 30-day retention. Deployment via CloudFormation JSON templates with drift detection enabled.

## Expected Output

A complete CloudFormation JSON template that deploys the serverless price alert infrastructure with all security controls, proper IAM permissions, and monitoring configured. The stack should be production-ready with encryption, logging, and recovery mechanisms in place.
