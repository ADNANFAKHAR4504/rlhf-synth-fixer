Build a serverless S3-to-Lambda trigger system using Pulumi and Python. When someone uploads a file to S3, it should automatically trigger a Lambda function to process it.

## What to build

Set up a complete Pulumi project with this structure:
- Root directory for Pulumi configuration
- lambda_code folder with main.py that logs S3 event details
- Main Pulumi script in tap.py or __main__.py
- requirements.txt for Lambda dependencies

## Resources needed

**S3 Bucket**
Create a bucket with versioning enabled in us-east-1. Name it something descriptive.

**Lambda Function**
- Runtime: Python 3.9 or later
- Handler should read from the lambda_code directory
- Needs an IAM role with specific permissions:
  - S3:GetObject and S3:GetObjectVersion for reading bucket objects
  - CloudWatch Logs permissions for writing logs
  - No wildcard permissions - scope everything to the specific bucket

**S3-to-Lambda Trigger**
This is the critical part - configure the S3 bucket to automatically invoke the Lambda whenever a new object is created. Use s3:ObjectCreated:* events to catch all object creation types.

## Configuration

Deploy everything to us-east-1. Configure Pulumi to use an S3 backend for state storage.

Export the bucket ARN and Lambda function ARN as stack outputs so they're easy to reference later.

## Deliverable

Provide all Python files and config needed to run pulumi up successfully. Include clear comments explaining how the S3 trigger connects to Lambda.