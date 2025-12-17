We're working on a security baseline implementation for our AWS infrastructure using TypeScript and CDK v2. The goal is to create a comprehensive security setup that handles encryption, access controls, and audit logging across our payment processing environment.

Here's what we need to build:

The main requirement is a CDK application that sets up security controls for a multi-tier application running in AWS. We need separate KMS keys for different purposes - one for database encryption, one for S3 buckets, and another for secrets. Each key should have automatic rotation enabled.

For IAM, we need to create roles with minimal permissions for EC2 instances, Lambda functions, and ECS tasks. There's also a requirement for a cross-account role that DevOps can use, but only with MFA enabled and from specific IP ranges.

We're using Secrets Manager for sensitive data like database credentials and API keys. These secrets need automatic rotation, and the rotation Lambda needs to run in isolated subnets with no internet access. The Lambda will use VPC endpoints to communicate with Secrets Manager and KMS.

All S3 buckets should have server-side encryption with KMS, versioning enabled, access logging turned on, and public access completely blocked. We also need SSL-only access enforced through bucket policies.

VPC flow logs are important for security monitoring, so we need those configured and sent to a dedicated S3 bucket. All logs should be encrypted.

CloudWatch log groups are needed for application and audit logs, with 7-year retention for compliance reasons. All log groups must be encrypted with KMS.

CloudTrail needs to be set up as a multi-region trail with log file validation enabled. Logs should be encrypted and we want to capture all management events plus data events for our S3 buckets.

We considered implementing Service Control Policies to prevent accidental deletion of critical security resources, but that requires AWS Organizations setup which might not be available in all environments. We'll leave that as an optional component for now.

Tagging is important for resource management and compliance, so we want to use CDK Aspects to automatically apply tags like Environment, CostCenter, and Owner across all resources.

The stack should have termination protection enabled to prevent accidental deletion.

We also want to use custom constructs for reusable patterns - specifically for KMS keys and S3 buckets to ensure consistency and reduce code duplication.

The CDK app should be initialized from bin/tap.ts and the main stack should be in lib/tap-stack.ts. The stack name should follow the TapStack pattern we're already using in our infrastructure.

Expected deliverables:
- bin/tap.ts - CDK app entry point that initializes the TapStack
- lib/tap-stack.ts - Complete infrastructure code with all the security components

Focus on production-ready code with proper error handling, clear comments for logical sections, and following AWS security best practices for PCI-DSS compliance.
