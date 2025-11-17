# Task: Provisioning of Infrastructure Environments

## Problem Statement

Create a Terraform configuration to establish a reusable multi-environment infrastructure that maintains consistency across development, staging, and production while allowing controlled variations. The configuration must: 1. Define a root module structure with separate directories for each environment, sharing common modules. 2. Implement a VPC module that accepts CIDR ranges as variables and creates 3 public and 3 private subnets across availability zones. 3. Create an RDS module that conditionally enables multi-AZ based on environment type. 4. Design an ECS module that deploys Fargate services with environment-specific task counts and CPU/memory allocations. 5. Build a remote state configuration module that creates S3 buckets and DynamoDB tables for each environment's state management. 6. Implement provider configuration with assume_role blocks for cross-account deployments. 7. Create a naming module that generates consistent resource names following the required pattern. 8. Design an outputs module that writes critical infrastructure IDs to SSM Parameter Store with hierarchical paths like /{env}/vpc/id. 9. Structure tfvars files for each environment with clear separation of common and environment-specific values. 10. Include data sources to reference existing Route53 hosted zones and ACM certificates. Expected output: A complete Terraform project structure with modular components that can provision identical infrastructure patterns across three environments while maintaining appropriate isolation and allowing controlled configuration differences for aspects like instance sizes, backup policies, and high availability settings.

## Background

Your company operates a microservices platform across development, staging, and production environments. Recent incidents have revealed significant configuration drift between environments, causing deployment failures and security vulnerabilities. Management requires immediate implementation of a unified Terraform configuration that enforces consistency while allowing controlled variations.

## Environment

Multi-account AWS deployment spanning three environments (dev, staging, prod) across us-east-1 and us-east-2 regions. Core infrastructure includes VPC with public/private subnets, RDS PostgreSQL 14, ECS Fargate clusters, Application Load Balancers, and S3 buckets. Each environment resides in a separate AWS account (123456789012-dev, 234567890123-staging, 345678901234-prod) with cross-account IAM roles for deployment. Network architecture uses 10.0.0.0/16 for dev, 10.1.0.0/16 for staging, and 10.2.0.0/16 for production. Requires Terraform 1.5+ with AWS provider 5.x configured.

## Constraints

- Environment-specific variables must be loaded from separate .tfvars files without hardcoding
- All environments must use identical module versions locked via terraform.lock.hcl
- Resource naming must follow pattern: {env}-{region}-{service}-{resource}
- All environments must share the same CIDR allocation strategy with non-overlapping ranges
- Production must have multi-AZ RDS with automated backups, while dev/staging use single-AZ
- Each environment must use separate AWS accounts with cross-account IAM role assumption
- Module outputs must be exported to SSM Parameter Store for cross-stack references
- Terraform workspaces are prohibited; use separate state files per environment
- State files must be stored in environment-specific S3 buckets with DynamoDB locking
