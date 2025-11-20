# Task 101912520: Multi-Environment Trading Analytics Platform Migration

## Background
A financial services company is migrating their legacy on-premises trading analytics platform to AWS. The platform processes market data in real-time and must maintain sub-second response times while ensuring data consistency across development, staging, and production environments.

## Problem Statement
Create a Pulumi Python program to migrate a trading analytics platform across three environments (dev, staging, production) with environment-specific configurations. The configuration must:

1. Define a reusable Stack class that accepts environment name as parameter
2. Create Lambda functions for real-time data processing with environment-specific memory settings (CORE: Lambda)
3. Deploy DynamoDB tables for storing analytics results with different billing modes per environment (CORE: DynamoDB)
4. Configure S3 buckets for data archival with production-only versioning
5. Implement environment-aware IAM roles and policies for Lambda-DynamoDB-S3 access
6. Set up CloudWatch log groups with environment-specific retention periods
7. Use Pulumi data structures to manage configuration values per environment
8. Generate unique resource names following the specified naming pattern
9. Configure Pulumi remote backend with environment-isolated state files
10. Ensure all resources are tagged with Environment and ManagedBy tags

Expected output: A Pulumi Python application with separate stack instances for dev, staging, and production environments, each with appropriately scaled resources and configurations that can be deployed independently using Pulumi deploy command.

## Constraints
- Use Python 3.9 or higher for Pulumi implementation
- All Lambda functions must use ARM64 architecture for cost optimization
- DynamoDB tables must use on-demand billing mode in dev/staging but provisioned capacity in production
- Implement environment-specific naming conventions using {env}-{service}-{region} pattern
- S3 buckets must have versioning enabled only in production environment
- Lambda memory allocation must be 512MB in dev, 1024MB in staging, and 2048MB in production
- CloudWatch log retention must be 7 days for dev, 30 days for staging, 90 days for production
- Use Pulumi remote backend with S3 state storage segregated by environment
- All IAM roles must follow least-privilege principle with no wildcard actions

## Environment
Multi-environment AWS infrastructure spanning dev, staging, and production in us-east-1 region. Core services include Lambda for data processing, DynamoDB for real-time analytics storage, and S3 for historical data archival. Each environment requires isolated VPCs with private subnets for compute resources. Development uses minimal resources, staging mirrors production at 50% capacity, and production handles full workload. Requires Python 3.9+, Pulumi 0.20+, AWS CLI configured with appropriate credentials for each environment. State management via S3 backend with environment-specific prefixes.
