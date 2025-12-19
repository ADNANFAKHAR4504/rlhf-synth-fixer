# Generate a unique random suffix for this deployment
resource "random_id" "deployment_suffix" {
  byte_length = 4
  keepers = {
    project_name = var.project_name
    environment  = var.environment_suffix
    region       = var.aws_region
  }
}

locals {
  normalized_project = lower(replace(var.project_name, " ", "-"))
  normalized_suffix  = lower(replace(var.environment_suffix, " ", "-"))
  normalized_region  = lower(replace(var.aws_region, " ", "-"))

  bucket_prefix = lower(join("-", compact([
    local.normalized_project,
    local.normalized_suffix,
    local.normalized_region,
    random_id.deployment_suffix.hex
  ])))

  raw_bucket_name     = coalesce(var.s3_raw_bucket_name, "${local.bucket_prefix}-raw")
  curated_bucket_name = coalesce(var.s3_curated_bucket_name, "${local.bucket_prefix}-curated")
  logs_bucket_name    = coalesce(var.s3_logs_bucket_name, "${local.bucket_prefix}-logs")

  common_tags = {
    Environment       = var.environment
    EnvironmentSuffix = var.environment_suffix
    Project           = var.project_name
    ManagedBy         = "terraform"
  }
}

data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

output "emr_cluster_id" {
  description = "Identifier of the EMR cluster"
  value       = aws_emr_cluster.main.id
}

output "emr_master_public_dns" {
  description = "Public DNS name of the EMR master node"
  value       = aws_emr_cluster.main.master_public_dns
}

output "emr_security_configuration_name" {
  description = "Name of the EMR security configuration applied to the cluster"
  value       = aws_emr_security_configuration.main.name
}

output "raw_data_bucket_name" {
  description = "S3 bucket that stores raw trading data"
  value       = aws_s3_bucket.raw.bucket
}

output "curated_data_bucket_name" {
  description = "S3 bucket containing curated analytics outputs"
  value       = aws_s3_bucket.curated.bucket
}

output "emr_logs_bucket_name" {
  description = "S3 bucket receiving EMR log files"
  value       = aws_s3_bucket.logs.bucket
}

output "emr_autoscaling_role_arn" {
  description = "IAM role ARN used by EMR auto-scaling policies"
  value       = aws_iam_role.emr_autoscaling_role.arn
}

output "aws_region" {
  description = "AWS region where the stack is deployed"
  value       = var.aws_region
}

output "environment_suffix" {
  description = "Environment suffix appended to resource names"
  value       = var.environment_suffix
}

