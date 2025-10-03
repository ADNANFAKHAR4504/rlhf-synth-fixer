Build an event-driven inventory processing system for a retail application that handles 2,000 daily inventory updates using AWS serverless services.

Requirements:
- Create an S3 bucket to receive inventory update files
- Implement a Lambda function (Python 3.10) to process inventory updates when files are uploaded to S3
- Set up EventBridge rules to trigger the Lambda function on S3 uploads
- Configure a DynamoDB table to store inventory data with appropriate partition and sort keys
- Enable CloudWatch metrics and logging for monitoring Lambda execution and processing times
- Configure IAM roles with least privilege access for all services
- Use EventBridge Scheduler to create a daily summary report at 11 PM EST
- Implement CloudEvents support in EventBridge for standard event formatting

Technical specifications:
- Lambda function should parse CSV inventory files and update DynamoDB
- DynamoDB table should have on-demand billing mode for cost optimization
- Lambda function should have 512 MB memory and 60 second timeout
- Enable X-Ray tracing on Lambda for performance monitoring
- Configure CloudWatch alarms for Lambda errors exceeding 1% error rate
- Set up Dead Letter Queue for failed processing attempts
- Lambda should log processing metrics including file size, record count, and processing duration

Generate complete infrastructure code using Pulumi with Python including all resources, IAM policies, Lambda function code, and monitoring configuration. Provide each file in a separate code block.