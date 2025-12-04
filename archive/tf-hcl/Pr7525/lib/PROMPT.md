Create a fully modular, production-ready Terraform configuration for a multi-environment AWS payment processing application, where each environment has its own VPC created by Terraform, instead of relying on pre-existing VPCs.

The Terraform solution must satisfy the following requirements:

Folder Structure (Mandatory)

Use the following directory structure:

lib/
  provider.tf
  variables.tf
  tap_stack.tf
  dev.tfvars
  staging.tfvars
  prod.tfvars
  modules/
    vpc/
    rds/
    alb/
    asg/
    s3/
    security_groups/
    kms/


Each module must contain:

main.tf

variables.tf

outputs.tf

Configuration must NOT be in a single giant file.

Multi-Environment Setup
Use Terraform workspaces for:

dev

staging

prod

Workspace influences:

naming

VPC CIDRs

instance sizes

ASG scaling ranges

RDS backups

S3 lifecycle durations

KMS key naming

environment prefixes

Infrastructure Resources to Create (per environment)
1. VPC Module

Terraform must create the VPC for each environment.

Environment CIDRs:

dev: 10.0.0.0/16

staging: 10.1.0.0/16

prod: 10.2.0.0/16

Each VPC must include:

2 public subnets

2 private subnets

Internet Gateway

NAT Gateway

Route tables

Proper routing for private/public tiers

Tagging based on environment

No hardcoded region, account ID, or VPC ID.

2. RDS PostgreSQL Module

PostgreSQL engine

Storage encryption enabled

Environment-specific KMS key

Automated backups:

dev: 7 days

staging: 7 days

prod: 30 days

Multi-AZ only in prod

DB subnet group from VPC module

SG rules from security module

Output: DB endpoint

Include prevent_destroy in production:

lifecycle {
  prevent_destroy = var.environment == "prod"
}

3. KMS Module

Create per-environment KMS CMK:

{env}-projectname-kms


Used for:

S3 bucket SSE-KMS

RDS encryption

Future encryption resources

4. Application Load Balancer Module

Internet-facing

Public subnets from VPC module

SG allowing 80/443 inbound

Listener + target group

Output: ALB DNS name

Tags follow naming convention

5. Auto Scaling Group + Launch Template Module

Environment-specific compute sizes:

dev: t3.micro

staging: t3.small

prod: t3.large

ASG scaling:

dev: min 1, max 2

staging: min 2, max 4

prod: min 3, max 10

Other requirements:

IAM role + instance profile

Attach ALB target group

Use lookup maps to switch instance type per env

Tag EC2 instances

6. S3 Module

One S3 bucket per environment:

Versioning enabled

SSE-KMS using the environment KMS key

Lifecycle expiration:

dev: 90 days

staging: 180 days

prod: 365 days

Naming pattern must follow:

{env}-payments-app-data

7. Security Groups Module

Create SGs for:

ALB

EC2/ASG

RDS

Rules:

ALB → EC2

EC2 → RDS

Internet → ALB 80/443

SGs must reference each other dynamically — NO hardcoded SG IDs.

Naming Convention (Mandatory)

All resources must follow:

{env}-{service}-{resource-type}


Examples:

dev-payments-vpc

prod-payments-asg

staging-payments-rds

Tags

Use locals {} to define:

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


All AWS resources must receive these tags.

Remote State (S3 + DynamoDB)

Backend requirements:

Store state in S3

Enable DynamoDB-based locking

No hardcoded bucket name or table name

State path must be workspace-aware:

key = "states/${terraform.workspace}/terraform.tfstate"

Cross-Account Compatibility

All configuration must:

Avoid hardcoded ARNs

Avoid hardcoded account IDs

Avoid hardcoded region names

Use variables or data sources for all dynamic values

This must work across any AWS account without modification.

Outputs

Expose:

VPC ID

Public/private subnets

ALB DNS

RDS endpoint

S3 bucket name

ASG name

SG IDs

Outputs should be environment-specific but module-agnostic.

Environment tfvars Requirements

Create:

dev.tfvars
environment = "dev"
vpc_cidr = "10.0.0.0/16"
instance_type = "t3.micro"
asg_min = 1
asg_max = 2
rds_backup_retention = 7
s3_lifecycle_days = 90

staging.tfvars

(similar but staging values)

prod.tfvars
environment = "prod"
vpc_cidr = "10.2.0.0/16"
instance_type = "t3.large"
asg_min = 3
asg_max = 10
rds_backup_retention = 30
s3_lifecycle_days = 365

What to Deliver

Generate a complete Terraform solution including:

All module code

lib/provider.tf

lib/variables.tf

lib/tap_stack.tf

lib/dev.tfvars, staging.tfvars, prod.tfvars