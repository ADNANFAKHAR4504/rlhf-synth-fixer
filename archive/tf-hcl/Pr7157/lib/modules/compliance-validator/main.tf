locals {
  # EC2 Compliance Checks
  ec2_findings = flatten([
    for instance_id, instance in var.ec2_instances : flatten([
      # Check if AMI is approved
      length(var.approved_ami_ids) > 0 && !contains(var.approved_ami_ids, instance.ami) ? [{
        resource_type = "AWS::EC2::Instance"
        resource_id   = instance_id
        severity      = "high"
        finding       = "Instance uses unapproved AMI"
        details       = "AMI ${instance.ami} is not in the approved AMI list"
        remediation   = "Replace instance with approved AMI from the list: ${join(", ", var.approved_ami_ids)}"
      }] : [],

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
      ],

      # Check if instance is using default security group
      contains(instance.vpc_security_group_ids, "default") ? [{
        resource_type = "AWS::EC2::Instance"
        resource_id   = instance_id
        severity      = "high"
        finding       = "Instance uses default security group"
        details       = "Using default security group is a security risk"
        remediation   = "Create and assign a custom security group with least privilege rules"
      }] : [],
    ])
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
  # Note: Limited checks available - versioning, encryption, and public access block
  # are not available as data sources in AWS provider
  # For comprehensive S3 checks, use external data source with AWS CLI
  s3_findings = flatten([
    for bucket_name, bucket in var.s3_buckets : [
      # Basic bucket existence check
      {
        resource_type = "AWS::S3::Bucket"
        resource_id   = bucket_name
        severity      = "low"
        finding       = "S3 bucket requires manual security review"
        details       = "Bucket found but encryption, versioning, and public access settings cannot be validated via Terraform data sources"
        remediation   = "Manually verify: 1) Encryption is enabled, 2) Versioning is enabled for production, 3) Public access is blocked"
      },
    ]
  ])

  # Security Group Compliance Checks
  sg_findings = flatten([
    for sg_id, sg in var.security_groups : flatten([
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
      ],
    ])
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
  assert {
    condition = alltrue([
      for instance_id, instance in var.ec2_instances :
      length(var.approved_ami_ids) == 0 || contains(var.approved_ami_ids, instance.ami)
    ])
    error_message = "One or more EC2 instances use unapproved AMIs"
  }
}

check "rds_backup_compliance" {
  assert {
    condition = alltrue([
      for db_id, db in var.rds_instances :
      db.backup_retention_period >= var.minimum_backup_retention_days
    ])
    error_message = "One or more RDS instances have insufficient backup retention periods"
  }
}

check "s3_bucket_validation" {
  assert {
    condition = alltrue([
      for bucket_name, bucket in var.s3_buckets :
      bucket.arn != ""
    ])
    error_message = "One or more S3 buckets could not be queried successfully"
  }
}
