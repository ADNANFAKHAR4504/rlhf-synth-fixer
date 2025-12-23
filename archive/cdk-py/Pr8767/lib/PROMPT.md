Infrastructure Setup

We need to build a serverless backend that processes incoming data files. Here's what we need:

When files land in an S3 bucket, we want a Lambda function to automatically pick them up and process them. The Lambda should connect to CloudWatch to write logs for debugging and monitoring. We'll use environment variables to configure things like bucket names and processing options at runtime.

All the infrastructure should be defined using AWS CDK in Python. We're deploying this to us-east-1 and want proper error tracking through CloudWatch so we can see what's happening when things go wrong.

The flow should be: S3 bucket receives a file, this triggers the Lambda function, Lambda processes the data and writes status to CloudWatch, everything stays logged for auditing.

Key Requirements:

- S3 bucket configured to trigger Lambda on file uploads
- Lambda function that connects to S3 for reading objects
- CloudWatch Logs integration for all function output
- Environment variables for runtime configuration
- CDK infrastructure defined in Python
- Deployed to us-east-1
