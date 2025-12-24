# Secure Serverless API Stack

We need to build a serverless API using Lambda, API Gateway, and S3. The main concern is security - this needs to be locked down properly for production.

## What We Need

Set up a REST API with these pieces:

- Lambda function that handles API requests
- API Gateway to expose the Lambda
- S3 bucket for storing data/uploads
- Everything in us-east-1, resources prefixed with `prod-`

The Lambda should read/write from S3. API Gateway triggers the Lambda when requests come in.

## Security Requirements (Critical)

This is going into production so security is non-negotiable:

**IAM & Access:**
- Lambda needs minimal permissions - only what it needs for S3
- API Gateway can invoke Lambda, nothing else can
- S3 is private, no public access at all
- Encrypt S3 at rest (KMS preferred but SSE-S3 is fine)
- Force HTTPS for all S3 access

**API Protection:**
- Need auth on API Gateway - either API keys or Cognito (your call)
- Set up WAF rules for the API
- Usage plans and throttling to prevent abuse

**Monitoring & Compliance:**
- Turn on logging for everything (API access logs, Lambda logs, S3 logs)
- Tag all resources with environment, owner, cost center, compliance
- CloudWatch alarms if Lambda starts erroring out
- X-Ray tracing so we can debug issues

## Operational Stuff

Some things to make this easier to run:

- S3 versioning turned on
- Lambda timeout and memory sized appropriately
- Support for deploying to dev/staging/prod via CDK context
- Tests included (at least basic unit tests for the stack)

## Implementation Notes

Using CDK with TypeScript. The stack should extend `Construct` not `Stack`. Don't include the app.ts file, just the stack itself.

Should be ready to deploy with `cdk deploy` once we plug it into our app.
