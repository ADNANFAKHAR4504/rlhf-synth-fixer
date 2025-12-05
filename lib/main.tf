# main.tf - Infrastructure Analysis Module

# Local values for approved instance types and cost calculations
locals {
  # Approved EC2 instance types
  approved_instance_types = ["t3.micro", "t3.small", "t3.medium"]

  # Monthly cost estimates for us-east-1 (730 hours/month)
  instance_costs = {
    "t3.micro"   = 7.30   # $0.01/hour
    "t3.small"   = 14.60  # $0.02/hour
    "t3.medium"  = 29.20  # $0.04/hour
    "t3.large"   = 58.40  # $0.08/hour
    "t3.xlarge"  = 116.80 # $0.16/hour
    "t3.2xlarge" = 233.60 # $0.32/hour
    "t2.micro"   = 8.47   # $0.0116/hour
    "t2.small"   = 16.79  # $0.023/hour
    "t2.medium"  = 33.58  # $0.046/hour
    "m5.large"   = 69.35  # $0.095/hour
    "m5.xlarge"  = 138.70 # $0.19/hour
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
  # Note: AWS provider doesn't have data sources for versioning/encryption
  # We use external data source to call AWS CLI for these checks
  s3_buckets = {
    for name in var.s3_bucket_names : name => {
      name               = name
      versioning_enabled = try(data.external.s3_versioning[name].result.enabled == "true", false)
      encryption_enabled = try(data.external.s3_encryption[name].result.enabled == "true", false)
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
  total_resources       = length(local.all_resources)
  compliant_resources   = local.total_resources - length(local.resources_with_tag_violations)
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

# External data source to check S3 bucket versioning using AWS CLI
data "external" "s3_versioning" {
  for_each = toset(var.s3_bucket_names)

  program = ["bash", "-c", <<-EOT
    STATUS=$(aws s3api get-bucket-versioning --bucket ${each.value} --region ${var.aws_region} --query 'Status' --output text 2>/dev/null || echo "Disabled")
    if [ "$STATUS" = "Enabled" ]; then
      echo '{"enabled":"true"}'
    else
      echo '{"enabled":"false"}'
    fi
  EOT
  ]
}

# External data source to check S3 bucket encryption using AWS CLI
data "external" "s3_encryption" {
  for_each = toset(var.s3_bucket_names)

  program = ["bash", "-c", <<-EOT
    RULES=$(aws s3api get-bucket-encryption --bucket ${each.value} --region ${var.aws_region} --query 'ServerSideEncryptionConfiguration.Rules' --output json 2>/dev/null || echo "[]")
    if [ "$RULES" != "[]" ] && [ "$RULES" != "" ]; then
      echo '{"enabled":"true"}'
    else
      echo '{"enabled":"false"}'
    fi
  EOT
  ]
}

# Data sources for Security Groups
data "aws_security_group" "security_groups" {
  for_each = toset(var.security_group_ids)

  id = each.value
}
