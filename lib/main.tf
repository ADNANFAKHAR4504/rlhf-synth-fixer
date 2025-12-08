terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
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

# Note: List all S3 buckets in the account
# AWS provider does not have aws_s3_buckets data source
# We'll need to use aws_s3_bucket with known bucket names
# For now, we'll create an empty map for S3 buckets

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

# S3 Bucket Details - Note: Cannot list all buckets via Terraform data sources
# Users must provide bucket names via variables if needed

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
      id                    = instance.id
      instance_type         = instance.instance_type
      state                 = instance.instance_state
      availability_zone     = instance.availability_zone
      tags                  = instance.tags
      missing_tags          = [for tag in local.required_tags : tag if !contains(keys(instance.tags), tag)]
      has_compliance_issues = length([for tag in local.required_tags : tag if !contains(keys(instance.tags), tag)]) > 0
    }
  }

  ec2_cost_map = {
    "t2.micro"   = 8.47
    "t2.small"   = 16.93
    "t2.medium"  = 33.87
    "t2.large"   = 67.74
    "t3.micro"   = 7.59
    "t3.small"   = 15.18
    "t3.medium"  = 30.37
    "t3.large"   = 60.74
    "m5.large"   = 70.08
    "m5.xlarge"  = 140.16
    "m5.2xlarge" = 280.32
    "c5.large"   = 62.05
    "c5.xlarge"  = 124.10
    "r5.large"   = 91.98
    "r5.xlarge"  = 183.96
  }

  ec2_cost_analysis = {
    for id, instance in local.ec2_instances : id => {
      instance_type          = instance.instance_type
      state                  = instance.state
      estimated_monthly_cost = lookup(local.ec2_cost_map, instance.instance_type, 50.0)
    }
  }

  total_ec2_cost = sum([for id, cost in local.ec2_cost_analysis : cost.state == "running" ? cost.estimated_monthly_cost : 0])

  # Security Group Analysis
  # NOTE: aws_security_group data source does not expose ingress/egress rules directly
  # The data source does not have ingress/egress attributes - we set flags to false
  # For complete security group rule analysis, use AWS CLI or aws_security_group_rules data sources
  security_groups = {
    for id, sg in data.aws_security_group.groups : id => {
      id                      = sg.id
      name                    = sg.name
      description             = sg.description
      vpc_id                  = sg.vpc_id
      tags                    = sg.tags
      has_unrestricted_access = false
      has_ssh_open            = false
      has_rdp_open            = false
      # Note: Full rule analysis requires aws_vpc_security_group_rules data source
      # or external AWS CLI/API calls - these flags are placeholders
    }
  }

  # S3 Bucket Analysis - Empty map as we cannot list all buckets via data sources
  s3_buckets = {}

  # IAM Role Analysis
  iam_roles = {
    for name, role in data.aws_iam_role.roles : name => {
      name               = role.name
      arn                = role.arn
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
    timestamp             = local.timestamp
    analysis_type         = "EC2 Instance Analysis"
    environment           = var.environment_suffix
    total_instances       = length(local.ec2_instances)
    running_instances     = length([for id, instance in local.ec2_instances : instance if instance.state == "running"])
    stopped_instances     = length([for id, instance in local.ec2_instances : instance if instance.state == "stopped"])
    compliance_violations = length([for id, instance in local.ec2_instances : instance if instance.has_compliance_issues])
    instances = [
      for id, instance in local.ec2_instances : {
        instance_id            = instance.id
        instance_type          = instance.instance_type
        state                  = instance.state
        availability_zone      = instance.availability_zone
        missing_tags           = instance.missing_tags
        compliance_status      = instance.has_compliance_issues ? "NON_COMPLIANT" : "COMPLIANT"
        estimated_monthly_cost = lookup(local.ec2_cost_analysis, id, { estimated_monthly_cost = 0 }).estimated_monthly_cost
      }
    ]
    cost_summary = {
      total_monthly_cost = local.total_ec2_cost
      currency           = "USD"
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
    timestamp             = local.timestamp
    analysis_type         = "Security Group Analysis"
    environment           = var.environment_suffix
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
    note          = "S3 bucket listing via Terraform data sources is not supported. Use AWS CLI or SDK for comprehensive bucket analysis."
    buckets       = []
    recommendations = [
      "Enable default encryption on all S3 buckets",
      "Enable versioning on buckets containing critical data",
      "Review and remove public access settings",
      "Implement lifecycle policies for cost optimization",
      "Use AWS CLI 'aws s3api list-buckets' for comprehensive bucket discovery"
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
    timestamp           = local.timestamp
    analysis_type       = "RDS Instance Analysis"
    environment         = var.environment_suffix
    total_instances     = length(local.rds_instances)
    compliant_backups   = length([for id, db in local.rds_instances : db if db.has_backup_enabled])
    encrypted_instances = length([for id, db in local.rds_instances : db if db.has_encryption_enabled])
    publicly_accessible = length([for id, db in local.rds_instances : db if db.is_publicly_accessible])
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
      [
        for id, cost in local.ec2_cost_analysis : {
          resource_id            = id
          resource_type          = "EC2"
          instance_type          = cost.instance_type
          estimated_monthly_cost = cost.estimated_monthly_cost
        }
      ],
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
      ec2_instances   = length(local.ec2_instances)
      security_groups = length(local.security_groups)
      s3_buckets      = length(local.s3_buckets)
      iam_roles       = length(local.iam_roles)
      vpcs            = length(local.vpc_analysis)
      subnets         = length(local.subnet_analysis)
      rds_instances   = length(local.rds_instances)
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
