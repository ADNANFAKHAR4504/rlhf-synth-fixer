# Task: Environment Migration

## Background
Your company is migrating a legacy monolithic application from on-premises infrastructure to AWS. The application currently runs on physical servers with local file storage and requires careful state management during the migration to prevent data loss. The migration must be executed in phases to minimize downtime.

## Problem Statement
Create a Terraform configuration to migrate a legacy application from on-premises infrastructure to AWS while maintaining service availability. The configuration must: 1. Define two Terraform workspaces named 'legacy' and 'cloud' to manage both environments. 2. Import existing AWS resources including a security group (sg-0123456789abcdef), an S3 bucket (legacy-app-data-bucket), and an IAM role (LegacyAppRole) into the Terraform state. 3. Configure S3 backend with DynamoDB state locking for the migration project. 4. Create EC2 instances across 2 availability zones using for_each with instance type t3.large and 100GB gp3 EBS volumes. 5. Set up AWS DataSync task to migrate files from on-premises NFS share to S3, including source and destination locations. 6. Configure lifecycle rules with prevent_destroy = true on critical resources like the S3 bucket and RDS instance. 7. Create an Application Load Balancer with target groups for blue-green deployment during cutover. 8. Define outputs for the new infrastructure endpoints including ALB DNS name and S3 bucket ARN. 9. Implement proper tagging strategy with Environment (legacy/cloud) and MigrationPhase (planning/execution/validation) tags. 10. Use data sources to reference the existing VPC and subnets rather than hardcoding values. Expected output: A modular Terraform configuration with separate files for backend configuration, imported resources, compute infrastructure, data migration setup, and load balancer configuration. The configuration should support phased migration with clear separation between legacy and cloud workspaces, enabling rollback capabilities if needed.

## Environment
Migration environment spanning on-premises and AWS us-east-1 region. Existing AWS infrastructure includes a VPC (vpc-0a1b2c3d4e5f) with public subnets (subnet-1a2b3c4d, subnet-5e6f7g8h) across 2 AZs. Requires Terraform 1.5+ with AWS provider 5.x. State stored in S3 bucket with DynamoDB table for locking. Application servers need t3.large instances with 100GB gp3 EBS volumes. DataSync agent deployed on-premises for file migration. Environment uses existing Route 53 hosted zone for DNS management.

## Constraints
1. Use Terraform workspaces to manage both legacy and cloud environments
2. Import at least 3 existing AWS resources into Terraform state
3. Use remote state backend with state locking enabled
4. Implement data migration using AWS DataSync for file transfers
5. Configure lifecycle rules to prevent accidental resource deletion
6. Use count or for_each for creating resources across multiple availability zones
7. Tag all resources with Environment and MigrationPhase tags
8. Use data sources to reference existing VPC and subnet configurations
