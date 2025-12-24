# Task: Environment Migration

## Background
A fintech startup needs to migrate their payment processing infrastructure from a single-region deployment to a multi-region setup for compliance and latency requirements. The existing infrastructure runs in us-east-1 and needs to be replicated to eu-west-1 while maintaining data consistency and security standards.

## Environment
Multi-region AWS infrastructure spanning us-east-1 primary and eu-west-1 secondary for payment processing workloads. Uses RDS PostgreSQL with automated backups, Lambda functions for transaction processing, S3 for document storage, and API Gateway for REST endpoints. Requires Terraform 1.5+ with AWS provider 5.x. VPC in each region with 3 private subnets and 3 public subnets. Cross-region VPC peering for internal communication. KMS keys in each region for encryption at rest.

## Problem Statement
Create a Terraform configuration to migrate a payment processing system from single-region to multi-region deployment. The configuration must:

1. Define provider configurations for both us-east-1 and eu-west-1 regions.
2. Set up Terraform workspaces named 'primary' and 'secondary' for region management.
3. Create S3 buckets in both regions with versioning and cross-region replication from primary to secondary.
4. Deploy RDS PostgreSQL instances with db.t3.medium instance type in both regions with automated encrypted snapshot copying.
5. Configure Lambda functions that process payments in both regions with identical code but region-specific DynamoDB table endpoints.
6. Establish API Gateway REST APIs in both regions with custom domain names.
7. Implement Route 53 health checks and failover routing policies for the API endpoints.
8. Create all IAM roles and policies in us-east-1 only, using data sources to reference them in eu-west-1.
9. Set up CloudWatch alarms for RDS replication lag monitoring.
10. Configure KMS keys in each region for S3 and RDS encryption.

## Expected Output
A modular Terraform configuration with separate files for providers, variables, and resources that can deploy identical infrastructure in both regions using workspace selection, enabling seamless regional failover capabilities.

## Constraints

1. Use Terraform workspaces to manage both regions from a single configuration
2. All S3 buckets must have cross-region replication enabled between us-east-1 and eu-west-1
3. RDS instances must use encrypted snapshots for cross-region backup replication
4. Lambda functions must be deployed identically in both regions with region-specific environment variables
5. API Gateway custom domains must use Route 53 failover routing between regions
6. All IAM roles must be created in the primary region only and referenced cross-region

## Platform & Language
- Platform: Terraform
- Language: HCL
- Difficulty: hard
- Subject Labels: Environment Migration

## Task ID
101000939