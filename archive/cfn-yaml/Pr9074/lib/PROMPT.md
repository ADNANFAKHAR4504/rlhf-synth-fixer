Create a serverless API infrastructure using AWS CloudFormation with an API Gateway that invokes a Lambda function to process data and writes to S3 for storage.

Requirements:
- API Gateway HTTP API with CORS enabled that connects to Lambda
- Lambda function in Python 3.11 that receives data from API Gateway and writes processed data to S3
- S3 bucket with encryption enabled for storing Lambda outputs
- IAM role attached to Lambda allowing writes to S3
- Environment-based naming using CloudFormation parameters
- CloudFormation Outputs for API endpoint and resource ARNs

The Lambda receives JSON payloads from API Gateway, validates them, and stores results in the S3 bucket.