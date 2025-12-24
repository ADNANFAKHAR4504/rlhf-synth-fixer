Need to build secure CDK infrastructure with proper encryption and IAM.

We have a multi-region setup running in us-west-2 and eu-central-1 with VPCs, S3, and EC2. Need to add proper security controls around data storage and API access.

## What I need:

**S3 bucket for data storage**
- Must use KMS encryption for everything at rest
- Need to enforce encryption on all objects, not just defaults

**API Gateway as the public endpoint**
- Should connect to Lambda functions that read/write S3
- Must enforce SSL/TLS - no plain HTTP allowed
- Lambda needs IAM role with specific S3 and KMS permissions only

**IAM setup**
- Lambda role should have:
  - GetObject and PutObject on the bucket only
  - KMS encrypt/decrypt for the specific key
  - CloudWatch logs access
- Don't give it ListBucket or any wildcards

**Tests**
Write unit tests that check:
- S3 bucket has KMS encryption enabled
- IAM policy doesn't use wildcards or overly broad permissions
- API Gateway enforces SSL

Use CDK with TypeScript. Keep the infrastructure modular - separate constructs for S3, Lambda, IAM role, and API Gateway.
