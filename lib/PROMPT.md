# AWS Serverless Stack with Security and Monitoring

Need a production-ready serverless stack using AWS CDK and TypeScript.

## Requirements

Build a secure serverless environment with these components:

**Core Infrastructure:**
- Lambda function
- API Gateway (REST or HTTP API)
- S3 bucket
- Deploy to us-east-1 with `prod-` prefix on all resources

**Security (this is the main focus):**
- Least-privilege IAM policies for Lambda and API Gateway
- S3 encryption at rest (SSE-S3 or KMS)
- HTTPS-only access for S3
- Lambda can only be invoked by API Gateway
- WAF on API Gateway
- API Gateway auth (API Key or Cognito)
- Logging everywhere (API Gateway, Lambda, S3)
- Tag everything (environment, owner, cost center, compliance)

**Operational:**
- CloudWatch alarms and metrics for Lambda
- X-Ray tracing enabled
- API Gateway usage plans and throttling
- S3 versioning and lifecycle policies
- Unit and integration test setup

**Multi-environment support via context variables (dev, staging, prod)**

## Stack Details

Using AWS CDK with TypeScript. Follow least-privilege IAM and Well-Architected Framework principles.

The stack should extend `Construct` (not Stack or Stage). Don't include the App or environment bootstrap code - just the stack itself.

Make sure it's production-ready and can run via `cdk deploy`.
