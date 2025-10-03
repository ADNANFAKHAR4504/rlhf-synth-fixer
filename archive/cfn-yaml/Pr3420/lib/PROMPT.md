Create a serverless event-driven inventory processing system using AWS CloudFormation YAML templates to handle 2,000 daily inventory updates for a retail application.

Requirements:

1. S3 Bucket for inventory data uploads with event notifications
2. Lambda function using Python 3.10 runtime to process inventory updates
3. EventBridge rule to trigger Lambda function when S3 objects are uploaded
4. DynamoDB table to store processed inventory data with on-demand billing
5. CloudWatch custom metrics to track processing statistics
6. IAM roles with least privilege access for Lambda execution

The Lambda function should:
- Process inventory JSON files from S3
- Update inventory records in DynamoDB
- Log processing metrics to CloudWatch
- Handle errors gracefully with retry logic

Include EventBridge Scheduler for optional scheduled inventory reports and use EventBridge API destinations for webhook notifications when inventory processing completes.

Configure CloudWatch alarms for:
- Lambda errors exceeding threshold
- Processing duration anomalies
- DynamoDB throttling events

Ensure all resources follow AWS best practices for the us-east-1 region with proper tagging and cost optimization through on-demand pricing models.

Please provide the complete infrastructure code as CloudFormation YAML templates with one code block per file.