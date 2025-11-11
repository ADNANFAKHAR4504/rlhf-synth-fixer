# Task: Multi-Environment Payment Processing Infrastructure with CDKTF (TypeScript)

## Platform & Language
**CRITICAL REQUIREMENT**: This task MUST be implemented using **CDKTF with TypeScript**. Do not use any other platform or language.

## Background
A fintech startup needs to maintain identical infrastructure configurations across development, staging, and production environments for their payment processing platform. The company requires strict environment parity to prevent configuration drift and ensure reliable deployments across all stages of their release pipeline.

## Requirements
Create a Terraform configuration to deploy a payment processing infrastructure that maintains consistency across development, staging, and production environments. The configuration must:

1. Define a reusable module structure that accepts environment-specific variables for resource sizing.
2. Implement workspace-based environment separation with appropriate naming conventions for all resources.
3. Create VPCs with environment-specific CIDR ranges (10.1.0.0/16 for dev, 10.2.0.0/16 for staging, 10.3.0.0/16 for prod).
4. Deploy RDS PostgreSQL instances with environment-appropriate instance classes and automated backups.
5. Configure Lambda functions with environment-specific memory allocations and concurrent execution limits.
6. Set up S3 buckets with versioning enabled and lifecycle policies that vary by environment.
7. Create API Gateway REST APIs with stage names matching the environment.
8. Implement proper IAM roles and policies with least-privilege access for each service.
9. Configure CloudWatch log groups with environment-specific retention periods (7 days dev, 14 days staging, 30 days prod).
10. Use data sources to retrieve secrets from AWS Secrets Manager for database passwords.
11. Output the API Gateway endpoint URLs and RDS connection strings for each environment.
12. Ensure all resources are properly tagged and follow a consistent naming pattern.

Expected output: A modular Terraform configuration with a main module and environment-specific variable files that can be applied using workspace commands to create identical yet appropriately sized infrastructure across all three environments.

## Environment
Multi-environment AWS infrastructure spanning us-east-1 region with three isolated environments (dev, staging, prod). Each environment consists of a VPC with public and private subnets across 2 AZs, RDS PostgreSQL instances, Lambda functions for payment processing, S3 buckets for transaction logs, and API Gateway for REST endpoints. Requires Terraform 1.5+, AWS provider 5.x, configured AWS CLI with appropriate IAM permissions. State management via S3 backend with DynamoDB table for locking. Secrets Manager stores database passwords and API keys.

## Constraints
- Use Terraform workspaces to manage environment separation
- All sensitive values must be stored in AWS Secrets Manager
- RDS instances must use different instance classes per environment (t3.micro for dev, t3.small for staging, t3.medium for prod)
- Each environment must have its own isolated VPC with non-overlapping CIDR ranges
- S3 bucket names must include environment suffix and be globally unique
- Lambda functions must have environment-specific memory allocations (128MB dev, 256MB staging, 512MB prod)
- All resources must be tagged with Environment, Project, and ManagedBy tags
- Use Terraform remote state stored in S3 with DynamoDB locking

## Resource Naming
All AWS resources MUST include the `environmentSuffix` parameter in their names to avoid conflicts during parallel deployments. Use the pattern: `resourceName-${environmentSuffix}`

## AWS Region
Target region: us-east-1
