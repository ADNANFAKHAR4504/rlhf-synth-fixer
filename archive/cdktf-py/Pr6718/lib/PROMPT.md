# Infrastructure Requirements

## Task Description

Create a Terraform configuration to establish a reusable module structure that ensures infrastructure consistency across development, staging, and production environments while supporting environment-specific variations. The configuration must:

1. Define a root module that uses workspaces (dev, staging, prod) to manage environment separation.
2. Create a VPC module that accepts CIDR ranges as variables and ensures non-overlapping IP spaces (10.0.0.0/16 for dev, 10.1.0.0/16 for staging, 10.2.0.0/16 for prod).
3. Implement an RDS module that conditionally enables Multi-AZ based on workspace (true for prod, false otherwise).
4. Design an ECS module that scales container counts based on environment (2 for dev, 4 for staging, 8 for prod).
5. Configure S3 backend with workspace-specific state file paths and DynamoDB locking.
6. Create IAM roles with environment-prefixed names (e.g., dev-ecs-task-role, prod-ecs-task-role).
7. Implement data sources to fetch secrets from AWS Secrets Manager using workspace-aware paths.
8. Define outputs that expose critical resource IDs and endpoints for each module.
9. Use count and for_each meta-arguments to create environment-appropriate resource quantities.
10. Implement validation rules in variables to prevent invalid configurations.
11. Create a tfvars file structure that separates common and environment-specific variables.
12. Ensure all modules use semantic versioning with git tags (e.g., v1.0.0).

Expected output: A modular Terraform configuration with a root module and at least three child modules (vpc, rds, ecs), workspace configurations for three environments, proper state backend setup, and tfvars files demonstrating environment-specific overrides while maintaining structural consistency across all deployments.

## Background Context

A financial services company operates trading applications across development, staging, and production environments. They discovered configuration drift between environments causing deployment failures and security vulnerabilities. The DevOps team needs to implement a Terraform module system that enforces consistency while allowing controlled variations for each environment.

## Current Infrastructure

AWS multi-account setup spanning three environments (dev, staging, prod) in us-east-1 region. Each environment has its own AWS account with cross-account IAM roles for deployment. Infrastructure includes VPCs with 3 availability zones, public and private subnets, NAT gateways, Application Load Balancers, ECS Fargate clusters running containerized applications, RDS Aurora PostgreSQL databases, and S3 buckets for static assets. Requires Terraform 1.5+, AWS CLI v2 configured with appropriate credentials, and Git for module versioning. State files stored in dedicated S3 bucket with versioning enabled and DynamoDB table for state locking.

## Constraints and Requirements

- Use Terraform workspaces to manage environment separation
- All sensitive values must be stored in AWS Secrets Manager and referenced dynamically
- RDS instances in production must use Multi-AZ deployment while dev/staging use single-AZ
- Module versions must be pinned using git tags for reproducibility
- Implement remote state storage with S3 backend and state locking via DynamoDB
- Network CIDRs must not overlap between environments
- IAM roles must follow least privilege principle with environment-specific naming

## Platform and Language

**CRITICAL: This task MUST be implemented using CDKTF with Python.**

All infrastructure code must be written in Python using the Cloud Development Kit for Terraform (CDKTF). Do not use native Terraform HCL, AWS CDK, Pulumi, or any other infrastructure framework.

## Deployment Requirements (CRITICAL)

**Resource Naming and Destroyability**:

1. **environmentSuffix Requirement**: ALL named resources (IAM roles, S3 buckets, RDS instances, ECS clusters, etc.) MUST include an `environmentSuffix` parameter in their names to ensure uniqueness across deployments. This suffix should be appended to resource names using a pattern like `{resource-type}-{environment}-{suffix}`.

2. **Destroyability Requirement**: All resources MUST be fully destroyable for testing purposes. This means:
   - NO `prevent_destroy` lifecycle rules
   - NO `skip_final_snapshot=False` for RDS (use `skip_final_snapshot=True`)
   - NO deletion protection enabled on any resource
   - S3 buckets must allow force deletion
   - All resources should clean up completely on `cdktf destroy`

3. **Resource-Specific Guidelines**:
   - **S3 Buckets**: Enable force destroy to allow deletion with contents
   - **RDS Instances**: Set `skip_final_snapshot=True` and `deletion_protection=False`
   - **DynamoDB Tables**: Set `deletion_protection_enabled=False`
   - **IAM Roles**: Include environmentSuffix in role names for uniqueness
   - **VPC Resources**: Ensure all dependencies are properly managed for clean deletion
