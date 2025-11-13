# Task: AWS CloudFormation

## Problem Statement
Create a CloudFormation template to deploy a serverless payment webhook processor.

MANDATORY REQUIREMENTS (Must complete):
1. Create two Lambda functions - one for Stripe webhooks and one for PayPal webhooks (CORE: Lambda)
2. Deploy a DynamoDB table named 'PaymentTransactions' with 'transactionId' as partition key (CORE: DynamoDB)
3. Configure Lambda execution roles with permissions to write to DynamoDB and CloudWatch Logs
4. Set up CloudWatch Log Groups for both Lambda functions with specified retention
5. Add Lambda environment variables for 'TABLE_NAME' and 'WEBHOOK_TYPE' (Stripe/PayPal)
6. Configure X-Ray tracing for both Lambda functions
7. Output the Lambda function ARNs and DynamoDB table name
8. Include stack deletion policy to retain DynamoDB data on stack deletion

OPTIONAL ENHANCEMENTS (If time permits):
• Add API Gateway REST API for webhook endpoints (OPTIONAL: API Gateway) - provides HTTP endpoints for testing
• Implement SQS queue between API Gateway and Lambda (OPTIONAL: SQS) - adds buffering and retry capability
• Add SNS topic for failed transaction notifications (OPTIONAL: SNS) - enables alerting on processing failures

Expected output: A complete CloudFormation YAML template that deploys the serverless webhook processing infrastructure with all mandatory components properly configured and integrated.

## Background
A fintech startup needs a serverless architecture to handle payment webhook events from multiple providers like Stripe and PayPal. The system must process webhooks reliably, store transaction data securely, and handle traffic spikes during peak shopping seasons.

## Environment
Serverless infrastructure deployed in us-east-1 region using Lambda functions for webhook processing and DynamoDB for transaction storage. The stack includes CloudWatch Logs for monitoring and X-Ray for distributed tracing. Deployment requires AWS CLI configured with appropriate credentials and CloudFormation deployment permissions. The architecture supports multiple payment providers with separate Lambda functions for each provider's webhook format. All components run within the AWS managed environment without VPC requirements.

## Constraints
Lambda functions must use Python 3.11 runtime with 512MB memory allocation
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- All Lambda functions must have X-Ray tracing active for debugging purposes
- CloudWatch Logs retention must be set to exactly 7 days for cost optimization
- Lambda functions must have a maximum timeout of 30 seconds
- DynamoDB tables must have deletion protection disabled for easy cleanup
- Lambda environment variables must not contain any hardcoded secrets
- All IAM roles must follow least privilege principle with no wildcard actions
