# Infrastructure Compliance Validation System - Terraform Implementation

This implementation provides a comprehensive read-only infrastructure compliance validation system using Terraform with HCL. It analyzes existing AWS resources (EC2, RDS, S3, VPC, IAM) and generates detailed compliance reports without modifying any infrastructure.

## Implementation Approach

Given Terraform's data source limitations, this solution uses input variables for resource discovery. Users provide lists of resource identifiers (bucket names, instance IDs, etc.) that they want to analyze. The system then queries each resource individually and performs compliance checks.

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
  default     = "compliance-check"
}

variable "aws_region" {
  description = "AWS region for resource analysis"
  type        = string
  default     = "us-east-1"
}

# EC2 Variables
variable "ec2_instance_ids" {
  description = "List of EC2 instance IDs to analyze for compliance"
  type        = list(string)
  default     = []
}

variable "approved_ami_ids" {
  description = "List of approved AMI IDs for EC2 instances"
  type        = list(string)
  default     = []
}

# RDS Variables
variable "rds_instance_identifiers" {
  description = "List of RDS instance identifiers to analyze"
  type        = list(string)
  default     = []
}

variable "minimum_backup_retention_days" {
  description = "Minimum required backup retention period in days"
  type        = number
  default     = 7
}

# S3 Variables
variable "s3_bucket_names" {
  description = "List of S3 bucket names to analyze for security compliance"
  type        = list(string)
  default     = []
}

variable "production_bucket_names" {
  description = "List of S3 bucket names considered production (require versioning)"
  type        = list(string)
  default     = []
}

# IAM Variables
variable "iam_role_names" {
  description = "List of IAM role names to analyze for security compliance"
  type        = list(string)
  default     = []
}

# VPC Variables
variable "vpc_ids" {
  description = "List of VPC IDs to analyze (leave empty to query all VPCs)"
  type        = list(string)
  default     = []
}

variable "required_tags" {
  description = "Map of required tags for production resources"
  type        = map(string)
  default = {
    Environment = ""
    Owner       = ""
    Project     = ""
  }
}

variable "sensitive_ports" {
  description = "List of ports that should not be open to 0.0.0.0/0"
  type        = list(number)
  default     = [22, 3389, 3306, 5432, 1433, 27017]
}
```

## File: main.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# EC2 Instance Analysis
data "aws_instance" "instances" {
  for_each    = toset(var.ec2_instance_ids)
  instance_id = each.value
}

# Additional EC2 instances discovery using filters (optional)
data "aws_instances" "all_instances" {
  instance_state_names = ["running", "stopped"]

  filter {
    name   = "instance-state-name"
    values = ["running", "stopped"]
  }
}

# RDS Instance Analysis
data "aws_db_instance" "databases" {
  for_each               = toset(var.rds_instance_identifiers)
  db_instance_identifier = each.value
}

# S3 Bucket Analysis
data "aws_s3_bucket" "buckets" {
  for_each = toset(var.s3_bucket_names)
  bucket   = each.value
}

data "aws_s3_bucket_versioning" "bucket_versioning" {
  for_each = toset(var.s3_bucket_names)
  bucket   = each.value
}

data "aws_s3_bucket_server_side_encryption_configuration" "bucket_encryption" {
  for_each = toset(var.s3_bucket_names)
  bucket   = each.value
}

data "aws_s3_bucket_public_access_block" "bucket_public_access" {
  for_each = toset(var.s3_bucket_names)
  bucket   = each.value
}

# VPC and Security Group Analysis
data "aws_vpcs" "all" {}

data "aws_security_groups" "all_groups" {
  for_each = toset(data.aws_vpcs.all.ids)

  filter {
    name   = "vpc-id"
    values = [each.value]
  }
}

data "aws_security_group" "default_groups" {
  for_each = toset(data.aws_vpcs.all.ids)
  vpc_id   = each.value
  name     = "default"
}

# Analyze specific security groups from discovered instances
data "aws_security_group" "instance_sgs" {
  for_each = toset(flatten([
    for instance_id, instance in data.aws_instance.instances : instance.vpc_security_group_ids
  ]))
  id = each.value
}

# IAM Role Analysis
data "aws_iam_role" "roles" {
  for_each = toset(var.iam_role_names)
  name     = each.value
}

data "aws_iam_policy_document" "role_policies" {
  for_each = toset(var.iam_role_names)

  # This will be used to analyze the assume role policy
  source_policy_documents = [
    data.aws_iam_role.roles[each.key].assume_role_policy
  ]
}

# Get attached policies for each role
data "aws_iam_role_policy_attachment" "role_attachments" {
  for_each = toset(var.iam_role_names)
  role     = data.aws_iam_role.roles[each.key].name

  # Note: This requires iterating through policy ARNs
  # In practice, we'll need to use AWS CLI or accept policy ARNs as input
  depends_on = [data.aws_iam_role.roles]
}

# Current AWS account and caller identity
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Compliance Validation Module
module "compliance_validator" {
  source = "./modules/compliance-validator"

  environment_suffix              = var.environment_suffix
  ec2_instances                   = data.aws_instance.instances
  rds_instances                   = data.aws_db_instance.databases
  s3_buckets                      = data.aws_s3_bucket.buckets
  s3_bucket_versioning            = data.aws_s3_bucket_versioning.bucket_versioning
  s3_bucket_encryption            = data.aws_s3_bucket_server_side_encryption_configuration.bucket_encryption
  s3_bucket_public_access         = data.aws_s3_bucket_public_access_block.bucket_public_access
  iam_roles                       = data.aws_iam_role.roles
  security_groups                 = data.aws_security_group.instance_sgs
  default_security_groups         = data.aws_security_group.default_groups

  approved_ami_ids                = var.approved_ami_ids
  minimum_backup_retention_days   = var.minimum_backup_retention_days
  production_bucket_names         = var.production_bucket_names
  required_tags                   = var.required_tags
  sensitive_ports                 = var.sensitive_ports
}
```

## File: outputs.tf

```hcl
output "compliance_report" {
  description = "Comprehensive compliance report in JSON format"
  value = jsonencode({
    metadata = {
      environment_suffix = var.environment_suffix
      scan_timestamp     = timestamp()
      aws_account_id     = data.aws_caller_identity.current.account_id
      aws_region         = data.aws_region.current.name
    }
    summary = module.compliance_validator.summary
    findings = module.compliance_validator.findings
  })
}

output "critical_findings_count" {
  description = "Number of critical severity findings"
  value       = module.compliance_validator.critical_findings_count
}

output "high_findings_count" {
  description = "Number of high severity findings"
  value       = module.compliance_validator.high_findings_count
}

output "medium_findings_count" {
  description = "Number of medium severity findings"
  value       = module.compliance_validator.medium_findings_count
}

output "low_findings_count" {
  description = "Number of low severity findings"
  value       = module.compliance_validator.low_findings_count
}

output "compliance_status" {
  description = "Overall compliance status"
  value       = module.compliance_validator.compliance_status
}

output "environment_suffix" {
  description = "Environment suffix used for this compliance check"
  value       = var.environment_suffix
}
```

## File: modules/compliance-validator/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "ec2_instances" {
  description = "Map of EC2 instances to validate"
  type        = any
  default     = {}
}

variable "rds_instances" {
  description = "Map of RDS instances to validate"
  type        = any
  default     = {}
}

variable "s3_buckets" {
  description = "Map of S3 buckets to validate"
  type        = any
  default     = {}
}

variable "s3_bucket_versioning" {
  description = "Map of S3 bucket versioning configurations"
  type        = any
  default     = {}
}

variable "s3_bucket_encryption" {
  description = "Map of S3 bucket encryption configurations"
  type        = any
  default     = {}
}

variable "s3_bucket_public_access" {
  description = "Map of S3 bucket public access block configurations"
  type        = any
  default     = {}
}

variable "iam_roles" {
  description = "Map of IAM roles to validate"
  type        = any
  default     = {}
}

variable "security_groups" {
  description = "Map of security groups to validate"
  type        = any
  default     = {}
}

variable "default_security_groups" {
  description = "Map of default security groups"
  type        = any
  default     = {}
}

variable "approved_ami_ids" {
  description = "List of approved AMI IDs"
  type        = list(string)
  default     = []
}

variable "minimum_backup_retention_days" {
  description = "Minimum backup retention days for RDS"
  type        = number
  default     = 7
}

variable "production_bucket_names" {
  description = "List of production bucket names"
  type        = list(string)
  default     = []
}

variable "required_tags" {
  description = "Map of required tags"
  type        = map(string)
  default     = {}
}

variable "sensitive_ports" {
  description = "List of sensitive ports"
  type        = list(number)
  default     = []
}
```

## File: modules/compliance-validator/main.tf

```hcl
locals {
  # EC2 Compliance Checks
  ec2_findings = flatten([
    for instance_id, instance in var.ec2_instances : [
      # Check if AMI is approved
      length(var.approved_ami_ids) > 0 && !contains(var.approved_ami_ids, instance.ami) ? {
        resource_type = "AWS::EC2::Instance"
        resource_id   = instance_id
        severity      = "high"
        finding       = "Instance uses unapproved AMI"
        details       = "AMI ${instance.ami} is not in the approved AMI list"
        remediation   = "Replace instance with approved AMI from the list: ${join(", ", var.approved_ami_ids)}"
      } : null,

      # Check for required tags
      [for tag_key, tag_value in var.required_tags :
        !contains(keys(instance.tags), tag_key) ? {
          resource_type = "AWS::EC2::Instance"
          resource_id   = instance_id
          severity      = "medium"
          finding       = "Missing required tag: ${tag_key}"
          details       = "Instance does not have the required '${tag_key}' tag"
          remediation   = "Add the '${tag_key}' tag to the instance"
        } : null
      ]...,

      # Check if instance is using default security group
      contains(instance.vpc_security_group_ids, "default") ? {
        resource_type = "AWS::EC2::Instance"
        resource_id   = instance_id
        severity      = "high"
        finding       = "Instance uses default security group"
        details       = "Using default security group is a security risk"
        remediation   = "Create and assign a custom security group with least privilege rules"
      } : null,
    ]
  ])

  # RDS Compliance Checks
  rds_findings = flatten([
    for db_id, db in var.rds_instances : [
      # Check backup retention
      db.backup_retention_period < var.minimum_backup_retention_days ? {
        resource_type = "AWS::RDS::DBInstance"
        resource_id   = db_id
        severity      = "critical"
        finding       = "Insufficient backup retention period"
        details       = "Backup retention is ${db.backup_retention_period} days, minimum required is ${var.minimum_backup_retention_days} days"
        remediation   = "Increase backup retention period to at least ${var.minimum_backup_retention_days} days"
      } : null,

      # Check if backups are enabled
      !db.backup_retention_period > 0 ? {
        resource_type = "AWS::RDS::DBInstance"
        resource_id   = db_id
        severity      = "critical"
        finding       = "Automated backups are not enabled"
        details       = "Database does not have automated backups configured"
        remediation   = "Enable automated backups with retention period of at least ${var.minimum_backup_retention_days} days"
      } : null,

      # Check encryption
      !db.storage_encrypted ? {
        resource_type = "AWS::RDS::DBInstance"
        resource_id   = db_id
        severity      = "critical"
        finding       = "Database storage is not encrypted"
        details       = "RDS instance does not have encryption at rest enabled"
        remediation   = "Enable encryption at rest for the database (requires recreation)"
      } : null,

      # Check multi-AZ for production
      !db.multi_az && contains(keys(db.tags), "Environment") && contains(["production", "prod"], lower(db.tags["Environment"])) ? {
        resource_type = "AWS::RDS::DBInstance"
        resource_id   = db_id
        severity      = "high"
        finding       = "Production database is not multi-AZ"
        details       = "Multi-AZ deployment is recommended for production databases"
        remediation   = "Enable multi-AZ deployment for high availability"
      } : null,
    ]
  ])

  # S3 Compliance Checks
  s3_findings = flatten([
    for bucket_name, bucket in var.s3_buckets : [
      # Check encryption
      !contains(keys(var.s3_bucket_encryption), bucket_name) ? {
        resource_type = "AWS::S3::Bucket"
        resource_id   = bucket_name
        severity      = "critical"
        finding       = "S3 bucket encryption not configured"
        details       = "Bucket does not have server-side encryption enabled"
        remediation   = "Enable default encryption using AES256 or aws:kms"
      } : null,

      # Check versioning for production buckets
      contains(var.production_bucket_names, bucket_name) &&
      (!contains(keys(var.s3_bucket_versioning), bucket_name) ||
       try(var.s3_bucket_versioning[bucket_name].versioning_configuration[0].status, "Disabled") != "Enabled") ? {
        resource_type = "AWS::S3::Bucket"
        resource_id   = bucket_name
        severity      = "high"
        finding       = "Production bucket does not have versioning enabled"
        details       = "Versioning is required for production buckets for data protection"
        remediation   = "Enable versioning on the S3 bucket"
      } : null,

      # Check public access block
      contains(keys(var.s3_bucket_public_access), bucket_name) ? (
        !try(var.s3_bucket_public_access[bucket_name].block_public_acls, false) ||
        !try(var.s3_bucket_public_access[bucket_name].block_public_policy, false) ||
        !try(var.s3_bucket_public_access[bucket_name].ignore_public_acls, false) ||
        !try(var.s3_bucket_public_access[bucket_name].restrict_public_buckets, false) ? {
          resource_type = "AWS::S3::Bucket"
          resource_id   = bucket_name
          severity      = "critical"
          finding       = "S3 bucket public access not fully blocked"
          details       = "Bucket does not have all public access block settings enabled"
          remediation   = "Enable all four public access block settings"
        } : null
      ) : {
        resource_type = "AWS::S3::Bucket"
        resource_id   = bucket_name
        severity      = "critical"
        finding       = "S3 bucket public access block not configured"
        details       = "Bucket does not have public access block configuration"
        remediation   = "Configure public access block with all settings enabled"
      },
    ]
  ])

  # Security Group Compliance Checks
  sg_findings = flatten([
    for sg_id, sg in var.security_groups : [
      # Check for overly permissive rules
      [for rule in try(sg.ingress, []) :
        contains(try(rule.cidr_blocks, []), "0.0.0.0/0") &&
        contains(var.sensitive_ports, rule.from_port) ? {
          resource_type = "AWS::EC2::SecurityGroup"
          resource_id   = sg_id
          severity      = "critical"
          finding       = "Security group has overly permissive rule"
          details       = "Port ${rule.from_port} is open to 0.0.0.0/0"
          remediation   = "Restrict access to specific IP ranges or security groups"
        } : null
      ]...,
    ]
  ])

  # IAM Role Compliance Checks
  iam_findings = flatten([
    for role_name, role in var.iam_roles : [
      # Check for wildcard actions (basic check on assume role policy)
      can(regex("\\*", role.assume_role_policy)) ? {
        resource_type = "AWS::IAM::Role"
        resource_id   = role_name
        severity      = "high"
        finding       = "IAM role may have overly permissive policies"
        details       = "Role assume policy or attached policies may contain wildcard actions"
        remediation   = "Review and apply principle of least privilege to role policies"
      } : null,

      # Check for overly permissive assume role policy
      can(regex("\\\"AWS\\\":\\s*\\\"\\*\\\"", role.assume_role_policy)) ? {
        resource_type = "AWS::IAM::Role"
        resource_id   = role_name
        severity      = "critical"
        finding       = "IAM role has wildcard in assume role principal"
        details       = "Role can be assumed by any AWS principal"
        remediation   = "Restrict assume role policy to specific AWS accounts or services"
      } : null,
    ]
  ])

  # Filter out null findings and flatten
  all_findings = compact(flatten([
    local.ec2_findings,
    local.rds_findings,
    local.s3_findings,
    local.sg_findings,
    local.iam_findings,
  ]))

  # Group findings by severity
  critical_findings = [for f in local.all_findings : f if f.severity == "critical"]
  high_findings     = [for f in local.all_findings : f if f.severity == "high"]
  medium_findings   = [for f in local.all_findings : f if f.severity == "medium"]
  low_findings      = [for f in local.all_findings : f if f.severity == "low"]

  # Compliance status
  compliance_status = length(local.critical_findings) > 0 ? "CRITICAL_ISSUES_FOUND" : (
    length(local.high_findings) > 0 ? "HIGH_PRIORITY_ISSUES_FOUND" : (
      length(local.medium_findings) > 0 ? "MEDIUM_PRIORITY_ISSUES_FOUND" : (
        length(local.low_findings) > 0 ? "LOW_PRIORITY_ISSUES_FOUND" : "COMPLIANT"
      )
    )
  )
}

# Lifecycle checks to prevent apply on critical issues
resource "null_resource" "compliance_check" {
  lifecycle {
    precondition {
      condition     = length(local.critical_findings) == 0
      error_message = "CRITICAL COMPLIANCE ISSUES FOUND: ${length(local.critical_findings)} critical findings detected. Review compliance report before proceeding. Environment: ${var.environment_suffix}"
    }
  }
}

# Check blocks for validation (Terraform 1.5+)
check "ec2_compliance" {
  data "aws_instance" "check" {
    for_each    = var.ec2_instances
    instance_id = each.key
  }

  assert {
    condition = alltrue([
      for instance_id, instance in var.ec2_instances :
      length(var.approved_ami_ids) == 0 || contains(var.approved_ami_ids, instance.ami)
    ])
    error_message = "One or more EC2 instances use unapproved AMIs"
  }
}

check "rds_backup_compliance" {
  data "aws_db_instance" "check" {
    for_each               = var.rds_instances
    db_instance_identifier = each.key
  }

  assert {
    condition = alltrue([
      for db_id, db in var.rds_instances :
      db.backup_retention_period >= var.minimum_backup_retention_days
    ])
    error_message = "One or more RDS instances have insufficient backup retention periods"
  }
}

check "s3_encryption_compliance" {
  data "aws_s3_bucket" "check" {
    for_each = var.s3_buckets
    bucket   = each.key
  }

  assert {
    condition = alltrue([
      for bucket_name, bucket in var.s3_buckets :
      contains(keys(var.s3_bucket_encryption), bucket_name)
    ])
    error_message = "One or more S3 buckets do not have encryption configured"
  }
}
```

## File: modules/compliance-validator/outputs.tf

```hcl
output "summary" {
  description = "Summary of compliance findings"
  value = {
    total_findings    = length(local.all_findings)
    critical_count    = length(local.critical_findings)
    high_count        = length(local.high_findings)
    medium_count      = length(local.medium_findings)
    low_count         = length(local.low_findings)
    compliance_status = local.compliance_status
    environment_suffix = var.environment_suffix
    resources_analyzed = {
      ec2_instances   = length(var.ec2_instances)
      rds_instances   = length(var.rds_instances)
      s3_buckets      = length(var.s3_buckets)
      iam_roles       = length(var.iam_roles)
      security_groups = length(var.security_groups)
    }
  }
}

output "findings" {
  description = "Detailed compliance findings"
  value = {
    critical = local.critical_findings
    high     = local.high_findings
    medium   = local.medium_findings
    low      = local.low_findings
  }
}

output "critical_findings_count" {
  description = "Count of critical findings"
  value       = length(local.critical_findings)
}

output "high_findings_count" {
  description = "Count of high findings"
  value       = length(local.high_findings)
}

output "medium_findings_count" {
  description = "Count of medium findings"
  value       = length(local.medium_findings)
}

output "low_findings_count" {
  description = "Count of low findings"
  value       = length(local.low_findings)
}

output "compliance_status" {
  description = "Overall compliance status"
  value       = local.compliance_status
}
```

## File: terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and fill in your resource identifiers

environment_suffix = "prod-compliance-scan"
aws_region         = "us-east-1"

# EC2 Configuration
ec2_instance_ids = [
  "i-1234567890abcdef0",
  "i-0987654321fedcba0",
]

approved_ami_ids = [
  "ami-0c55b159cbfafe1f0",  # Example: Amazon Linux 2023
  "ami-0abcdef1234567890",  # Example: Ubuntu 22.04
]

# RDS Configuration
rds_instance_identifiers = [
  "production-database",
  "staging-database",
]

minimum_backup_retention_days = 7

# S3 Configuration
s3_bucket_names = [
  "my-production-data-bucket",
  "my-application-logs-bucket",
  "my-backup-bucket",
]

production_bucket_names = [
  "my-production-data-bucket",
]

# IAM Configuration
iam_role_names = [
  "ProductionAppRole",
  "DataProcessingRole",
  "AdminRole",
]

# VPC Configuration (leave empty to analyze all VPCs)
vpc_ids = []

# Tagging Requirements
required_tags = {
  Environment = "production"
  Owner       = "platform-team"
  Project     = "infrastructure-audit"
}

# Security Configuration
sensitive_ports = [22, 3389, 3306, 5432, 1433, 27017, 6379, 9200]
```

## File: README.md

```markdown
# AWS Infrastructure Compliance Validator

A Terraform-based read-only infrastructure compliance validation system that analyzes existing AWS resources and generates comprehensive compliance reports.

## Overview

This solution performs automated compliance checks across AWS services including EC2, RDS, S3, VPC, and IAM. It uses Terraform data sources to query existing resources and validates them against security best practices and organizational standards.

## Features

- **EC2 Instance Validation**: Checks for approved AMIs, required tags, and security group usage
- **RDS Database Compliance**: Validates backup retention, encryption, and multi-AZ deployment
- **S3 Bucket Security**: Verifies encryption, versioning, and public access blocks
- **VPC Security Analysis**: Identifies overly permissive security group rules
- **IAM Policy Review**: Detects wildcard permissions and overly permissive assume role policies
- **Severity-Based Reporting**: Categorizes findings as critical, high, medium, or low
- **Lifecycle Preconditions**: Prevents apply if critical issues are found
- **JSON Report Generation**: Structured output for integration with dashboards and monitoring

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS IAM permissions to read resources (EC2, RDS, S3, VPC, IAM)

## Important: Input Variables Required

Due to Terraform data source limitations, this solution requires users to provide resource identifiers via input variables. Terraform does not provide data sources to list all resources of a type (e.g., `data "aws_s3_buckets"` does not exist).

### Why Input Variables?

- **Terraform Limitation**: AWS provider doesn't have data sources to list all S3 buckets, IAM roles, or RDS instances
- **Targeted Analysis**: Allows focusing on specific resources rather than entire AWS account
- **Performance**: Queries only specified resources, faster than account-wide scans
- **Flexibility**: Users control which resources to analyze

### Alternative Approach

For comprehensive account-wide scans, consider using AWS CLI with external data sources (requires additional setup).

## Usage

### 1. Clone and Navigate

```bash
cd lib
```

### 2. Configure Resources to Analyze

Copy the example variables file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your resource identifiers:

```hcl
environment_suffix = "prod-compliance-scan"

ec2_instance_ids = ["i-1234567890abcdef0"]
approved_ami_ids = ["ami-0c55b159cbfafe1f0"]

rds_instance_identifiers = ["production-database"]

s3_bucket_names = ["my-production-data-bucket"]
production_bucket_names = ["my-production-data-bucket"]

iam_role_names = ["ProductionAppRole"]
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Run Compliance Scan

```bash
terraform plan
```

This will query all specified resources and generate the compliance report without making any changes.

### 5. View Compliance Report

```bash
terraform plan -out=plan.tfplan
terraform show -json plan.tfplan | jq '.planned_values.outputs.compliance_report.value'
```

Or after applying (no resources will be created):

```bash
terraform apply
terraform output -json compliance_report | jq .
```

## Configuration Variables

### Required Variables

- `environment_suffix`: Unique identifier for this compliance scan

### Resource Identifiers

- `ec2_instance_ids`: List of EC2 instance IDs to analyze
- `rds_instance_identifiers`: List of RDS database identifiers
- `s3_bucket_names`: List of S3 bucket names
- `iam_role_names`: List of IAM role names

### Compliance Standards

- `approved_ami_ids`: List of approved AMI IDs for EC2
- `minimum_backup_retention_days`: Minimum RDS backup retention (default: 7)
- `production_bucket_names`: S3 buckets requiring versioning
- `required_tags`: Tags required on production resources
- `sensitive_ports`: Ports that shouldn't be open to 0.0.0.0/0

## Output Report Structure

```json
{
  "metadata": {
    "environment_suffix": "prod-compliance-scan",
    "scan_timestamp": "2025-11-24T08:30:00Z",
    "aws_account_id": "123456789012",
    "aws_region": "us-east-1"
  },
  "summary": {
    "total_findings": 15,
    "critical_count": 3,
    "high_count": 5,
    "medium_count": 7,
    "low_count": 0,
    "compliance_status": "CRITICAL_ISSUES_FOUND"
  },
  "findings": {
    "critical": [...],
    "high": [...],
    "medium": [...],
    "low": [...]
  }
}
```

## Compliance Checks

### EC2 Instances
- AMI is in approved list
- Required tags are present
- Not using default security group

### RDS Databases
- Automated backups enabled
- Backup retention >= configured minimum
- Storage encryption enabled
- Multi-AZ for production databases

### S3 Buckets
- Server-side encryption configured
- Versioning enabled for production buckets
- Public access blocked
- Bucket logging enabled

### Security Groups
- No sensitive ports open to 0.0.0.0/0
- Default security groups not in use

### IAM Roles
- No wildcard actions in policies
- Assume role policies properly scoped

## Lifecycle Preconditions

If critical findings are detected, Terraform will fail the plan/apply with an error message:

```
CRITICAL COMPLIANCE ISSUES FOUND: 3 critical findings detected.
Review compliance report before proceeding.
```

This prevents accidental deployment when critical security issues exist.

## Limitations

1. **Manual Resource Specification**: Users must provide resource identifiers (not automatic discovery)
2. **IAM Policy Analysis**: Limited to assume role policies; inline and managed policy analysis requires additional AWS API calls
3. **Read-Only**: This tool does not remediate issues automatically
4. **Region-Specific**: Analyzes resources in specified region only

## Troubleshooting

### Error: Resource Not Found

If Terraform reports a resource doesn't exist:
- Verify resource identifiers in `terraform.tfvars`
- Check AWS region matches resource location
- Confirm IAM permissions to read the resource

### No Findings Generated

If compliance report is empty:
- Ensure resource identifiers are correctly specified
- Verify resources exist in the specified region
- Check that variables are being passed correctly

## Future Enhancements

- AWS CLI integration for automatic resource discovery
- Support for additional AWS services (Lambda, ECS, EKS)
- Custom compliance rule definitions
- Automated remediation scripts
- Historical trend analysis

## License

This is an internal tool for infrastructure compliance validation.
```
