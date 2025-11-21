# Infrastructure as Code Task: Security Configuration as Code

## Platform and Language
**MANDATORY CONSTRAINTS**: Use **Terraform with HCL**

## Context
A financial services company needs to maintain identical infrastructure across development, staging, and production environments for their payment processing system. They require strict consistency between environments while allowing for environment-specific configurations like instance sizes and database capacity.

## Problem Statement
Create a Terraform configuration to deploy identical infrastructure across three environments (dev, staging, prod) with strict consistency requirements.

## Infrastructure Details
Multi-environment AWS deployment across us-east-1 for production, us-west-2 for staging, and eu-west-1 for development. Each environment requires its own VPC with 3 availability zones, private and public subnets, and NAT gateways. Core services include Aurora PostgreSQL 13.7, Lambda functions with Python 3.9 runtime, buckets for data storage, and Application Load Balancers. Terraform 1.5+ required with AWS provider 5.x. Each environment uses separate AWS accounts linked through AWS Organizations. State files stored in environment-specific backends with DynamoDB table locking.

## MANDATORY REQUIREMENTS (Must Complete)

1. Define a reusable module structure that deploys Aurora PostgreSQL clusters with encryption at rest (CORE: Aurora)
2. Create Lambda functions that process data from buckets with identical code across environments (CORE: Lambda)
3. Implement workspace-based variable files (dev.tfvars, staging.tfvars, prod.tfvars) for environment-specific values
4. Use count or for_each to create 3 buckets per environment with consistent naming patterns
5. Configure Application Load Balancers with identical listener rules across all environments
6. Set up CloudWatch Log Groups with environment-specific retention periods (7 days dev, 30 days staging, 90 days prod)
7. Create a validation script that compares resource configurations between workspaces
8. Implement IAM roles with identical permission boundaries but environment-specific trust policies
9. Use remote state data sources to reference resources between environments
10. Configure SNS topics for alerts with identical subscription filters

## OPTIONAL ENHANCEMENTS (If Time Permits)

- Add AWS Config rules to monitor configuration drift (OPTIONAL: Config) - ensures ongoing compliance
- Implement Step Functions for orchestrating cross-environment deployments (OPTIONAL: Step Functions) - improves deployment coordination
- Add EventBridge rules for automated environment synchronization (OPTIONAL: EventBridge) - enables event-driven updates

## Implementation Notes

- Use Terraform workspaces to manage all three environments from a single configuration
- Implement a custom validation module that enforces identical security group rules across all environments
- Database passwords must be stored in Parameter Store with environment-specific paths
- Use data sources to verify that VPC CIDR blocks don't overlap between environments
- All S3 buckets must have versioning enabled and use environment-specific naming conventions
- Lambda functions must use identical runtime versions across all environments
- Create a locals block that maps environment names to specific instance types and sizes
- Implement resource tagging that includes both environment name and a shared project identifier
- Use for_each loops to create identical IAM roles with environment-specific name prefixes

## Expected Output
A modular Terraform configuration with workspace support that maintains infrastructure consistency across three environments while allowing controlled variations for environment-specific requirements.

## Critical Requirements for Synthetic Tasks

### Resource Naming
ALL resource names MUST include `environmentSuffix` or `environment_suffix`:
```hcl
resource "aws_s3_bucket" "data_bucket" {
  bucket = "data-bucket-${var.environment_suffix}"
}
```

### Destroyability
- NO deletion protection on any resources
- NO retain policies
- All resources must be cleanly destroyable
- Set `skip_final_snapshot = true` for RDS/Aurora
- Set `force_destroy = true` for S3 buckets with objects

### Known AWS Constraints
- GuardDuty: Account-level service (one detector per account/region) - avoid or handle gracefully
- AWS Config: Use managed policy `service-role/AWS_ConfigRole` or service-linked role
- Lambda: Node.js 18+ doesn't include AWS SDK v2 by default - use SDK v3 or extract from event
- Reserved concurrency: Keep low (1-5) or omit to avoid account limits

### Cost Optimization
- Prefer Aurora Serverless v2 over provisioned
- Use VPC Endpoints instead of NAT Gateways where possible
- Minimize NAT Gateway count (1 per region, not per AZ)
- Set minimal backup retention (1 day)

### Testing Requirements
- Unit tests must achieve 90%+ coverage
- Integration tests must use actual deployed resources from outputs
- No hardcoded environmentSuffix in tests
