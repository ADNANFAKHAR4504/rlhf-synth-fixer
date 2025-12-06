# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}

# Data source to get current region
data "aws_region" "current" {}

# Data source to query S3 buckets (basic information)
data "aws_s3_bucket" "validation_buckets" {
  for_each = toset(var.bucket_names_to_validate)
  bucket   = each.value
}

# Data source to query security groups
data "aws_security_group" "validation_security_groups" {
  for_each = toset(var.security_group_ids_to_validate)
  id       = each.value
}

# Data source to query EC2 instances
data "aws_instance" "validation_instances" {
  for_each    = toset(var.instance_ids_to_validate)
  instance_id = each.value
}

# External data source to query S3 bucket versioning using AWS CLI
data "external" "s3_bucket_versioning" {
  for_each = toset(var.bucket_names_to_validate)

  program = ["bash", "-c", <<-EOF
    VERSIONING=$(aws s3api get-bucket-versioning --bucket ${each.value} --query 'Status' --output text 2>/dev/null || echo "Not Configured")
    echo "{\"status\": \"$VERSIONING\"}"
  EOF
  ]
}

# External data source to query S3 bucket lifecycle configuration
data "external" "s3_bucket_lifecycle" {
  for_each = toset(var.bucket_names_to_validate)

  program = ["bash", "-c", <<-EOF
    RULE_COUNT=$(aws s3api get-bucket-lifecycle-configuration --bucket ${each.value} --query 'length(Rules)' --output text 2>/dev/null || echo "0")
    echo "{\"rule_count\": \"$RULE_COUNT\"}"
  EOF
  ]
}
