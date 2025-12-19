# Infrastructure Analysis Module - Terraform HCL Implementation

This module provides comprehensive infrastructure analysis and compliance validation for existing AWS resources without modifying them.

## File: lib/main.tf

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

# Local values for approved instance types and cost calculations
locals {
  # Approved EC2 instance types
  approved_instance_types = ["t3.micro", "t3.small", "t3.medium"]

  # Monthly cost estimates for us-east-1 (730 hours/month)
  instance_costs = {
    "t3.micro"   = 7.30    # $0.01/hour
    "t3.small"   = 14.60   # $0.02/hour
    "t3.medium"  = 29.20   # $0.04/hour
    "t3.large"   = 58.40   # $0.08/hour
    "t3.xlarge"  = 116.80  # $0.16/hour
    "t3.2xlarge" = 233.60  # $0.32/hour
    "t2.micro"   = 8.47    # $0.0116/hour
    "t2.small"   = 16.79   # $0.023/hour
    "t2.medium"  = 33.58   # $0.046/hour
    "m5.large"   = 69.35   # $0.095/hour
    "m5.xlarge"  = 138.70  # $0.19/hour
  }

  # Required tags
  required_tags = ["Environment", "Owner", "CostCenter", "Project"]

  # Ports allowed for unrestricted access
  allowed_public_ports = [80, 443]

  # Process EC2 instances
  ec2_instances = {
    for id in var.ec2_instance_ids : id => {
      id            = id
      instance_type = try(data.aws_instance.ec2_instances[id].instance_type, "unknown")
      tags          = try(data.aws_instance.ec2_instances[id].tags, {})
      state         = try(data.aws_instance.ec2_instances[id].instance_state, "unknown")
    }
  }

  # EC2 validation results
  ec2_type_violations = {
    for id, instance in local.ec2_instances :
    id => instance.instance_type
    if !contains(local.approved_instance_types, instance.instance_type) && instance.state == "running"
  }

  ec2_costs = {
    for id, instance in local.ec2_instances :
    id => lookup(local.instance_costs, instance.instance_type, 100.0)
    if instance.state == "running"
  }

  ec2_cost_warnings = {
    for id, cost in local.ec2_costs :
    id => cost
    if cost > 100.0
  }

  total_ec2_cost = sum([for cost in values(local.ec2_costs) : cost])

  # Process RDS databases
  rds_databases = {
    for id in var.rds_db_instance_ids : id => {
      id                      = id
      backup_enabled          = try(data.aws_db_instance.rds_instances[id].backup_retention_period > 0, false)
      backup_retention_period = try(data.aws_db_instance.rds_instances[id].backup_retention_period, 0)
      tags                    = try(data.aws_db_instance.rds_instances[id].tags, {})
    }
  }

  # RDS validation results
  rds_backup_violations = {
    for id, db in local.rds_databases :
    id => {
      backup_enabled = db.backup_enabled
      retention_days = db.backup_retention_period
      compliant      = db.backup_enabled && db.backup_retention_period >= 7
    }
    if !db.backup_enabled || db.backup_retention_period < 7
  }

  # Process S3 buckets
  s3_buckets = {
    for name in var.s3_bucket_names : name => {
      name               = name
      versioning_enabled = try(data.aws_s3_bucket_versioning.s3_buckets[name].versioning_configuration[0].status == "Enabled", false)
      encryption_enabled = try(length(data.aws_s3_bucket_server_side_encryption_configuration.s3_buckets[name].rule) > 0, false)
      tags               = try(data.aws_s3_bucket.s3_buckets[name].tags, {})
    }
  }

  # S3 validation results
  s3_compliance_violations = {
    for name, bucket in local.s3_buckets :
    name => {
      versioning_enabled = bucket.versioning_enabled
      encryption_enabled = bucket.encryption_enabled
      compliant          = bucket.versioning_enabled && bucket.encryption_enabled
    }
    if !bucket.versioning_enabled || !bucket.encryption_enabled
  }

  # Process Security Groups
  security_groups = {
    for id in var.security_group_ids : id => {
      id      = id
      name    = try(data.aws_security_group.security_groups[id].name, "unknown")
      ingress = try(data.aws_security_group.security_groups[id].ingress, [])
      tags    = try(data.aws_security_group.security_groups[id].tags, {})
    }
  }

  # Security group validation - find unrestricted rules
  sg_violations = merge([
    for sg_id, sg in local.security_groups : {
      for idx, rule in sg.ingress :
      "${sg_id}-${idx}" => {
        security_group_id   = sg_id
        security_group_name = sg.name
        from_port           = rule.from_port
        to_port             = rule.to_port
        protocol            = rule.protocol
        cidr_blocks         = rule.cidr_blocks
      }
      if contains(rule.cidr_blocks, "0.0.0.0/0") &&
      !contains(local.allowed_public_ports, rule.from_port)
    }
  ]...)

  # Tag compliance checking
  all_resources = merge(
    { for id, instance in local.ec2_instances : "ec2-${id}" => instance.tags },
    { for id, db in local.rds_databases : "rds-${id}" => db.tags },
    { for name, bucket in local.s3_buckets : "s3-${name}" => bucket.tags }
  )

  resources_with_tag_violations = {
    for resource_id, tags in local.all_resources :
    resource_id => [
      for required_tag in local.required_tags :
      required_tag
      if !contains(keys(tags), required_tag)
    ]
    if length([
      for required_tag in local.required_tags :
      required_tag
      if !contains(keys(tags), required_tag)
    ]) > 0
  }

  # Compliance metrics
  total_resources     = length(local.all_resources)
  compliant_resources = local.total_resources - length(local.resources_with_tag_violations)
  compliance_percentage = local.total_resources > 0 ? floor((local.compliant_resources / local.total_resources) * 100) : 0

  # Overall compliance summary
  total_violations = (
    length(local.ec2_type_violations) +
    length(local.rds_backup_violations) +
    length(local.s3_compliance_violations) +
    length(local.sg_violations) +
    length(local.resources_with_tag_violations)
  )
}

# Data sources for EC2 instances
data "aws_instance" "ec2_instances" {
  for_each = toset(var.ec2_instance_ids)

  instance_id = each.value
}

# Data sources for RDS databases
data "aws_db_instance" "rds_instances" {
  for_each = toset(var.rds_db_instance_ids)

  db_instance_identifier = each.value
}

# Data sources for S3 buckets
data "aws_s3_bucket" "s3_buckets" {
  for_each = toset(var.s3_bucket_names)

  bucket = each.value
}

data "aws_s3_bucket_versioning" "s3_buckets" {
  for_each = toset(var.s3_bucket_names)

  bucket = each.value
}

data "aws_s3_bucket_server_side_encryption_configuration" "s3_buckets" {
  for_each = toset(var.s3_bucket_names)

  bucket = each.value
}

# Data sources for Security Groups
data "aws_security_group" "security_groups" {
  for_each = toset(var.security_group_ids)

  id = each.value
}
```

## File: lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for analysis"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource discovery (e.g., dev, staging, prod)"
  type        = string
  default     = ""
}

variable "ec2_instance_ids" {
  description = "List of EC2 instance IDs to analyze"
  type        = list(string)
  default     = []
}

variable "rds_db_instance_ids" {
  description = "List of RDS database instance identifiers to analyze"
  type        = list(string)
  default     = []
}

variable "s3_bucket_names" {
  description = "List of S3 bucket names to analyze"
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "List of security group IDs to analyze"
  type        = list(string)
  default     = []
}
```

## File: lib/outputs.tf

```hcl
# EC2 Compliance Outputs
output "ec2_instance_analysis" {
  description = "EC2 instance compliance analysis"
  value = {
    total_instances = length(local.ec2_instances)
    approved_types  = local.approved_instance_types
    violations = {
      unapproved_instance_types = local.ec2_type_violations
      cost_warnings             = local.ec2_cost_warnings
    }
    cost_analysis = {
      individual_costs   = local.ec2_costs
      total_monthly_cost = local.total_ec2_cost
    }
    compliance_status = length(local.ec2_type_violations) == 0 ? "PASS" : "FAIL"
  }
}

# RDS Compliance Outputs
output "rds_database_analysis" {
  description = "RDS database compliance analysis"
  value = {
    total_databases = length(local.rds_databases)
    violations = {
      backup_compliance_failures = local.rds_backup_violations
    }
    compliance_status = length(local.rds_backup_violations) == 0 ? "PASS" : "FAIL"
  }
}

# S3 Compliance Outputs
output "s3_bucket_analysis" {
  description = "S3 bucket compliance analysis"
  value = {
    total_buckets = length(local.s3_buckets)
    violations = {
      security_compliance_failures = local.s3_compliance_violations
    }
    compliance_status = length(local.s3_compliance_violations) == 0 ? "PASS" : "FAIL"
  }
}

# Security Group Compliance Outputs
output "security_group_analysis" {
  description = "Security group compliance analysis"
  value = {
    total_security_groups = length(local.security_groups)
    allowed_public_ports  = local.allowed_public_ports
    violations = {
      unrestricted_access_rules = local.sg_violations
    }
    compliance_status = length(local.sg_violations) == 0 ? "PASS" : "FAIL"
  }
}

# Tagging Compliance Outputs
output "tagging_compliance_analysis" {
  description = "Tagging compliance analysis"
  value = {
    total_resources = local.total_resources
    required_tags   = local.required_tags
    violations = {
      resources_with_missing_tags = local.resources_with_tag_violations
    }
    compliance_metrics = {
      compliant_resources     = local.compliant_resources
      non_compliant_resources = length(local.resources_with_tag_violations)
      compliance_percentage   = local.compliance_percentage
    }
    compliance_status = length(local.resources_with_tag_violations) == 0 ? "PASS" : "FAIL"
  }
}

# Overall Compliance Summary
output "compliance_summary" {
  description = "Overall compliance summary across all checks"
  value = {
    total_resources_analyzed = local.total_resources
    total_violations         = local.total_violations
    compliance_by_category = {
      ec2_instances   = length(local.ec2_type_violations) == 0 ? "PASS" : "FAIL"
      rds_databases   = length(local.rds_backup_violations) == 0 ? "PASS" : "FAIL"
      s3_buckets      = length(local.s3_compliance_violations) == 0 ? "PASS" : "FAIL"
      security_groups = length(local.sg_violations) == 0 ? "PASS" : "FAIL"
      tagging         = length(local.resources_with_tag_violations) == 0 ? "PASS" : "FAIL"
    }
    overall_compliance_percentage = local.compliance_percentage
    overall_status                = local.total_violations == 0 ? "PASS" : "FAIL"
    timestamp                     = timestamp()
  }
}

# Cost Summary
output "cost_summary" {
  description = "Infrastructure cost analysis"
  value = {
    ec2_total_monthly_cost = local.total_ec2_cost
    cost_warnings_count    = length(local.ec2_cost_warnings)
    high_cost_instances    = local.ec2_cost_warnings
  }
}

# Machine-readable JSON output for CI/CD
output "cicd_report" {
  description = "Machine-readable compliance report for CI/CD integration"
  value = jsonencode({
    report_timestamp   = timestamp()
    environment_suffix = var.environment_suffix
    compliance = {
      overall_status        = local.total_violations == 0 ? "PASS" : "FAIL"
      compliance_percentage = local.compliance_percentage
      total_violations      = local.total_violations
    }
    categories = {
      ec2 = {
        status           = length(local.ec2_type_violations) == 0 ? "PASS" : "FAIL"
        violations_count = length(local.ec2_type_violations)
      }
      rds = {
        status           = length(local.rds_backup_violations) == 0 ? "PASS" : "FAIL"
        violations_count = length(local.rds_backup_violations)
      }
      s3 = {
        status           = length(local.s3_compliance_violations) == 0 ? "PASS" : "FAIL"
        violations_count = length(local.s3_compliance_violations)
      }
      security_groups = {
        status           = length(local.sg_violations) == 0 ? "PASS" : "FAIL"
        violations_count = length(local.sg_violations)
      }
      tagging = {
        status           = length(local.resources_with_tag_violations) == 0 ? "PASS" : "FAIL"
        violations_count = length(local.resources_with_tag_violations)
      }
    }
    costs = {
      total_monthly_estimate    = local.total_ec2_cost
      high_cost_instances_count = length(local.ec2_cost_warnings)
    }
  })
}
```

## File: lib/README.md

```markdown
# Infrastructure Analysis Module

A comprehensive Terraform module for analyzing and validating AWS infrastructure compliance without modifying resources.

## Overview

This module performs non-destructive analysis of existing AWS resources, checking compliance against organizational policies for:
- EC2 instance types and costs
- RDS backup configurations
- S3 bucket security settings
- Security group rules
- Resource tagging standards

## Requirements

- Terraform >= 1.5.0
- AWS Provider ~> 5.0
- Read-only AWS credentials with permissions to describe:
  - EC2 instances
  - RDS databases
  - S3 buckets and configurations
  - Security groups

## Usage

### Basic Usage

```hcl
module "infrastructure_analysis" {
  source = "./lib"

  aws_region         = "us-east-1"
  environment_suffix = "dev"

  ec2_instance_ids = [
    "i-0123456789abcdef0",
    "i-0fedcba9876543210"
  ]

  rds_db_instance_ids = [
    "mydb-dev",
    "analytics-dev"
  ]

  s3_bucket_names = [
    "mybucket-dev",
    "logs-dev"
  ]

  security_group_ids = [
    "sg-0123456789abcdef0",
    "sg-0fedcba9876543210"
  ]
}
```

### Resource Discovery by Environment Suffix

The module supports discovering resources by naming pattern:

```bash
# List EC2 instances with environment suffix
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=*-dev" \
  --query 'Reservations[].Instances[].InstanceId' \
  --output text

# List RDS instances with environment suffix
aws rds describe-db-instances \
  --query 'DBInstances[?contains(DBInstanceIdentifier, `-dev`)].DBInstanceIdentifier' \
  --output text

# List S3 buckets with environment suffix
aws s3api list-buckets \
  --query 'Buckets[?contains(Name, `-dev`)].Name' \
  --output text
```

### Running Analysis

```bash
# Initialize Terraform
terraform init

# Run analysis
terraform plan

# Apply to generate compliance reports
terraform apply -auto-approve

# View specific outputs
terraform output ec2_instance_analysis
terraform output compliance_summary
terraform output cicd_report
```

## Compliance Checks

### EC2 Instance Validation
- **Approved Types**: t3.micro, t3.small, t3.medium
- **Cost Threshold**: Warns for instances > $100/month
- **Status**: Reports violations with instance IDs and types

### RDS Database Validation
- **Backup Enabled**: Automated backups must be enabled
- **Retention Period**: Minimum 7 days
- **Status**: Reports non-compliant databases

### S3 Bucket Security
- **Versioning**: Must be enabled
- **Encryption**: Server-side encryption required
- **Status**: Reports non-compliant buckets

### Security Group Analysis
- **Allowed Public Access**: Ports 80 and 443
- **Violations**: Any other port with 0.0.0.0/0 access
- **Status**: Reports unrestricted access rules

### Tagging Compliance
- **Required Tags**: Environment, Owner, CostCenter, Project
- **Metrics**: Compliance percentage calculated
- **Status**: Reports resources with missing tags

## Outputs

### Detailed Outputs
- `ec2_instance_analysis` - EC2 compliance and cost data
- `rds_database_analysis` - RDS backup compliance
- `s3_bucket_analysis` - S3 security compliance
- `security_group_analysis` - Security group rule violations
- `tagging_compliance_analysis` - Tag compliance metrics

### Summary Outputs
- `compliance_summary` - Overall compliance status
- `cost_summary` - Infrastructure cost analysis
- `cicd_report` - Machine-readable JSON for CI/CD

### Example Output

```json
{
  "compliance_summary": {
    "total_resources_analyzed": 15,
    "total_violations": 3,
    "compliance_by_category": {
      "ec2_instances": "PASS",
      "rds_databases": "FAIL",
      "s3_buckets": "FAIL",
      "security_groups": "PASS",
      "tagging": "FAIL"
    },
    "overall_compliance_percentage": 80,
    "overall_status": "FAIL"
  }
}
```

## Variables

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| aws_region | AWS region for analysis | string | "us-east-1" | no |
| environment_suffix | Environment suffix for resource discovery | string | "" | no |
| ec2_instance_ids | List of EC2 instance IDs to analyze | list(string) | [] | no |
| rds_db_instance_ids | List of RDS database identifiers | list(string) | [] | no |
| s3_bucket_names | List of S3 bucket names | list(string) | [] | no |
| security_group_ids | List of security group IDs | list(string) | [] | no |

## IAM Permissions

Minimum required IAM permissions for read-only analysis:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeSecurityGroups",
        "rds:DescribeDBInstances",
        "s3:GetBucketVersioning",
        "s3:GetEncryptionConfiguration",
        "s3:ListBucket",
        "s3:GetBucketTagging"
      ],
      "Resource": "*"
    }
  ]
}
```

## CI/CD Integration

Use the `cicd_report` output for automated compliance checking:

```bash
# Run analysis and extract CI/CD report
terraform apply -auto-approve
REPORT=$(terraform output -raw cicd_report)

# Parse compliance status
STATUS=$(echo $REPORT | jq -r '.compliance.overall_status')

if [ "$STATUS" != "PASS" ]; then
  echo "Compliance check failed"
  exit 1
fi
```

## Cost Estimates

Monthly cost estimates for EC2 instances (us-east-1):
- t3.micro: $7.30/month
- t3.small: $14.60/month
- t3.medium: $29.20/month
- Other types: Estimated at $100/month (flagged as warnings)

## Limitations

- Analysis only - no resources are created or modified
- Requires existing resources with proper IAM permissions
- Cost estimates are approximate based on on-demand pricing
- Does not analyze stopped EC2 instances for compliance
```
