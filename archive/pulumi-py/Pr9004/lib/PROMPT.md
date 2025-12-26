Need a serverless infrastructure on AWS using Pulumi with Python. Should deploy to us-east-1 with production-ready security and observability.

Infrastructure Requirements

Build a secure, scalable serverless setup with these components:

1. Lambda Functions - Python Runtime
   Use Python 3.9 runtime for AWS Lambda.

   Make them idempotent - safe to invoke multiple times without side effects.

   Trigger on S3 bucket ObjectCreated:* events.

   Add retry logic with exponential backoff - 3 retries, exponential strategy.

   Set timeout at 5 seconds or less and memory at 128MB or less to optimize for under 300ms average execution time.

   Log all invocations and failures to CloudWatch Logs.

2. API Gateway REST API
   Use API Gateway v2 REST to expose Lambda functions via RESTful endpoints.

   Route HTTP methods like GET and POST to the corresponding Lambda functions.

   Enable access logging and request tracing.

3. IAM Roles and Policies
   Create least-privilege IAM roles for:

   Lambda execution with permissions to read from S3 and write to CloudWatch Logs.

   Accessing AWS Secrets Manager for environment variables.

   Attach policies inline or managed where appropriate.

   Use Pulumi's IAM constructs to manage trust and permissions.

4. S3 Buckets
   Create at least one S3 bucket for:

   File uploads that trigger Lambda on object creation.

   Server-side encryption with SSE-S3 or SSE-KMS.

   Deny public access using bucket policies.

   Enable versioning for compliance if needed.

5. AWS Secrets Manager
   Create a secret for storing sensitive config like API keys or DB credentials.

   Ensure the Lambda function can access this secret securely at runtime.

   Enable encryption-at-rest using AWS-managed KMS.

6. CloudWatch Monitoring
   Enable detailed logging for all Lambda functions.

   Create CloudWatch Alarms:

   Monitor failed invocations using Errors metric.

   Set up threshold-based alerting - more than 1 failure in 5 mins.

   Optionally integrate with SNS or email for notifications.

Implementation Constraints

Use Pulumi with Python.

All infrastructure should be defined in a single Python script - main.py.

Target region: us-east-1.

Don't hardcode secrets - use Pulumi Config or AWS Secrets Manager.

Clearly comment each section of code for clarity.

Ensure the code:
- Synthesizes and deploys successfully with pulumi up
- Follows Pulumi and AWS best practices
- Passes basic functional tests for Lambda + API Gateway + S3 triggers

Expected Output

A complete Pulumi Python script - main.py - that:

Deploys the described architecture end-to-end.

Is production-ready and security-compliant.

Includes in-line comments for each major resource block.
