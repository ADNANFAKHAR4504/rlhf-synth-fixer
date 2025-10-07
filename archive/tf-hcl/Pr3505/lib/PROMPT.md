Create infrastructure code in Terraform HCL format for a webhook processing system deployed in us-east-2 region that handles 5,600 daily third-party notifications.

The infrastructure should include:

1. API Gateway REST API to receive webhook requests with POST endpoints
2. Lambda function using Node.js 20 runtime for webhook signature validation that retrieves secrets from Secrets Manager
3. SQS standard queue for reliable message processing with at-least-once delivery guarantee
4. Lambda function for routing logic that processes messages from SQS
5. DynamoDB table to store webhook logs with proper indexes for querying
6. EventBridge custom event bus for distributing processed events to downstream consumers
7. CloudWatch log groups for Lambda functions and API Gateway
8. CloudWatch metrics and alarms for monitoring webhook delivery success rates
9. Secrets Manager secret to store webhook validation secrets
10. Lambda dead letter queue for handling failed message processing
11. Required IAM roles and policies for all services with least privilege access

Requirements:
- Use Lambda Powertools for Node.js for enhanced logging and tracing
- Configure SQS visibility timeout to 6 times the Lambda timeout
- Enable X-Ray tracing for distributed tracing across services
- Set appropriate retention periods for CloudWatch logs (7 days)
- Configure DynamoDB with on-demand billing mode for cost optimization
- Use Lambda reserved concurrent executions to prevent throttling
- Include proper error handling with exponential backoff retry logic
- Tag all resources with Environment, Project, and ManagedBy tags

Generate complete infrastructure code with one code block per file including:
- variables.tf for input variables
- main.tf for core infrastructure
- lambda.tf for Lambda functions and related resources
- api_gateway.tf for API Gateway configuration
- dynamodb.tf for DynamoDB table
- sqs.tf for SQS queues
- eventbridge.tf for EventBridge resources
- monitoring.tf for CloudWatch resources
- iam.tf for IAM roles and policies
- outputs.tf for output values
- Lambda function code files for validation and routing