I need to build a translation API service that handles 3,700 daily text translation requests across 15 language pairs. The infrastructure should be deployed in us-west-2 using Pulumi with Python.

Here are the requirements:

Set up an API Gateway REST API that will serve as the entry point for translation requests. The API should handle incoming requests and route them to the appropriate backend services.

Create a Lambda function using Python 3.10 runtime that integrates with AWS Translate service to perform the actual translations. The Lambda should have a concurrent execution limit of 100 to control costs and prevent throttling.

Implement a DynamoDB table to cache translation results. This will reduce costs by avoiding repeated calls to the Translate service for the same text. The table should use an appropriate partition key to efficiently lookup cached translations.

Set up an S3 bucket for handling document translations. When documents need to be translated, they should be stored in S3.

Configure an SQS queue for batch processing of large texts. Any translation request for documents over 5000 characters should be sent to this queue for asynchronous processing rather than being handled synchronously through the API.

Add CloudWatch monitoring to track API performance metrics such as request counts, latency, and error rates. Set up appropriate log groups for the Lambda function.

Create IAM roles and policies that follow the principle of least privilege. The Lambda function needs permissions to access Translate, DynamoDB, S3, SQS, and CloudWatch Logs. API Gateway needs permission to invoke the Lambda function.

Store configuration parameters in AWS Systems Manager Parameter Store such as the DynamoDB table name, S3 bucket name, and SQS queue URL. This allows for easier configuration management.

Use EventBridge to enable event-driven capabilities for monitoring translation workflows and triggering automated responses to specific events.

Include AWS AppSync Events to provide real-time updates on translation job status for client applications that need immediate notifications.

Make sure all resources are properly tagged and follow AWS best practices for security and cost optimization. The infrastructure should be production-ready and scalable to handle the current load of 3,700 daily requests.

Please provide the complete infrastructure code in separate files as needed. Each file should be in its own code block.