# Terraform Infrastructure Optimization

## Task Description

Create a Terraform configuration to refactor and optimize an existing multi-tier application infrastructure. The configuration must:

1. Convert hardcoded EC2 instance configurations into reusable modules with variable inputs for instance types, AMI IDs, and subnet assignments.
2. Consolidate three separate RDS PostgreSQL database definitions into a single parameterized module that supports different environments.
3. Replace 47 duplicate security group rules with dynamic blocks and for_each loops.
4. Implement workspace-based environment separation to replace the current practice of maintaining separate folders.
5. Add proper resource tagging using merge() functions to combine default and environment-specific tags.
6. Configure remote state backend with S3 and DynamoDB table locking, migrating from local state files.
7. Optimize provider configuration by removing 12 redundant provider blocks and using provider aliases.
8. Implement data sources to dynamically fetch VPC and subnet information instead of hardcoding IDs.
9. Add lifecycle rules with create_before_destroy for zero-downtime updates.
10. Create outputs that expose only necessary values using sensitive flags where appropriate.

Expected output: A refactored Terraform configuration with modular structure, efficient resource definitions, proper state management, and workspace-based environment handling that reduces code duplication by at least 60% while maintaining the same infrastructure functionality.

## Context

A fintech startup's Terraform codebase has grown organically over 18 months, resulting in duplicate resources, hardcoded values, and inefficient module structures. The DevOps team needs to refactor the existing infrastructure code to reduce deployment times and improve maintainability while ensuring zero downtime during the transition.

## Prerequisites

AWS multi-account setup deployed across us-east-1 and us-east-1 regions with existing EC2 instances in Auto Scaling Groups behind ALB, RDS PostgreSQL Multi-AZ deployments, and VPCs with public/private subnet tiers. Requires Terraform 1.5+ with AWS provider 5.x, configured AWS CLI with appropriate IAM permissions for state bucket creation and resource management. Existing infrastructure includes 3 environments (dev, staging, prod) currently managed through separate directories with significant code duplication.

## Constraints

- Must maintain backward compatibility with existing resource names to prevent recreation
- State migration must be performed without any resource destruction or downtime
- Module versions must be pinned to ensure reproducible deployments
- All sensitive values must be managed through Terraform variables, not hardcoded
- Remote state configuration must include encryption at rest and versioning enabled
- Refactored code must pass terraform fmt and terraform validate checks
- Resource dependencies must be explicitly defined to prevent race conditions
