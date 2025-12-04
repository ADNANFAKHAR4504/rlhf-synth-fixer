PROMPT:

I need you to generate a complete, production-ready Terraform configuration for deploying a fully modular, multi-environment AWS infrastructure for a payment processing application. The Terraform code must satisfy all the requirements below, without exceptions.

Core Requirements

You must generate a modular Terraform setup that can deploy dev, staging, and prod environments consistently, with only environment-specific values varying via tfvars files.

The entire solution must be deployable across any AWS account and any AWS region with zero code changes.

Directory Structure

Use the following structure exactly:

lib/
  provider.tf
  variables.tf
  tap_stack.tf
  dev.tfvars
  staging.tfvars
  prod.tfvars
  modules/
      vpc/
      ecs/
      rds/
      s3/
      kms/
      iam/
      alb/
      cloudwatch/
      sns/


All reusable AWS infrastructure must be implemented inside the modules/ folder.

Critical Constraints (must follow)
1. Cross-Account Executability

The Terraform code must run in any AWS account.

No account-specific values allowed.

No region-specific values hardcoded.

All inputs must use variables, locals, or data sources only.

2. No Hardcoding

Absolutely no hardcoded ARNs, account IDs, resource names, or region names.
Hardcoding is considered a critical violation.

Use:

variables

locals

data "aws_caller_identity"

data "aws_region"

dynamic naming everywhere.

3. Resource Naming Convention

Every AWS resource must include:

${local.project_name}-${resource_type}-${local.region}-${local.environment}


Examples:

"${local.project_name}-KMS-${local.region}-${local.environment}"

"${local.project_name}-VPC-${local.region}-${local.environment}"

This prevents name conflicts across regions and accounts.

4. Tagging Requirements

All AWS resources must include:

locals {
  project_name = "ProjectName"
  environment  = var.environment
  region       = var.aws_region

  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    Owner       = "SecurityTeam"
  }
}


Attach local.common_tags to every resource in every module.

Infrastructure Requirements
VPC (separate per environment)

CIDRs:

dev: 10.0.0.0/16

staging: 10.1.0.0/16

prod: 10.2.0.0/16

Public + private subnets

NAT gateways

Route tables

VPC Peering between all environments

Cross-environment routing controlled via variables

RDS PostgreSQL (Multi-AZ)

Environment-specific instance sizes:

dev: db.t3.micro

staging: db.t3.small

prod: db.m5.large

Backup retention:

dev/staging: 7 days

prod: 30 days

Secrets stored in:

/project-name/db-password/${environment}

ECS Fargate

Per-environment:

CPU

Memory

Task definitions

Autoscaling

Pull DB password from Secrets Manager

Application Load Balancers

HTTP → HTTPS redirect

Target group per service

ALB per environment

S3 Buckets

Naming:

company-${service}-${environment}-${region}


Versioning

Replication from prod → staging

Logging enabled

IAM

Read-only cross-environment monitoring roles

ECS task roles

Replication roles

KMS

One KMS key per environment:

${local.project_name}-KMS-${local.region}-${local.environment}

CloudWatch Dashboards

Aggregate metrics from all three environments

RDS, ECS, ALB, S3

SNS

Environment-specific topics + email subscriptions

Used by CloudWatch alarms

Output Requirements

Your generated output must include:

1. provider.tf

Region and account dynamically detected

No hardcoded values

Uses variables

2. variables.tf

All required inputs for environment overrides

3. tap_stack.tf

Calls all modules

Passes correct variables to modules

Applies local.common_tags uniformly

4. modules /

For each module:

Complete main.tf, variables.tf, outputs.tf

No hardcoded values

All names follow dynamic naming rules

All resources tagged with local.common_tags

5. tfvars Files

Generate:

dev.tfvars

staging.tfvars

prod.tfvars

Include:

CIDRs

ECS CPU/memory

RDS instance size

Backup retention

Email endpoint for SNS

6. No example placeholders

Everything must be workable, deployable Terraform.

Final Instruction

Produce the full Terraform code, fully functional, modular, and ready to apply, following all rules above.

Do not skip modules.
Do not give high-level descriptions.
Provide the actual Terraform source code.