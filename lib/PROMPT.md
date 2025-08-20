Design a minimal, production-lean serverless image-processing foundation in AWS using CDK for Terraform (Go):

- No VPC or subnets. Only managed serverless services.
- Provision an S3 bucket (versioning enabled, public access blocked, SSE AES256) that triggers a Lambda on object created events.
- Provision a CloudWatch Log Group for the Lambda with 30-day retention.
- Provision an IAM role and least-privilege policy for the Lambda to read objects, write to specific prefixes, and write logs.
- Provision a Lambda function (python3.12) with simple, self-contained code, environment variables, and concurrency limits.
- Wire S3 bucket notifications to the Lambda and grant invoke permission to S3.
- Output the bucket name, Lambda function name, and Lambda ARN.

Non-functional:

- Single Go CDKTF app under `lib/` with tests under `tests/`.
- Tests must synthesize and assert expected AWS resources without hitting AWS.
- Keep naming stable and add basic tagging.
