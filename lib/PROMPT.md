I need infrastructure code to set up an event-driven system for a delivery app that processes 1,900 daily order updates. The system should be serverless and handle events triggered by order data uploads.

Requirements:
- Create an S3 bucket for order data uploads
- Set up a Lambda function using Python 3.11 runtime to process order updates
- Configure EventBridge to trigger the Lambda function when new files are uploaded to S3
- Create a DynamoDB table to store processed order data with order ID as the primary key
- Set up CloudWatch metrics to track processing performance
- Configure proper IAM roles and policies for secure access between services
- Enable EventBridge event source discovery for better visibility of event sources
- Implement CloudEvents support in EventBridge for standardized event formats

The Lambda function should:
- Read uploaded order files from S3
- Parse and validate order data
- Store processed orders in DynamoDB
- Log metrics to CloudWatch including processing time and success/failure counts

Please provide the complete infrastructure code as CloudFormation YAML templates, including the Lambda function code inline. Each file should be in a separate code block.