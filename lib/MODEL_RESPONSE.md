# Multi-Environment AWS Infrastructure CDK Solution

I need to create a comprehensive CDK Python solution for multi-environment infrastructure with proper security boundaries and environment-specific configurations.

Here's what I built:

## Architecture Overview

The solution creates separate resource stacks for each environment (dev, test, prod) with environment-specific S3 buckets with security features, DynamoDB tables with resource-based policies, IAM roles with strict environment isolation, CloudWatch logging with environment-appropriate retention, and Systems Manager parameters with encryption.

The main stack implementation is in lib/tap_stack.py. It uses a TapStackProps dataclass to pass environment configuration. Each environment gets specific configuration including log retention (7-90 days), DynamoDB billing mode (pay-per-request vs provisioned), S3 versioning and lifecycle rules, and KMS key deletion windows.

Key security features include KMS keys with automatic rotation and environment-specific aliases, S3 buckets with KMS encryption, SSL enforcement, and public access blocking, DynamoDB tables with customer-managed encryption and point-in-time recovery for production, IAM roles with least privilege access and cross-environment access prevention.

The environment configuration method returns different settings based on the environment suffix. Development uses 7-day log retention, pay-per-request billing, no versioning, and shorter lifecycle. Production uses 90-day retention, provisioned billing, versioning enabled, and longer lifecycle with archiving rules.

Resource creation methods handle KMS key creation with aliases and CloudWatch Logs permissions, S3 buckets with latest security features like object ownership enforcement, DynamoDB tables with GSI and environment-appropriate configurations, application and admin IAM roles with environment-specific permissions, CloudWatch log groups with metric filters for error monitoring, SSM parameters for configuration storage.

The admin role includes explicit deny policies to prevent cross-environment access using resource tags. All resources are tagged consistently for cost tracking and management.

For deployment, install dependencies with pip install -r requirements.txt then deploy to different environments using cdk deploy -c environmentSuffix=dev/test/prod.

Cost optimization includes development environments using pay-per-request billing, shorter retention periods, and auto-delete policies. Production uses provisioned capacity, longer retention, and RETAIN policies.

The solution provides comprehensive monitoring with CloudWatch logs, metric filters for error counting, and environment-appropriate retention. Parameter management uses Systems Manager with encryption and environment-specific paths.

This architecture ensures proper environment isolation while maintaining consistent deployment patterns across all environments.