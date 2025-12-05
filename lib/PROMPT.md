# IaC Optimization Challenge: Payment Processing Infrastructure

## Background

A fintech startup has an existing Terraform configuration for their payment processing infrastructure that was hastily written during rapid growth. The configuration works but contains significant inefficiencies, hardcoded values, and redundant resource definitions that make maintenance difficult and increase AWS costs.

## Environment

Production payment processing infrastructure deployed in us-east-1 across 3 availability zones. Current setup includes ALB, ECS Fargate services, RDS Aurora PostgreSQL cluster, S3 buckets for logs, and CloudWatch monitoring. Uses Terraform 1.5+ with AWS provider 5.x. VPC spans 10.0.0.0/16 with public and private subnets. Existing state file stored in S3 backend with DynamoDB locking. Infrastructure supports PCI compliance requirements with encryption at rest and in transit.

## Problem Statement

Create a Terraform configuration to optimize an existing payment processing infrastructure that currently spans over 800 lines of repetitive HCL code. The configuration must:

1. Consolidate three nearly identical ECS service definitions into a single resource using for_each with a local variable map.
2. Replace all hardcoded subnet IDs, security group IDs, and AMI IDs with appropriate data sources.
3. Refactor six separate S3 bucket resources with similar configurations into a module that accepts parameters.
4. Convert inline IAM policy JSON documents to use data.aws_iam_policy_document resources.
5. Implement a tagging strategy using merge() function to combine default tags with resource-specific tags.
6. Replace repetitive security group rules with dynamic blocks that iterate over a list of port configurations.
7. Extract all environment-specific values into terraform.tfvars and define corresponding variables with validation rules.
8. Ensure all resource names follow the pattern: {environment}-{service}-{resource_type}-{identifier}.

Expected output: A refactored Terraform configuration with main.tf, variables.tf, outputs.tf, and terraform.tfvars files that reduces code duplication, improves maintainability, and preserves all existing functionality while passing validation and plan stages.

## Mandatory Constraints

1. Resource naming must follow a consistent pattern using locals and interpolation
2. Duplicate resource definitions must be consolidated using for_each or count
3. Tags must be centralized and applied consistently across all resources

## Optional Constraints

1. The optimized configuration must pass terraform validate and terraform plan without errors
2. All hardcoded values must be replaced with variables or data sources
3. Must reduce the total lines of HCL code by at least 40% while maintaining all functionality
4. Security group rules must be refactored to use dynamic blocks
5. IAM policies must use data sources for AWS-managed policies instead of inline JSON

## Success Criteria

Your solution should demonstrate:

- Significant reduction in code duplication (40%+ reduction)
- Proper use of Terraform's DRY principles (Don't Repeat Yourself)
- Data sources instead of hardcoded values
- Dynamic blocks for repetitive configurations
- Proper variable validation
- Consistent naming conventions
- Centralized tagging strategy
- Modular design for reusable components
