# Zero-Trust Security Configuration for Data Processing Pipeline

## Platform and Language (MANDATORY)

This task MUST be implemented using **Pulumi with TypeScript**. Do not use any other IaC platform or programming language.

## Background

A financial services company needs to implement a zero-trust security architecture for their cloud infrastructure. They require strict IAM controls, network segmentation, and encryption at rest and in transit for all data processing workloads. The security team has mandated the use of Infrastructure as Code to ensure all security configurations are version-controlled and auditable.

## Environment

Highly regulated AWS environment deployed in us-east-1 region with strict security requirements. Infrastructure includes VPC with private subnets across 3 availability zones, AWS KMS for encryption key management, IAM for access control, S3 for secure storage, and CloudWatch Logs for audit logging. Requires Pulumi CLI 3.x with TypeScript SDK, AWS CLI configured with appropriate permissions. All resources must be deployed within a dedicated VPC with no internet gateway, using VPC endpoints for AWS service access. The environment enforces mandatory encryption for all data at rest and in transit.

## Requirements

Create a Pulumi TypeScript program to implement a zero-trust security configuration for a data processing pipeline. The configuration must:

1. Create a VPC with 3 private subnets across different availability zones with no internet gateway.

2. Configure VPC endpoints for S3, KMS, and CloudWatch Logs services.

3. Create a customer-managed KMS key with automatic rotation enabled every 90 days.

4. Define an IAM role for Lambda functions with minimal permissions to read from S3 and write to CloudWatch Logs.

5. Create an S3 bucket with versioning enabled, server-side encryption using the KMS key, and block public access.

6. Configure a CloudWatch Log group encrypted with the KMS key for Lambda function logs.

7. Implement security groups that only allow HTTPS traffic (port 443) between Lambda and VPC endpoints.

8. Create an IAM policy document that grants Lambda permission to decrypt/encrypt with the KMS key.

9. Set up S3 bucket policies that enforce encryption in transit using aws:SecureTransport condition.

10. Configure KMS key policies that allow the Lambda role to use the key for cryptographic operations.

11. Enable CloudWatch Logs retention policy of 7 days with encryption.

12. Tag all resources with mandatory security tags: Environment, DataClassification, and Owner.

## Constraints

- All IAM roles must follow the principle of least privilege with no wildcard actions allowed
- Security groups must explicitly define all ingress and egress rules with no 0.0.0.0/0 CIDR blocks
- KMS keys must have automatic rotation enabled with a 90-day rotation period
- IAM policies must be attached to roles, not directly to users or groups
- VPC endpoints must be used for all AWS service communications to avoid internet exposure
- All S3 buckets must have versioning enabled and block public access settings configured
- CloudWatch Logs must be encrypted using customer-managed KMS keys

## Expected Output

A complete Pulumi TypeScript program that creates a locked-down AWS environment with defense-in-depth security controls, ensuring all data is encrypted at rest and in transit, with minimal IAM permissions and network isolation through VPC endpoints.

## Critical Deployment Requirements

### Resource Naming (CRITICAL)
ALL named resources MUST include the environmentSuffix parameter to avoid conflicts:
- Pattern: `resourceName-${environmentSuffix}`
- Example: `data-bucket-${environmentSuffix}`
- This applies to: S3 buckets, IAM roles, KMS keys, Lambda functions, CloudWatch Log groups, VPCs, security groups, etc.

### Destroyability (CRITICAL)
- NO resources should have retention policies that prevent deletion
- S3 buckets: Do NOT set retention policies
- KMS keys: Use appropriate deletion window (7-30 days)
- All resources must be cleanly destroyable for testing purposes

### Region Configuration
- Default region: us-east-1
- Check for `lib/AWS_REGION` file - if exists, use that region instead
- Multi-AZ deployment should span availability zones within the configured region

### AWS Service Best Practices
- Use VPC endpoints instead of NAT gateways where possible (cost optimization)
- Prefer AWS managed encryption (SSE-S3) unless KMS is explicitly required
- CloudWatch Logs: Set reasonable retention periods (7-14 days for synthetic tasks)
- IAM roles: Use least privilege principle, no wildcard (*) permissions

### Testing Requirements
- Infrastructure must deploy successfully on first attempt
- All security controls must be verifiable post-deployment
- Resources should be properly connected and functional
