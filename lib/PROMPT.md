You are an expert in AWS serverless infrastructure using Pulumi with Python. Please generate a Pulumi Python program (**main**.py) that deploys the following architecture to us-east-1 using best practices for security, idempotency, observability, and scalability.

Infrastructure Requirements
Build a secure, scalable serverless infrastructure on AWS with these specifications:

1. Lambda Functions (Python Runtime)
   Define AWS Lambda functions using the Python 3.9 runtime.

Ensure they are idempotent (safe to invoke multiple times without side effects).

Trigger functions on S3 bucket ObjectCreated:\* events.

Add retry logic with exponential backoff (3 retries, exponential strategy).

Set timeout ≤ 5 seconds and memory ≤ 128MB to optimize for <300ms average execution time.

Log all invocations and failures to CloudWatch Logs.

2. API Gateway (REST API)
   Use API Gateway v2 (REST) to expose Lambda functions via RESTful endpoints.

Route HTTP methods (e.g., GET, POST) to the corresponding Lambda functions.

Enable access logging and request tracing.

3.  IAM Roles & Policies
    Create least-privilege IAM roles for:

Lambda execution (with permissions to read from S3, write to CloudWatch Logs).

Accessing AWS Secrets Manager for environment variables.

Attach policies inline or managed where appropriate.

Use Pulumi's IAM constructs to manage trust and permissions.

4. S3 Buckets
   Create at least one S3 bucket for:

File uploads (trigger Lambda on object creation).

Server-side encryption with SSE-S3 or SSE-KMS.

Deny public access using bucket policies.

Enable versioning (optional) for compliance.

5.  AWS Secrets Manager
    Create a secret for storing sensitive config (e.g., API keys or DB credentials).

Ensure the Lambda function can access this secret securely at runtime.

Enable encryption-at-rest using AWS-managed KMS.

6.  CloudWatch Monitoring
    Enable detailed logging for all Lambda functions.

Create CloudWatch Alarms:

Monitor failed invocations (using Errors metric).

Set up threshold-based alerting (e.g., > 1 failure in 5 mins).

Optionally integrate with SNS/email for notifications.

Implementation Constraints
Use Pulumi with Python.

All infrastructure should be defined in a single Python script (**main**.py).

Target region: us-east-1.

Avoid hardcoding secrets — use Pulumi Config or AWS Secrets Manager.

Clearly comment each section of code for clarity.

Ensure the code:

Synthesizes and deploys successfully (pulumi up).

Follows Pulumi and AWS best practices.

Passes basic functional tests for Lambda + API Gateway + S3 triggers.

Expected Output
A complete Pulumi Python script (**main**.py) that:

Deploys the described architecture end-to-end.

Is production-ready and security-compliant.

Includes in-line comments for each major resource block.
