Generate a complete Terraform configuration for a production-grade VPC architecture for a financial payment processing system. Follow all requirements exactly and produce clean, modular, HashiCorp-style Terraform code.

Architecture Requirements

Create a custom VPC using CIDR 10.0.0.0/16 distributed across 3 Availability Zones in the region provided dynamically from the provider — no hardcoding of region.

Implement three subnet tiers per AZ:

Public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24

Private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24

Database subnets: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
Use locals for CIDR mapping rather than hardcoding inside resources.

Deploy one NAT Gateway per AZ in the public subnets for high availability. NAT Instances are not allowed.

Configure route tables:

Public → IGW

Private → NAT Gateway

Database → no internet access (no IGW or NAT routes)

Create VPC Gateway Endpoints for S3 and DynamoDB to reduce egress costs.

Enable VPC Flow Logs with 5-minute aggregation, storing logs in a fully encrypted S3 bucket using KMS CMK.

Implement Network ACLs with explicit DENY-by-default rules:

Allow HTTPS (443)

Allow SSH (22) only from a variable admin CIDR

Allow PostgreSQL (5432) between private and database tiers

Everything else must be denied

Tag every resource with:

Project = PaymentPlatform

Environment = Production

CostCenter = Finance
And merge these with any common tags provided via locals.

Create a Transit Gateway attachment connected to private subnets with correct routing for future multi-region expansion.

Provide structured outputs:

VPC ID

Public subnet IDs

Private subnet IDs

Database subnet IDs

NAT Gateway EIPs

Infrastructure & Coding Requirements
Modular + Organized File Structure

Place all code inside a lib/ directory using these files:

provider.tf

variables.tf

tap_stack.tf (main resource deployment file)

No Hardcoding — Critical

No hardcoded ARNs

No hardcoded AWS Account IDs

No hardcoded region names

No hardcoded principals
Everything must be dynamic and cross-account executable.

Use Locals

Include locals for:

Consistent naming

Project name

Environment

Region reference using var.aws_region

All CIDR blocks

Common tags

Example expected structure:

locals {
  project_name = "PaymentPlatform"
  environment  = var.environment_suffix
  region       = var.aws_region

  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    Owner       = "SecurityTeam"
  }

  vpc_cidr      = "10.0.0.0/16"
  public_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  db_cidrs      = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
}

Encryption Requirements

Create a KMS CMK for encrypting the S3 bucket, Flow Logs, and any future data services.

Provider Requirements

Terraform 1.5+

AWS Provider 5.x

Use data source:
data "aws_availability_zones" to dynamically fetch AZs

Code Style Requirements

Follow HashiCorp style guide

Resources must include:

Descriptions

Explicit dependencies where appropriate

Clear naming

Avoid duplication

Use for_each and maps rather than repeated blocks

Expected Output

Provide:

lib/provider.tf

lib/variables.tf

lib/tap_stack.tf (main infrastructure)

lib/outputs.tf

Explanation of how to apply and customize the configuration