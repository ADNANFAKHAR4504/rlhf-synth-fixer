# AWS CDK Infrastructure Project

I need to build a secure cloud infrastructure using AWS CDK with Go. The project should deploy to us-east-1 and include proper audit logging throughout.

## What I'm Building

**S3 Bucket Setup:**
- Need versioning turned on
- Should trigger a Lambda when files get uploaded
- Want server access logs for compliance
- Name it like: proj-<resource>-<env>

**DynamoDB Table:**
- Needs both partition and sort keys
- Turn on point-in-time recovery and encryption
- Enable CloudWatch Contributor Insights for monitoring
- Follow same naming pattern

**Lambda Function:**
- Python 3.x runtime
- Gets triggered by S3 uploads
- Basic CloudWatch logging
- IAM role with minimal permissions (just S3 read, DynamoDB write, CloudWatch logs)
- Use env vars for table and bucket names

**Security & IAM:**
- Keep permissions tight - least privilege approach
- Lambda role should only access what it needs
- Use inline policies where it makes sense

**Audit Requirements:**
- CloudTrail or native logging on everything
- Make sure we can track:
  - Lambda executions
  - S3 access
  - DynamoDB operations

## Project Structure

Want clean separation using CDK constructs and stacks. Everything should deploy with just `cdk deploy`.

Need these files:
- bin/tap.go (main app)
- lib/tap_stack.go plus modular constructs
- lambda/handler.py (sample function)
- README.md with setup steps

The code should be production-ready with good comments and follow Go/CDK best practices.
