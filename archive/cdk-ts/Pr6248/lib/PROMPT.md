# Task Description

Create a CDK ts program to implement a serverless payment processing system. The configuration must: 1. Deploy an API Gateway REST API with /transactions POST endpoint that accepts JSON payloads with amount, currency, and card_token fields. 2. Create a Lambda function to validate transactions against business rules (amount < $10000, supported currencies: USD, EUR, GBP). 3. Store valid transactions in a DynamoDB table with partition key transaction_id and sort key timestamp. 4. Queue invalid transactions to an SQS queue for manual review with visibility timeout of 5 minutes. 5. Implement a second Lambda function triggered by the SQS queue to process review items. 6. Send SNS notifications for transactions over $5000 to a compliance topic. 7. Configure CloudWatch alarms for Lambda errors exceeding 1% error rate. 8. Set up API Gateway usage plan with 1000 requests per day limit and API key requirement. 9. Enable CloudWatch Logs for API Gateway with INFO level logging. 10. Add resource tags for Environment=production and CostCenter=payments. Expected output: A complete CDK ts application that synthesizes to CloudFormation templates defining all resources with proper IAM permissions, error handling, and monitoring. The stack should be deployable with 'cdk deploy' and include unit tests for Lambda functions.

## Scenario

A fintech startup needs to process credit card transactions in real-time, validate them against fraud patterns, and store results for compliance reporting. The system must handle variable load patterns with minimal operational overhead while maintaining PCI compliance standards.

## Requirements

Serverless infrastructure deployed in us-east-1 using API Gateway REST API, Lambda functions for business logic, DynamoDB for transaction storage, SQS for async processing, and SNS for notifications. Requires CDK 2.x with ts, Node.js 18+, AWS CLI configured. No VPC required - all services are AWS-managed. Parameter Store for configuration management, CloudWatch for monitoring and logging.

## Constraints

- Use Lambda functions with reserved concurrency of 100 for payment processing
- DynamoDB tables must use on-demand billing mode
- All Lambda functions must have X-Ray tracing enabled
- API Gateway must use request validation models for all endpoints
- Lambda functions must use environment variables from Parameter Store
- Dead letter queues must be configured for all asynchronous operations
- CloudWatch Logs retention must be set to 7 days for cost optimization
