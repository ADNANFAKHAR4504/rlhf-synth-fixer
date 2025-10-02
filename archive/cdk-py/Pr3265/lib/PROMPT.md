Create infrastructure code using AWS CDK in Python for a serverless file processing system that handles daily shipment updates for a logistics company.

The system should process 1,200 daily shipment update files uploaded to S3. When a file is uploaded, it should trigger a Lambda function to process the file and store metadata in DynamoDB. All processing metrics should be tracked in CloudWatch.

Requirements:

1. S3 bucket for receiving shipment update files with versioning enabled
2. Lambda function in Python 3.10 runtime for processing uploaded files with 256MB memory and 30 second timeout
3. Configure S3 event notifications to trigger Lambda when files are uploaded
4. DynamoDB table to store file metadata including filename, upload timestamp, processing status, and processing duration
5. CloudWatch log group for Lambda function with 7 day retention
6. CloudWatch metric for tracking successful and failed file processing
7. CloudWatch alarm that triggers if processing failure rate exceeds 5% over 5 minutes
8. IAM role for Lambda with permissions to read from S3, write to DynamoDB, and publish CloudWatch logs and metrics
9. Use Lambda SnapStart for Python to reduce cold start latency
10. Consider using S3 Express One Zone for improved performance if files need sub-second latency access

The infrastructure should be deployed to us-east-1 region. All resources should follow AWS security best practices with least privilege IAM policies. Lambda function should handle errors gracefully and log detailed information for debugging.

Provide the complete CDK stack implementation including the Lambda function code.