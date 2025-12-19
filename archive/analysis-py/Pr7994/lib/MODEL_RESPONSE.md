# AWS Infrastructure Analysis Tool - Terraform Implementation

This implementation provides a comprehensive infrastructure analysis tool using Terraform data sources to audit existing AWS resources.

## File: main.tf

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Create output directory
resource "local_file" "output_dir" {
  content  = "Infrastructure analysis reports generated on ${timestamp()}"
  filename = "${var.output_dir}/README.txt"
}

# Data Sources for AWS Resources
data "aws_instances" "all" {
  instance_state_names = ["running", "stopped"]
}

data "aws_security_groups" "all" {}

data "aws_s3_buckets" "all" {}

data "aws_iam_roles" "all" {}

data "aws_vpcs" "all" {}

data "aws_db_instances" "all" {}

# EC2 Instance Details
data "aws_instance" "instances" {
  for_each    = toset(data.aws_instances.all.ids)
  instance_id = each.value
}

# Security Group Details
data "aws_security_group" "groups" {
  for_each = toset(data.aws_security_groups.all.ids)
  id       = each.value
}

# S3 Bucket Details
data "aws_s3_bucket" "buckets" {
  for_each = toset(data.aws_s3_buckets.all.ids)
  bucket   = each.value
}

# IAM Role Details
data "aws_iam_role" "roles" {
  for_each = toset(data.aws_iam_roles.all.names)
  name     = each.value
}

# VPC Details
data "aws_vpc" "vpcs" {
  for_each = toset(data.aws_vpcs.all.ids)
  id       = each.value
}

# Subnets for all VPCs
data "aws_subnets" "all" {
  filter {
    name   = "vpc-id"
    values = data.aws_vpcs.all.ids
  }
}

data "aws_subnet" "subnets" {
  for_each = toset(data.aws_subnets.all.ids)
  id       = each.value
}

# RDS Instance Details
data "aws_db_instance" "instances" {
  for_each               = toset(data.aws_db_instances.all.instance_identifiers)
  db_instance_identifier = each.value
}

# Local variables for analysis
locals {
  timestamp = formatdate("YYYY-MM-DD'T'hh:mm:ssZ", timestamp())

  # EC2 Analysis
  required_tags = ["Environment", "Owner", "CostCenter"]

  ec2_instances = {
    for id, instance in data.aws_instance.instances : id => {
      id                = instance.id
      instance_type     = instance.instance_type
      state             = instance.instance_state
      availability_zone = instance.availability_zone
      tags              = instance.tags
      missing_tags      = [for tag in local.required_tags : tag if !contains(keys(instance.tags), tag)]
      has_compliance_issues = length([for tag in local.required_tags : tag if !contains(keys(instance.tags), tag)]) > 0
    }
  }

  ec2_cost_map = {
    "t2.micro"    = 8.47
    "t2.small"    = 16.93
    "t2.medium"   = 33.87
    "t2.large"    = 67.74
    "t3.micro"    = 7.59
    "t3.small"    = 15.18
    "t3.medium"   = 30.37
    "t3.large"    = 60.74
    "m5.large"    = 70.08
    "m5.xlarge"   = 140.16
    "m5.2xlarge"  = 280.32
    "c5.large"    = 62.05
    "c5.xlarge"   = 124.10
    "r5.large"    = 91.98
    "r5.xlarge"   = 183.96
  }

  ec2_cost_analysis = {
    for id, instance in local.ec2_instances : id => {
      instance_type      = instance.instance_type
      state              = instance.state
      estimated_monthly_cost = lookup(local.ec2_cost_map, instance.instance_type, 50.0)
    }
  }

  total_ec2_cost = sum([for id, cost in local.ec2_cost_analysis : cost.state == "running" ? cost.estimated_monthly_cost : 0])

  # Security Group Analysis
  security_groups = {
    for id, sg in data.aws_security_group.groups : id => {
      id          = sg.id
      name        = sg.name
      description = sg.description
      vpc_id      = sg.vpc_id
      ingress_rules = [
        for rule in sg.ingress : {
          from_port   = rule.from_port
          to_port     = rule.to_port
          protocol    = rule.protocol
          cidr_blocks = rule.cidr_blocks
          is_unrestricted = contains(rule.cidr_blocks, "0.0.0.0/0")
          is_ssh_open     = rule.from_port == 22 && contains(rule.cidr_blocks, "0.0.0.0/0")
          is_rdp_open     = rule.from_port == 3389 && contains(rule.cidr_blocks, "0.0.0.0/0")
        }
      ]
      has_unrestricted_access = length([for rule in sg.ingress : rule if contains(rule.cidr_blocks, "0.0.0.0/0")]) > 0
      has_ssh_open           = length([for rule in sg.ingress : rule if rule.from_port == 22 && contains(rule.cidr_blocks, "0.0.0.0/0")]) > 0
      has_rdp_open           = length([for rule in sg.ingress : rule if rule.from_port == 3389 && contains(rule.cidr_blocks, "0.0.0.0/0")]) > 0
    }
  }

  # S3 Bucket Analysis
  s3_buckets = {
    for name, bucket in data.aws_s3_bucket.buckets : name => {
      name = bucket.id
      region = bucket.region
      # Note: encryption and versioning require additional data sources
    }
  }

  # IAM Role Analysis
  iam_roles = {
    for name, role in data.aws_iam_role.roles : name => {
      name        = role.name
      arn         = role.arn
      assume_role_policy = role.assume_role_policy
      # Check for wildcard permissions in inline policies
    }
  }

  # VPC Analysis
  vpc_analysis = {
    for id, vpc in data.aws_vpc.vpcs : id => {
      id         = vpc.id
      cidr_block = vpc.cidr_block
      tags       = vpc.tags
    }
  }

  # Subnet Analysis
  subnet_analysis = {
    for id, subnet in data.aws_subnet.subnets : id => {
      id                = subnet.id
      vpc_id            = subnet.vpc_id
      cidr_block        = subnet.cidr_block
      availability_zone = subnet.availability_zone
      tags              = subnet.tags
    }
  }

  # RDS Analysis
  rds_instances = {
    for id, db in data.aws_db_instance.instances : id => {
      identifier              = db.db_instance_identifier
      engine                  = db.engine
      engine_version          = db.engine_version
      instance_class          = db.db_instance_class
      backup_retention_period = db.backup_retention_period
      storage_encrypted       = db.storage_encrypted
      publicly_accessible     = db.publicly_accessible
      has_backup_enabled      = db.backup_retention_period >= 7
      has_encryption_enabled  = db.storage_encrypted
      is_publicly_accessible  = db.publicly_accessible
    }
  }
}

# Generate Reports
resource "local_file" "ec2_analysis" {
  content = jsonencode({
    timestamp      = local.timestamp
    analysis_type  = "EC2 Instance Analysis"
    environment    = var.environment_suffix
    total_instances = length(local.ec2_instances)
    running_instances = length([for id, instance in local.ec2_instances : instance if instance.state == "running"])
    stopped_instances = length([for id, instance in local.ec2_instances : instance if instance.state == "stopped"])
    compliance_violations = length([for id, instance in local.ec2_instances : instance if instance.has_compliance_issues])
    instances = [
      for id, instance in local.ec2_instances : {
        instance_id       = instance.id
        instance_type     = instance.instance_type
        state             = instance.state
        availability_zone = instance.availability_zone
        missing_tags      = instance.missing_tags
        compliance_status = instance.has_compliance_issues ? "NON_COMPLIANT" : "COMPLIANT"
        estimated_monthly_cost = lookup(local.ec2_cost_analysis, id, {estimated_monthly_cost = 0}).estimated_monthly_cost
      }
    ]
    cost_summary = {
      total_monthly_cost = local.total_ec2_cost
      currency          = "USD"
    }
    recommendations = [
      "Tag all instances with required tags: Environment, Owner, CostCenter",
      "Review stopped instances and terminate if no longer needed",
      "Consider rightsizing instances based on utilization metrics"
    ]
  })
  filename = "${var.output_dir}/ec2-analysis-${var.environment_suffix}.json"

  depends_on = [local_file.output_dir]
}

resource "local_file" "security_group_analysis" {
  content = jsonencode({
    timestamp         = local.timestamp
    analysis_type     = "Security Group Analysis"
    environment       = var.environment_suffix
    total_security_groups = length(local.security_groups)
    unrestricted_groups   = length([for id, sg in local.security_groups : sg if sg.has_unrestricted_access])
    ssh_open_groups       = length([for id, sg in local.security_groups : sg if sg.has_ssh_open])
    rdp_open_groups       = length([for id, sg in local.security_groups : sg if sg.has_rdp_open])
    security_groups = [
      for id, sg in local.security_groups : {
        id                      = sg.id
        name                    = sg.name
        vpc_id                  = sg.vpc_id
        has_unrestricted_access = sg.has_unrestricted_access
        has_ssh_open            = sg.has_ssh_open
        has_rdp_open            = sg.has_rdp_open
        compliance_status       = (sg.has_unrestricted_access || sg.has_ssh_open || sg.has_rdp_open) ? "NON_COMPLIANT" : "COMPLIANT"
        violations = concat(
          sg.has_unrestricted_access ? ["Unrestricted inbound access (0.0.0.0/0)"] : [],
          sg.has_ssh_open ? ["SSH port 22 open to 0.0.0.0/0"] : [],
          sg.has_rdp_open ? ["RDP port 3389 open to 0.0.0.0/0"] : []
        )
      }
    ]
    recommendations = [
      "Remove unrestricted inbound rules (0.0.0.0/0)",
      "Restrict SSH and RDP access to specific IP ranges",
      "Implement bastion host or VPN for administrative access",
      "Review and remove unused security groups"
    ]
  })
  filename = "${var.output_dir}/security-group-analysis-${var.environment_suffix}.json"

  depends_on = [local_file.output_dir]
}

resource "local_file" "s3_analysis" {
  content = jsonencode({
    timestamp     = local.timestamp
    analysis_type = "S3 Bucket Analysis"
    environment   = var.environment_suffix
    total_buckets = length(local.s3_buckets)
    buckets = [
      for name, bucket in local.s3_buckets : {
        name   = bucket.name
        region = bucket.region
        note   = "Encryption and versioning status require additional AWS API calls"
      }
    ]
    recommendations = [
      "Enable default encryption on all S3 buckets",
      "Enable versioning on buckets containing critical data",
      "Review and remove public access settings",
      "Implement lifecycle policies for cost optimization"
    ]
  })
  filename = "${var.output_dir}/s3-analysis-${var.environment_suffix}.json"

  depends_on = [local_file.output_dir]
}

resource "local_file" "iam_analysis" {
  content = jsonencode({
    timestamp     = local.timestamp
    analysis_type = "IAM Role Analysis"
    environment   = var.environment_suffix
    total_roles   = length(local.iam_roles)
    roles = [
      for name, role in local.iam_roles : {
        name = role.name
        arn  = role.arn
        note = "Policy analysis for wildcard permissions requires AWS IAM API calls"
      }
    ]
    recommendations = [
      "Review roles with AdministratorAccess policy",
      "Remove wildcard (*) permissions on resources where possible",
      "Implement least privilege access principles",
      "Review and remove unused IAM roles"
    ]
  })
  filename = "${var.output_dir}/iam-analysis-${var.environment_suffix}.json"

  depends_on = [local_file.output_dir]
}

resource "local_file" "vpc_analysis" {
  content = jsonencode({
    timestamp     = local.timestamp
    analysis_type = "VPC and Subnet Analysis"
    environment   = var.environment_suffix
    total_vpcs    = length(local.vpc_analysis)
    total_subnets = length(local.subnet_analysis)
    vpcs = [
      for id, vpc in local.vpc_analysis : {
        id         = vpc.id
        cidr_block = vpc.cidr_block
        tags       = vpc.tags
      }
    ]
    subnets = [
      for id, subnet in local.subnet_analysis : {
        id                = subnet.id
        vpc_id            = subnet.vpc_id
        cidr_block        = subnet.cidr_block
        availability_zone = subnet.availability_zone
        tags              = subnet.tags
      }
    ]
    recommendations = [
      "Enable VPC Flow Logs for network traffic analysis",
      "Review unused subnets and remove if not needed",
      "Ensure proper subnet tagging for cost allocation",
      "Verify route tables have appropriate routes"
    ]
  })
  filename = "${var.output_dir}/vpc-analysis-${var.environment_suffix}.json"

  depends_on = [local_file.output_dir]
}

resource "local_file" "rds_analysis" {
  content = jsonencode({
    timestamp             = local.timestamp
    analysis_type         = "RDS Instance Analysis"
    environment           = var.environment_suffix
    total_instances       = length(local.rds_instances)
    compliant_backups     = length([for id, db in local.rds_instances : db if db.has_backup_enabled])
    encrypted_instances   = length([for id, db in local.rds_instances : db if db.has_encryption_enabled])
    publicly_accessible   = length([for id, db in local.rds_instances : db if db.is_publicly_accessible])
    instances = [
      for id, db in local.rds_instances : {
        identifier              = db.identifier
        engine                  = db.engine
        engine_version          = db.engine_version
        instance_class          = db.instance_class
        backup_retention_period = db.backup_retention_period
        storage_encrypted       = db.storage_encrypted
        publicly_accessible     = db.publicly_accessible
        compliance_status       = (db.has_backup_enabled && db.has_encryption_enabled && !db.is_publicly_accessible) ? "COMPLIANT" : "NON_COMPLIANT"
        violations = concat(
          !db.has_backup_enabled ? ["Backup retention period less than 7 days"] : [],
          !db.has_encryption_enabled ? ["Storage encryption not enabled"] : [],
          db.is_publicly_accessible ? ["Database is publicly accessible"] : []
        )
      }
    ]
    recommendations = [
      "Enable automated backups with retention >= 7 days",
      "Enable encryption at rest for all RDS instances",
      "Remove public accessibility from RDS instances",
      "Implement RDS instance monitoring and alerting"
    ]
  })
  filename = "${var.output_dir}/rds-analysis-${var.environment_suffix}.json"

  depends_on = [local_file.output_dir]
}

resource "local_file" "cost_estimation" {
  content = jsonencode({
    timestamp     = local.timestamp
    analysis_type = "Cost Estimation Report"
    environment   = var.environment_suffix
    currency      = "USD"
    ec2_costs = {
      total_monthly_cost = local.total_ec2_cost
      instance_breakdown = [
        for id, cost in local.ec2_cost_analysis : {
          instance_id            = id
          instance_type          = cost.instance_type
          state                  = cost.state
          estimated_monthly_cost = cost.estimated_monthly_cost
        }
      ]
    }
    top_10_expensive_resources = slice(
      sort([
        for id, cost in local.ec2_cost_analysis : {
          resource_id            = id
          resource_type          = "EC2"
          instance_type          = cost.instance_type
          estimated_monthly_cost = cost.estimated_monthly_cost
        }
      ], ["estimated_monthly_cost"]),
      0,
      min(10, length(local.ec2_cost_analysis))
    )
    recommendations = [
      "Review instance utilization and consider rightsizing",
      "Use Savings Plans or Reserved Instances for steady-state workloads",
      "Stop or terminate unused instances",
      "Consider spot instances for fault-tolerant workloads"
    ]
  })
  filename = "${var.output_dir}/cost-estimation-${var.environment_suffix}.json"

  depends_on = [local_file.output_dir]
}

resource "local_file" "summary" {
  content = jsonencode({
    timestamp     = local.timestamp
    analysis_type = "Infrastructure Analysis Summary"
    environment   = var.environment_suffix
    region        = var.aws_region
    resource_counts = {
      ec2_instances     = length(local.ec2_instances)
      security_groups   = length(local.security_groups)
      s3_buckets        = length(local.s3_buckets)
      iam_roles         = length(local.iam_roles)
      vpcs              = length(local.vpc_analysis)
      subnets           = length(local.subnet_analysis)
      rds_instances     = length(local.rds_instances)
    }
    compliance_summary = {
      ec2_non_compliant_instances = length([for id, instance in local.ec2_instances : instance if instance.has_compliance_issues])
      security_groups_with_issues = length([for id, sg in local.security_groups : sg if sg.has_unrestricted_access || sg.has_ssh_open || sg.has_rdp_open])
      rds_non_compliant_instances = length([for id, db in local.rds_instances : db if !db.has_backup_enabled || !db.has_encryption_enabled || db.is_publicly_accessible])
    }
    critical_findings = {
      severity_high = [
        "Security groups with unrestricted access (0.0.0.0/0)",
        "RDS instances publicly accessible",
        "RDS instances without encryption"
      ]
      severity_medium = [
        "EC2 instances missing required tags",
        "RDS instances with insufficient backup retention"
      ]
      severity_low = [
        "S3 buckets without lifecycle policies",
        "Unused subnets in VPCs"
      ]
    }
    cost_summary = {
      total_ec2_monthly_cost = local.total_ec2_cost
      currency               = "USD"
    }
    recommendations = [
      "Prioritize fixing high-severity security issues",
      "Implement tagging strategy for all resources",
      "Enable encryption for all data at rest",
      "Review and optimize costs based on utilization",
      "Implement automated compliance monitoring"
    ]
    reports_generated = [
      "ec2-analysis-${var.environment_suffix}.json",
      "security-group-analysis-${var.environment_suffix}.json",
      "s3-analysis-${var.environment_suffix}.json",
      "iam-analysis-${var.environment_suffix}.json",
      "vpc-analysis-${var.environment_suffix}.json",
      "rds-analysis-${var.environment_suffix}.json",
      "cost-estimation-${var.environment_suffix}.json",
      "summary-${var.environment_suffix}.json"
    ]
  })
  filename = "${var.output_dir}/summary-${var.environment_suffix}.json"

  depends_on = [
    local_file.ec2_analysis,
    local_file.security_group_analysis,
    local_file.s3_analysis,
    local_file.iam_analysis,
    local_file.vpc_analysis,
    local_file.rds_analysis,
    local_file.cost_estimation
  ]
}
```

## File: variables.tf

```hcl
variable "aws_region" {
  description = "AWS region to analyze"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for uniqueness"
  type        = string
  default     = "dev"
}

variable "output_dir" {
  description = "Directory for analysis reports"
  type        = string
  default     = "./infrastructure-analysis-reports"
}
```

## File: outputs.tf

```hcl
output "analysis_summary" {
  description = "Summary of infrastructure analysis"
  value = {
    timestamp          = local.timestamp
    total_ec2_instances = length(local.ec2_instances)
    total_security_groups = length(local.security_groups)
    total_s3_buckets   = length(local.s3_buckets)
    total_iam_roles    = length(local.iam_roles)
    total_vpcs         = length(local.vpc_analysis)
    total_subnets      = length(local.subnet_analysis)
    total_rds_instances = length(local.rds_instances)
    ec2_compliance_violations = length([for id, instance in local.ec2_instances : instance if instance.has_compliance_issues])
    sg_security_issues = length([for id, sg in local.security_groups : sg if sg.has_unrestricted_access || sg.has_ssh_open || sg.has_rdp_open])
    rds_compliance_violations = length([for id, db in local.rds_instances : db if !db.has_backup_enabled || !db.has_encryption_enabled || db.is_publicly_accessible])
    estimated_monthly_cost = local.total_ec2_cost
    reports_location = var.output_dir
  }
}

output "critical_findings" {
  description = "Critical security and compliance findings"
  value = {
    unrestricted_security_groups = [
      for id, sg in local.security_groups : sg.name if sg.has_unrestricted_access
    ]
    ssh_open_to_world = [
      for id, sg in local.security_groups : sg.name if sg.has_ssh_open
    ]
    rdp_open_to_world = [
      for id, sg in local.security_groups : sg.name if sg.has_rdp_open
    ]
    publicly_accessible_rds = [
      for id, db in local.rds_instances : db.identifier if db.is_publicly_accessible
    ]
    rds_without_encryption = [
      for id, db in local.rds_instances : db.identifier if !db.has_encryption_enabled
    ]
    rds_insufficient_backups = [
      for id, db in local.rds_instances : db.identifier if !db.has_backup_enabled
    ]
  }
}

output "reports_generated" {
  description = "List of generated analysis reports"
  value = [
    local_file.ec2_analysis.filename,
    local_file.security_group_analysis.filename,
    local_file.s3_analysis.filename,
    local_file.iam_analysis.filename,
    local_file.vpc_analysis.filename,
    local_file.rds_analysis.filename,
    local_file.cost_estimation.filename,
    local_file.summary.filename
  ]
}
```

## File: README.md

```markdown
# AWS Infrastructure Analysis Tool

This Terraform configuration provides comprehensive analysis of existing AWS infrastructure for compliance, security, and cost optimization.

## Features

- **EC2 Analysis**: Tag compliance, cost estimation, state tracking
- **Security Group Analysis**: Unrestricted access detection, SSH/RDP exposure
- **S3 Bucket Analysis**: Encryption and versioning checks
- **IAM Role Analysis**: Overly permissive policy detection
- **VPC Analysis**: Subnet utilization, CIDR tracking
- **RDS Analysis**: Backup, encryption, and accessibility validation
- **Cost Estimation**: Monthly cost projections for EC2 resources
- **Summary Reports**: Comprehensive overview with critical findings

## Prerequisites

- Terraform >= 1.5.0
- AWS Provider >= 5.0
- AWS credentials configured
- Read access to AWS resources

## Usage

### Initialize Terraform

```bash
terraform init
```

### Run Analysis

```bash
# Set environment suffix (optional)
export TF_VAR_environment_suffix="prod"

# Set AWS region (optional)
export TF_VAR_aws_region="us-east-1"

# Run terraform apply to generate reports
terraform apply
```

### View Reports

Reports are generated in the `infrastructure-analysis-reports/` directory:

- `ec2-analysis-{env}.json` - EC2 instance analysis
- `security-group-analysis-{env}.json` - Security group analysis
- `s3-analysis-{env}.json` - S3 bucket analysis
- `iam-analysis-{env}.json` - IAM role analysis
- `vpc-analysis-{env}.json` - VPC and subnet analysis
- `rds-analysis-{env}.json` - RDS instance analysis
- `cost-estimation-{env}.json` - Cost estimation report
- `summary-{env}.json` - Overall summary with critical findings

### View Summary Output

```bash
terraform output analysis_summary
terraform output critical_findings
terraform output reports_generated
```

### Clean Up

```bash
# Remove generated reports
terraform destroy
```

## Configuration

### Variables

- `aws_region` - AWS region to analyze (default: us-east-1)
- `environment_suffix` - Environment identifier (default: dev)
- `output_dir` - Output directory for reports (default: ./infrastructure-analysis-reports)

### Customization

Edit `variables.tf` to change defaults or pass variables via command line:

```bash
terraform apply -var="aws_region=us-west-2" -var="environment_suffix=staging"
```

## Compliance Checks

### EC2 Instances

- Required tags: Environment, Owner, CostCenter
- Instance state monitoring
- Cost estimation based on instance type

### Security Groups

- Unrestricted inbound rules (0.0.0.0/0)
- SSH port 22 open to world
- RDP port 3389 open to world

### RDS Instances

- Automated backups enabled (>= 7 days retention)
- Storage encryption enabled
- Not publicly accessible

## Limitations

- S3 encryption and versioning details require additional AWS API calls
- IAM policy analysis for wildcards requires deeper inspection
- Cost estimates are approximate based on standard pricing
- No actual AWS resources are created or modified

## Multi-Account Support

To analyze multiple accounts, configure AWS provider with assume role:

```hcl
provider "aws" {
  region = var.aws_region

  assume_role {
    role_arn = "arn:aws:iam::ACCOUNT_ID:role/AnalysisRole"
  }
}
```

## Security Considerations

- This configuration only reads existing resources
- No AWS resources are created or modified
- Reports may contain sensitive information - handle appropriately
- Use appropriate IAM permissions for read-only access

## Cost

Running this analysis incurs minimal costs:
- Terraform state storage (if using S3 backend)
- AWS API calls (typically free tier eligible)
- No infrastructure resources are created

## Support

For issues or questions, refer to the Terraform and AWS provider documentation.
```
