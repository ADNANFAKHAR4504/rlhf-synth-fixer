Create a serverless API infrastructure using AWS CloudFormation that includes an API Gateway, Lambda function, and S3 bucket for data storage.

Requirements:
- API Gateway HTTP API with CORS enabled
- Lambda function (Python 3.11) that processes incoming data
- S3 bucket for storing processed data with encryption
- Proper IAM roles and permissions
- Environment-based naming convention using parameters
- CloudFormation Outputs for API endpoint and resource ARNs

The Lambda should accept JSON payloads, validate them, and store them in S3.