# Build complete AWS infrastructure with Pulumi Python

Need a full production-ready infrastructure setup using Pulumi Python SDK.

## What I need:

Give me COMPLETE working code - no placeholders or TODOs. All files ready to deploy immediately.

Embed Lambda functions as inline strings in the infrastructure file - don't create separate files unless absolutely necessary.

### Files to create:
- tap_stack.py - main infrastructure
- test_tap_stack.py for unit tests
- test_tap_stack.py for integration tests
- README.md with setup instructions

### Infrastructure components:

VPC setup in us-east-1:
- 10.0.0.0/16 network
- 2 public and 2 private subnets in different AZs
- Internet gateway and NAT gateway
- Route tables configured correctly

S3 bucket:
- Encrypted with versioning enabled
- Public access blocked
- Set up to trigger Lambda on object creation

Lambda function:
- Python 3.9 runtime
- Triggered by S3 events
- Proper IAM role with minimal permissions
- CloudWatch logging with 14-day retention

Security requirements:
- Use least privilege IAM policies
- Encryption enabled where supported
- No hardcoded credentials

Make it work across multiple environments - use env variables for STAGE and BUCKET names.
Tag everything with Project, Stage, and Managed tags.

### Tests needed:

Unit tests using Pulumi mocks for all resources.
Integration tests against real AWS.
Test the S3 to Lambda trigger end-to-end.
Verify multi-AZ setup works.

Code should pass pylint with score above 7.

### Docs:

README with how to install, deploy, and use this.
Explain the architecture briefly.
Include troubleshooting tips.

## Format:

Start with the infrastructure code in tap_stack.py