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
# Note: AWS provider only provides data "aws_s3_bucket" for basic bucket info
# Versioning, encryption, and public access block are resource types only
# We'll need to use external data source or AWS CLI for detailed S3 analysis
data "aws_s3_bucket" "buckets" {
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

# Current AWS account and caller identity
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Compliance Validation Module
module "compliance_validator" {
  source = "./modules/compliance-validator"

  environment_suffix      = var.environment_suffix
  ec2_instances           = data.aws_instance.instances
  rds_instances           = data.aws_db_instance.databases
  s3_buckets              = data.aws_s3_bucket.buckets
  iam_roles               = data.aws_iam_role.roles
  security_groups         = data.aws_security_group.instance_sgs
  default_security_groups = data.aws_security_group.default_groups

  approved_ami_ids              = var.approved_ami_ids
  minimum_backup_retention_days = var.minimum_backup_retention_days
  production_bucket_names       = var.production_bucket_names
  required_tags                 = var.required_tags
  sensitive_ports               = var.sensitive_ports
}
