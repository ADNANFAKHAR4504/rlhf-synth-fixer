# IaC Program Optimization - Terraform with HCL

## Task Overview

Create a Terraform configuration to optimize and fix an existing payment processing infrastructure using Terraform 1.5+ with HCL syntax only.

## Background

A fintech startup has inherited a Terraform configuration for their payment processing infrastructure that was hastily assembled during rapid growth. The configuration works but contains numerous inefficiencies, hardcoded values, and potential race conditions that cause intermittent deployment failures.

## Environment

Production environment in us-east-1 hosting payment processing infrastructure with EC2 instances, RDS PostgreSQL Multi-AZ, Application Load Balancer, and S3 buckets for transaction logs. Current setup uses default VPC with mixed public/private resources. Infrastructure supports 50K daily transactions. Terraform state stored in S3 with DynamoDB locking. CI/CD runs via GitLab with terraform plan on merge requests.

## Requirements

The configuration must accomplish the following optimizations:

1. Refactor repetitive EC2 security group rules that allow ports 80, 443, 8080, 8443 from 10 different CIDR blocks into a single dynamic block.

2. Replace hardcoded AMI IDs, instance types, and availability zones with proper variable definitions and data sources.

3. Fix race condition where RDS instance creation sometimes fails because security group is not ready by adding explicit dependencies.

4. Convert inline IAM role policies for EC2 instances to use aws_iam_policy_document data sources.

5. Consolidate 3 identical S3 buckets (logs-dev, logs-staging, logs-prod) into a single resource using for_each.

6. Add lifecycle ignore_changes for RDS password to prevent forced replacements.

7. Implement proper tagging strategy using merge() function for common and resource-specific tags.

8. Fix output values to mark database endpoints as sensitive and add descriptions.

## Expected Output

A refactored main.tf file demonstrating all optimizations, variables.tf with proper type constraints and defaults, and outputs.tf with corrected output definitions. The configuration should be more maintainable, follow DRY principles, and eliminate deployment race conditions.

## Input File

The legacy configuration will be provided in: legacy-payment-infra.tf

## Constraints

- Must use Terraform 1.5+ with HCL syntax only
- Preserve all existing functionality while refactoring
- Use dynamic blocks to eliminate repetitive security group rules
- Replace all hardcoded values with proper variable definitions
- Implement explicit depends_on where implicit dependencies cause race conditions
- Convert inline IAM policies to data sources or managed policies
- Consolidate duplicate resource definitions using for_each loops
- Add proper lifecycle rules to prevent accidental deletions
- Ensure all outputs use proper descriptions and sensitive flags

## Platform and Language

This task MUST be implemented using:
- Platform: Terraform
- Language: HCL

Do not use any other IaC platform or language.

## Resource Naming

All AWS resources with names MUST include the environmentSuffix variable to prevent collisions across parallel deployments. Use the pattern: resource-name-${var.environment_suffix}

## Destroyability

All resources must be destroyable without manual intervention:
- No DeletionPolicy: Retain or RemovalPolicy.RETAIN
- No deletion_protection = true
- RDS instances must set skip_final_snapshot = true
