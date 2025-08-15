# Secure AWS Infrastructure Setup

we need to set up a secure data storage environment on AWS using Terraform. Here's what we're trying to accomplish:

## What we're building

We need a secure AWS setup that handles data storage with proper security controls. The main components:

- Secure S3 buckets with encryption
- CloudTrail for audit logging
- IAM roles with minimal permissions
- Monitoring and alerting setup

## Key requirements

**S3 Security:**

- Use AES-256 encryption on all buckets
- Enable versioning for data protection
- Lock down access to specific IP ranges only

**Access Control:**

- No hardcoded AWS keys - use IAM roles
- Follow least privilege principle
- Whitelist specific IP addresses for bucket access

**Logging & Monitoring:**

- CloudTrail should capture all API calls
- CloudWatch alarms for IAM changes
- SNS notifications to security team

**Infrastructure:**

- Everything goes in the `tap_stack.tf` file
- Don't include provider block (it's in provider.tf already)
- Use the aws_region variable from (`main.tf` or `tap_stack.tf`)
- Tag everything consistently

## Implementation notes

The VPC and networking is already set up, so we just need to focus on the storage and security components.

Make sure to:

- Output useful info for CI/CD integration (but no secrets!)
- Use random suffixes for globally unique names
- Set up proper resource dependencies
- Test both unit and integration scenarios

## Testing approach

Tests should validate the Terraform config without actually deploying anything during the test run. Integration tests can read from cfn-outputs/all-outputs.json after deployment.

This setup needs to be production-ready with proper security controls in place.
