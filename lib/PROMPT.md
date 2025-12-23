I need help setting up a serverless API infrastructure using CloudFormation YAML for LocalStack deployment. Here's what I'm trying to build:

Lambda Function Setup:
- Deploy a Lambda function that processes incoming HTTP requests routed from API Gateway
- Should run on python3.11 runtime
- Lambda writes processed request data to an S3 bucket

API Gateway Integration:
- API Gateway REST API integrated with Lambda using proxy integration
- All HTTP requests flow through API Gateway to Lambda
- Both root path and wildcard paths connect to the same Lambda function

IAM Permissions:
- Lambda execution role with specific least-privilege permissions
- CloudWatch Logs access limited to its own log group for writing logs
- S3 access scoped to the data bucket only: GetObject, PutObject, DeleteObject for objects and ListBucket for the bucket
- KMS permissions restricted to decrypt and generate data keys for the bucket encryption key

S3 Data Storage:
- S3 bucket receives processed data from Lambda
- Customer-managed KMS key encrypts all bucket objects
- Public access blocked on the bucket
- Versioning enabled

CloudWatch Logging:
- Lambda sends all logs to a dedicated CloudWatch log group
- Log group configured with 14 day retention
- Captures incoming requests and outgoing responses

KMS Encryption:
- Customer-managed KMS key created for S3 bucket encryption
- Lambda accesses this key to encrypt data written to S3
- Key alias added for easier reference

LocalStack Compatibility:
- Skip key rotation since LocalStack doesn't support it
- No bucket lifecycle policies
- No CloudWatch alarms
- Use inline IAM policies instead of managed policy ARNs

Stack Outputs:
- API Gateway URL for testing the endpoint
- Lambda function ARN
- S3 bucket name
- KMS key ID and alias

Lambda should accept incoming requests through API Gateway, extract HTTP method, path, query params, and body, save that data to S3 as JSON files organized by date, and return a success response with request ID and S3 location.
