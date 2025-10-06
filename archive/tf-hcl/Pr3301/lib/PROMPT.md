Create Terraform infrastructure code for a serverless order confirmation processing system that handles 1,000 daily orders asynchronously. The system must process orders reliably using message queuing, track processing status, and maintain audit logs.

Required AWS Services:

1. SQS Standard Queue for order confirmation messages with visibility timeout of 60 seconds, message retention of 4 days, and redrive policy for failed messages

2. Dead Letter Queue (DLQ) as standard SQS queue for failed messages with maximum receive count of 3 and 14 days retention

3. Lambda Function to process order confirmations using Python 3.10, 512 MB memory, 55 seconds timeout, environment variables for DynamoDB table name, reserved concurrent executions of 10, and event source mapping to SQS with batch size of 5

4. DynamoDB Table to track order processing status with partition key order_id (String), attributes for status, processed_at, and error_message, on-demand billing mode, point-in-time recovery enabled, and utilizing AWS SDK Paginators

5. CloudWatch for monitoring with log group for Lambda (7 days retention), metric alarm for DLQ exceeding 5 messages, and dashboard for queue depth and processing rate

6. IAM Roles with least privilege including Lambda execution role, SQS read/delete permissions, DynamoDB write permissions, and CloudWatch logs write permissions

Implementation Requirements:
- Deploy all resources in us-east-1 region
- Tag resources with Environment=Production and Service=OrderProcessing
- Lambda function must log all processing outcomes
- Include error handling for proper DLQ routing
- Configure SQS to Lambda event source mapping
- Enable CloudWatch Insights on Lambda logs

Provide complete Terraform HCL infrastructure code with one code block per file including variables.tf, main.tf, outputs.tf, and lambda_function.py with order processing logic.