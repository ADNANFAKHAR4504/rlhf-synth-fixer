# AWS Secure Storage Infrastructure

We need to build a secure AWS storage system using Terraform. The main goal is to create S3 buckets with proper security controls and IAM management.

## What we need to build

**S3 Storage Setup:**

- Encrypted S3 buckets (AES-256)
- IP restrictions for bucket access
- Versioning enabled
- CloudTrail logging for API calls

**IAM Security:**

- Least privilege roles (no more permissions than needed)
- CloudWatch monitoring for IAM changes
- SNS notifications when roles are modified

## Security requirements

- All S3 data must be encrypted
- Only allow access from specific IP ranges
- Use IAM roles, never hardcoded keys
- Log all API activity with CloudTrail
- Monitor IAM role changes with alarms
- Send alerts to security team via SNS

## Technical specs

Build everything in `tap_stack.tf` file:

- Variable declarations (including aws_region)
- Resources and outputs
- No external modules - write everything directly
- Follow security best practices

The infrastructure should be production-ready with proper tagging and security controls.
