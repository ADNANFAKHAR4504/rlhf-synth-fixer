Create Terraform infrastructure code for an asynchronous quiz processing system in AWS us-west-1 region.

The e-learning platform needs to process 1,500 daily quiz submissions. Build a serverless architecture that includes:

1. An SQS FIFO queue named "quiz-submissions.fifo" for ordered processing with content-based deduplication enabled
2. A Dead Letter Queue (DLQ) for failed quiz submissions with maximum receive count of 3
3. A Lambda function in Python 3.11 runtime for quiz scoring that processes messages from the SQS queue
4. DynamoDB table named "quiz-results" with student_id as partition key and submission_timestamp as sort key
5. CloudWatch alarm for monitoring queue depth that triggers when messages exceed 100
6. IAM roles with minimal permissions following least privilege principle

Include AWS EventBridge Scheduler for periodic queue health checks every 5 minutes. Use AWS X-Ray tracing for distributed debugging capabilities.

Generate complete Terraform configuration files including:
- main.tf with all resources
- variables.tf with configurable parameters
- outputs.tf with important resource ARNs and URLs
- Lambda function code in Python for quiz processing logic

Ensure the Lambda function has environment variables for DynamoDB table name and includes error handling for failed submissions. Set Lambda timeout to 60 seconds and memory to 512 MB.

Provide the infrastructure code in separate code blocks for each file.