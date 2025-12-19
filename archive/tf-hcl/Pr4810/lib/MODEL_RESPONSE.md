### Reasoning Trace

---

This is a comprehensive request for building a CloudTrail log analytics platform using Terraform. I need to create a complete infrastructure-as-code solution that handles:

1. Multi-account CloudTrail setup (100 accounts)
2. Centralized S3 storage with lifecycle policies
3. AWS Glue for data cataloging
4. Athena for querying
5. Lambda functions for processing, security analysis, alerting, compaction, and reporting
6. QuickSight dashboards
7. EventBridge for real-time alerting
8. IAM roles and permissions
9. Monitoring with CloudWatch
10. Complete Python code for Lambda functions

This is a large project, so I'll organize it properly with all the requested files. I'll make sure to:

- Use Terraform best practices
- Make everything configurable via variables
- Include proper error handling in Lambda functions
- Create comprehensive documentation
- Follow the exact file structure requested

Let me start building this infrastructure piece by piece.

### Answer

---

# CloudTrail Log Analytics Platform

I'll create a comprehensive Terraform infrastructure for your centralized CloudTrail log analytics platform. This solution will handle logs from 100 AWS accounts with efficient querying, real-time alerting, and interactive dashboards.

## Terraform Configuration Files

### versions.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}
```

### providers.tf

```hcl
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "CloudTrail-Analytics"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Additional providers for cross-region replication if enabled
provider "aws" {
  alias  = "replica"
  region = var.replica_region
}
```

### variables.tf

```hcl
variable "aws_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "replica_region" {
  description = "Replica region for cross-region backup"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "cloudtrail-analytics"
}

# Account Management
variable "aws_account_ids" {
  description = "List of AWS account IDs to monitor"
  type        = list(string)
}

variable "organization_id" {
  description = "AWS Organization ID (if using organization trail)"
  type        = string
  default     = ""
}

variable "use_organization_trail" {
  description = "Use AWS Organizations trail instead of individual trails"
  type        = bool
  default     = true
}

# Storage Configuration
variable "lifecycle_transition_days" {
  description = "Days before transitioning to different storage classes"
  type = object({
    intelligent_tiering = number
    glacier            = number
    deep_archive       = number
    expiration         = number
  })
  default = {
    intelligent_tiering = 30
    glacier            = 90
    deep_archive       = 365
    expiration         = 2555  # 7 years
  }
}

variable "enable_cross_region_replication" {
  description = "Enable cross-region replication for CloudTrail logs"
  type        = bool
  default     = true
}

variable "object_lock_retention_days" {
  description = "Object Lock retention period in days"
  type        = number
  default     = 2555  # 7 years
}

# Alert Configuration
variable "alert_thresholds" {
  description = "Thresholds for various alerts"
  type = object({
    failed_logins_per_5min      = number
    high_risk_api_calls_per_hour = number
    athena_bytes_scanned_daily   = number
    lambda_duration_warning_ms   = number
  })
  default = {
    failed_logins_per_5min      = 5
    high_risk_api_calls_per_hour = 10
    athena_bytes_scanned_daily   = 1099511627776  # 1 TB
    lambda_duration_warning_ms   = 270000         # 4.5 minutes
  }
}

variable "sns_email_endpoints" {
  description = "Email endpoints for different alert severities"
  type = object({
    critical = list(string)
    high     = list(string)
    medium   = list(string)
  })
  default = {
    critical = []
    high     = []
    medium   = []
  }
}

# Schedule Configuration
variable "schedules" {
  description = "Cron expressions for scheduled tasks"
  type = object({
    glue_crawler          = string
    security_analysis     = string
    log_compaction        = string
    compliance_reporting  = string
  })
  default = {
    glue_crawler          = "cron(0 2 * * ? *)"     # Daily at 2 AM
    security_analysis     = "rate(1 hour)"          # Every hour
    log_compaction        = "cron(0 3 ? * SUN *)"   # Weekly on Sunday at 3 AM
    compliance_reporting  = "cron(0 5 1 * ? *)"     # Monthly on 1st at 5 AM
  }
}

# Athena Configuration
variable "athena_workgroup_limits" {
  description = "Athena workgroup limits"
  type = object({
    bytes_scanned_cutoff_per_query = number
    query_timeout_seconds          = number
    enforce_workgroup_config       = bool
  })
  default = {
    bytes_scanned_cutoff_per_query = 1099511627776  # 1 TB
    query_timeout_seconds          = 1800           # 30 minutes
    enforce_workgroup_config       = true
  }
}

# QuickSight Configuration
variable "quicksight_users" {
  description = "QuickSight user configurations"
  type = map(object({
    email        = string
    role         = string  # READER, AUTHOR, ADMIN
    account_ids  = list(string)  # For row-level security
  }))
  default = {}
}

# Feature Flags
variable "features" {
  description = "Enable/disable optional features"
  type = object({
    data_events_enabled      = bool
    log_file_validation      = bool
    intelligent_tiering      = bool
    cross_region_replication = bool
    object_lock             = bool
    quicksight_dashboards   = bool
    compliance_reports      = bool
    cost_optimization       = bool
  })
  default = {
    data_events_enabled      = true
    log_file_validation      = true
    intelligent_tiering      = true
    cross_region_replication = true
    object_lock             = true
    quicksight_dashboards   = true
    compliance_reports      = true
    cost_optimization       = true
  }
}

# Compliance Configuration
variable "compliance_report_recipients" {
  description = "Email addresses for compliance reports"
  type        = list(string)
  default     = []
}

# Lambda Configuration
variable "lambda_runtime" {
  description = "Python runtime for Lambda functions"
  type        = string
  default     = "python3.12"
}

variable "lambda_memory_size" {
  description = "Memory allocation for Lambda functions"
  type = object({
    log_processor       = number
    security_analyzer   = number
    alert_enricher     = number
    log_compactor      = number
    compliance_reporter = number
  })
  default = {
    log_processor       = 1024
    security_analyzer   = 2048
    alert_enricher     = 512
    log_compactor      = 3008
    compliance_reporter = 1024
  }
}

variable "lambda_timeout" {
  description = "Timeout in seconds for Lambda functions"
  type = object({
    log_processor       = number
    security_analyzer   = number
    alert_enricher     = number
    log_compactor      = number
    compliance_reporter = number
  })
  default = {
    log_processor       = 300
    security_analyzer   = 600
    alert_enricher     = 60
    log_compactor      = 900
    compliance_reporter = 300
  }
}

# High-Risk Actions
variable "high_risk_actions" {
  description = "List of high-risk API actions to monitor"
  type        = list(string)
  default = [
    "iam:AttachUserPolicy",
    "iam:AttachRolePolicy",
    "iam:CreateAccessKey",
    "iam:DeleteAccessKey",
    "iam:DeleteUser",
    "iam:DeleteRole",
    "iam:PutUserPolicy",
    "iam:PutRolePolicy",
    "s3:PutBucketPolicy",
    "s3:DeleteBucket",
    "s3:PutBucketPublicAccessBlock",
    "ec2:DeleteSecurityGroup",
    "ec2:AuthorizeSecurityGroupIngress",
    "ec2:RevokeSecurityGroupIngress",
    "kms:ScheduleKeyDeletion",
    "kms:DisableKey",
    "cloudtrail:StopLogging",
    "cloudtrail:DeleteTrail"
  ]
}
```

### s3-buckets.tf

```hcl
# Generate unique bucket names
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

locals {
  bucket_suffix = random_string.bucket_suffix.result
}

# Central CloudTrail logs bucket
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "${var.project_name}-cloudtrail-logs-${local.bucket_suffix}"

  object_lock_enabled = var.features.object_lock
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudtrail.id
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    id     = "intelligent-tiering"
    status = var.features.intelligent_tiering ? "Enabled" : "Disabled"

    transition {
      days          = var.lifecycle_transition_days.intelligent_tiering
      storage_class = "INTELLIGENT_TIERING"
    }
  }

  rule {
    id     = "glacier-transition"
    status = "Enabled"

    transition {
      days          = var.lifecycle_transition_days.glacier
      storage_class = "GLACIER"
    }
  }

  rule {
    id     = "deep-archive-transition"
    status = "Enabled"

    transition {
      days          = var.lifecycle_transition_days.deep_archive
      storage_class = "DEEP_ARCHIVE"
    }
  }

  rule {
    id     = "expiration"
    status = "Enabled"

    expiration {
      days = var.lifecycle_transition_days.expiration
    }
  }
}

resource "aws_s3_bucket_object_lock_configuration" "cloudtrail_logs" {
  count = var.features.object_lock ? 1 : 0

  bucket = aws_s3_bucket.cloudtrail_logs.id

  object_lock_enabled = "Enabled"

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.object_lock_retention_days
    }
  }
}

# Athena query results bucket
resource "aws_s3_bucket" "athena_results" {
  bucket = "${var.project_name}-athena-results-${local.bucket_suffix}"
}

resource "aws_s3_bucket_versioning" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudtrail.id
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    id     = "delete-old-results"
    status = "Enabled"

    expiration {
      days = 30
    }
  }
}

# Enriched logs bucket
resource "aws_s3_bucket" "enriched_logs" {
  bucket = "${var.project_name}-enriched-logs-${local.bucket_suffix}"
}

resource "aws_s3_bucket_versioning" "enriched_logs" {
  bucket = aws_s3_bucket.enriched_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "enriched_logs" {
  bucket = aws_s3_bucket.enriched_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudtrail.id
      sse_algorithm     = "aws:kms"
    }
  }
}

# Compliance reports bucket
resource "aws_s3_bucket" "compliance_reports" {
  bucket = "${var.project_name}-compliance-reports-${local.bucket_suffix}"
}

resource "aws_s3_bucket_versioning" "compliance_reports" {
  bucket = aws_s3_bucket.compliance_reports.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "compliance_reports" {
  bucket = aws_s3_bucket.compliance_reports.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudtrail.id
      sse_algorithm     = "aws:kms"
    }
  }
}

# Cross-region replication configuration
resource "aws_s3_bucket" "cloudtrail_logs_replica" {
  count    = var.features.cross_region_replication ? 1 : 0
  provider = aws.replica

  bucket = "${var.project_name}-cloudtrail-logs-replica-${local.bucket_suffix}"
}

resource "aws_s3_bucket_replication_configuration" "cloudtrail_logs" {
  count = var.features.cross_region_replication ? 1 : 0

  role   = aws_iam_role.s3_replication[0].arn
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    id       = "replicate-all"
    status   = "Enabled"
    priority = 1

    filter {}

    destination {
      bucket        = aws_s3_bucket.cloudtrail_logs_replica[0].arn
      storage_class = "STANDARD_IA"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.cloudtrail_replica[0].arn
      }
    }

    delete_marker_replication {
      status = "Enabled"
    }
  }

  depends_on = [aws_s3_bucket_versioning.cloudtrail_logs]
}

# Bucket policies
resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  policy = data.aws_iam_policy_document.cloudtrail_bucket_policy.json
}

data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions = ["s3:GetBucketAcl"]

    resources = [aws_s3_bucket.cloudtrail_logs.arn]
  }

  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions = ["s3:PutObject"]

    resources = ["${aws_s3_bucket.cloudtrail_logs.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }

  statement {
    sid    = "DenyUnencryptedObjectUploads"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = ["s3:PutObject"]

    resources = ["${aws_s3_bucket.cloudtrail_logs.arn}/*"]

    condition {
      test     = "StringNotEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["aws:kms"]
    }
  }
}
```

### cloudtrail.tf

```hcl
# Organization Trail (if using AWS Organizations)
resource "aws_cloudtrail" "organization_trail" {
  count = var.use_organization_trail ? 1 : 0

  name                          = "${var.project_name}-org-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail_logs.id
  s3_key_prefix                = "AWSLogs"
  include_global_service_events = true
  is_multi_region_trail        = true
  is_organization_trail        = true
  enable_logging               = true
  enable_log_file_validation   = var.features.log_file_validation

  kms_key_id = aws_kms_key.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    dynamic "data_resource" {
      for_each = var.features.data_events_enabled ? [1] : []

      content {
        type   = "AWS::S3::Object"
        values = ["arn:aws:s3:::*/*"]
      }
    }
  }

  event_selector {
    read_write_type           = "All"
    include_management_events = false

    dynamic "data_resource" {
      for_each = var.features.data_events_enabled ? [1] : []

      content {
        type   = "AWS::Lambda::Function"
        values = ["arn:aws:lambda:*:*:function/*"]
      }
    }
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs]
}

# Individual trails for each account (if not using organization trail)
resource "aws_cloudtrail" "account_trails" {
  for_each = var.use_organization_trail ? {} : toset(var.aws_account_ids)

  name                          = "${var.project_name}-trail-${each.value}"
  s3_bucket_name               = aws_s3_bucket.cloudtrail_logs.id
  s3_key_prefix                = "AWSLogs/${each.value}"
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true
  enable_log_file_validation   = var.features.log_file_validation

  kms_key_id = aws_kms_key.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    dynamic "data_resource" {
      for_each = var.features.data_events_enabled ? [1] : []

      content {
        type   = "AWS::S3::Object"
        values = ["arn:aws:s3:::*/*"]
      }
    }
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs]
}
```

### kms.tf

```hcl
# KMS key for CloudTrail logs encryption
resource "aws_kms_key" "cloudtrail" {
  description             = "KMS key for CloudTrail logs encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "cloudtrail" {
  name          = "alias/${var.project_name}-cloudtrail"
  target_key_id = aws_kms_key.cloudtrail.key_id
}

resource "aws_kms_key_policy" "cloudtrail" {
  key_id = aws_kms_key.cloudtrail.id
  policy = data.aws_iam_policy_document.cloudtrail_kms_policy.json
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "cloudtrail_kms_policy" {
  statement {
    sid    = "Enable IAM User Permissions"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions   = ["kms:*"]
    resources = ["*"]
  }

  statement {
    sid    = "Allow CloudTrail to encrypt logs"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions = [
      "kms:GenerateDataKey",
      "kms:DescribeKey"
    ]

    resources = ["*"]

    condition {
      test     = "StringLike"
      variable = "kms:EncryptionContext:aws:cloudtrail:arn"
      values   = ["arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"]
    }
  }

  statement {
    sid    = "Allow services to decrypt logs"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = [
        "athena.amazonaws.com",
        "glue.amazonaws.com",
        "lambda.amazonaws.com",
        "quicksight.amazonaws.com"
      ]
    }

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "Allow log processing roles to decrypt"
    effect = "Allow"

    principals {
      type = "AWS"
      identifiers = [
        aws_iam_role.lambda_log_processor.arn,
        aws_iam_role.lambda_security_analyzer.arn,
        aws_iam_role.glue_crawler.arn,
        aws_iam_role.athena_workgroup.arn
      ]
    }

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:GenerateDataKey"
    ]

    resources = ["*"]
  }
}

# KMS key for replica region
resource "aws_kms_key" "cloudtrail_replica" {
  count    = var.features.cross_region_replication ? 1 : 0
  provider = aws.replica

  description             = "KMS key for CloudTrail logs encryption in replica region"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}
```

### glue.tf

```hcl
# Glue database for CloudTrail logs
resource "aws_glue_catalog_database" "cloudtrail_raw" {
  name        = "${replace(var.project_name, "-", "_")}_raw"
  description = "Database for raw CloudTrail logs"
}

resource "aws_glue_catalog_database" "cloudtrail_enriched" {
  name        = "${replace(var.project_name, "-", "_")}_enriched"
  description = "Database for enriched CloudTrail logs"
}

resource "aws_glue_catalog_database" "cloudtrail_data_events" {
  count = var.features.data_events_enabled ? 1 : 0

  name        = "${replace(var.project_name, "-", "_")}_data_events"
  description = "Database for CloudTrail data events"
}

# Glue crawler for CloudTrail logs
resource "aws_glue_crawler" "cloudtrail_raw" {
  database_name = aws_glue_catalog_database.cloudtrail_raw.name
  name          = "${var.project_name}-cloudtrail-raw-crawler"
  role          = aws_iam_role.glue_crawler.arn
  schedule      = var.schedules.glue_crawler

  s3_target {
    path = "s3://${aws_s3_bucket.cloudtrail_logs.id}/AWSLogs/"
    exclusions = [
      "**/CloudTrail-Digest/**",
      "**/Config/**"
    ]
  }

  schema_change_policy {
    delete_behavior = "LOG"
    update_behavior = "UPDATE_IN_DATABASE"
  }

  configuration = jsonencode({
    Version = 1.0
    CreatePartitionIndex = true
    CrawlerOutput = {
      Partitions = {
        AddOrUpdateBehavior = "InheritFromTable"
      }
    }
    Grouping = {
      TableGroupingPolicy = "CombineCompatibleSchemas"
    }
  })
}

# Glue crawler for enriched logs
resource "aws_glue_crawler" "cloudtrail_enriched" {
  database_name = aws_glue_catalog_database.cloudtrail_enriched.name
  name          = "${var.project_name}-cloudtrail-enriched-crawler"
  role          = aws_iam_role.glue_crawler.arn
  schedule      = var.schedules.glue_crawler

  s3_target {
    path = "s3://${aws_s3_bucket.enriched_logs.id}/"
  }

  schema_change_policy {
    delete_behavior = "LOG"
    update_behavior = "UPDATE_IN_DATABASE"
  }

  configuration = jsonencode({
    Version = 1.0
    CreatePartitionIndex = true
    CrawlerOutput = {
      Partitions = {
        AddOrUpdateBehavior = "InheritFromTable"
      }
    }
  })
}

# Custom classifier for CloudTrail JSON
resource "aws_glue_classifier" "cloudtrail_json" {
  name = "${var.project_name}-cloudtrail-json"

  json_classifier {
    json_path = "$.Records[*]"
  }
}
```

### athena.tf

```hcl
# Athena workgroup
resource "aws_athena_workgroup" "cloudtrail_analytics" {
  name        = "${var.project_name}-analytics"
  description = "Workgroup for CloudTrail log analysis"

  configuration {
    enforce_workgroup_configuration    = var.athena_workgroup_limits.enforce_workgroup_config
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.id}/results/"

      encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn      = aws_kms_key.cloudtrail.arn
      }
    }

    engine_version {
      selected_engine_version = "AUTO"
    }
  }

  workgroup_configuration_updates {
    enforce_workgroup_configuration    = var.athena_workgroup_limits.enforce_workgroup_config
    publish_cloudwatch_metrics_enabled = true
    bytes_scanned_cutoff_per_query     = var.athena_workgroup_limits.bytes_scanned_cutoff_per_query
    result_configuration_updates {
      output_location = "s3://${aws_s3_bucket.athena_results.id}/results/"
    }
  }
}

# Named queries
resource "aws_athena_named_query" "failed_console_logins" {
  name        = "Failed Console Logins by Account and User"
  description = "Identifies failed console login attempts"
  database    = aws_glue_catalog_database.cloudtrail_raw.name
  workgroup   = aws_athena_workgroup.cloudtrail_analytics.name

  query = file("${path.module}/athena-queries/failed_console_logins.sql")
}

resource "aws_athena_named_query" "iam_policy_changes" {
  name        = "IAM Policy Changes"
  description = "All IAM policy modifications with details"
  database    = aws_glue_catalog_database.cloudtrail_raw.name
  workgroup   = aws_athena_workgroup.cloudtrail_analytics.name

  query = file("${path.module}/athena-queries/iam_policy_changes.sql")
}

resource "aws_athena_named_query" "root_account_usage" {
  name        = "Root Account Usage"
  description = "All activities performed by root user"
  database    = aws_glue_catalog_database.cloudtrail_raw.name
  workgroup   = aws_athena_workgroup.cloudtrail_analytics.name

  query = file("${path.module}/athena-queries/root_account_usage.sql")
}

resource "aws_athena_named_query" "resource_deletions" {
  name        = "Resource Deletions"
  description = "Track deletion of critical resources"
  database    = aws_glue_catalog_database.cloudtrail_raw.name
  workgroup   = aws_athena_workgroup.cloudtrail_analytics.name

  query = file("${path.module}/athena-queries/resource_deletions.sql")
}

resource "aws_athena_named_query" "cross_account_access" {
  name        = "Cross-Account Access"
  description = "Cross-account role assumptions"
  database    = aws_glue_catalog_database.cloudtrail_raw.name
  workgroup   = aws_athena_workgroup.cloudtrail_analytics.name

  query = file("${path.module}/athena-queries/cross_account_access.sql")
}

resource "aws_athena_named_query" "security_group_changes" {
  name        = "Security Group Public Access Changes"
  description = "Security group modifications allowing public access"
  database    = aws_glue_catalog_database.cloudtrail_raw.name
  workgroup   = aws_athena_workgroup.cloudtrail_analytics.name

  query = file("${path.module}/athena-queries/security_group_changes.sql")
}

resource "aws_athena_named_query" "kms_key_usage" {
  name        = "KMS Key Usage and Modifications"
  description = "KMS key operations and changes"
  database    = aws_glue_catalog_database.cloudtrail_raw.name
  workgroup   = aws_athena_workgroup.cloudtrail_analytics.name

  query = file("${path.module}/athena-queries/kms_key_usage.sql")
}

resource "aws_athena_named_query" "api_calls_by_service" {
  name        = "API Calls by Service"
  description = "API call count by service"
  database    = aws_glue_catalog_database.cloudtrail_raw.name
  workgroup   = aws_athena_workgroup.cloudtrail_analytics.name

  query = file("${path.module}/athena-queries/api_calls_by_service.sql")
}

resource "aws_athena_named_query" "high_cost_actions" {
  name        = "High Cost Actions"
  description = "Actions that can incur significant costs"
  database    = aws_glue_catalog_database.cloudtrail_raw.name
  workgroup   = aws_athena_workgroup.cloudtrail_analytics.name

  query = file("${path.module}/athena-queries/high_cost_actions.sql")
}

resource "aws_athena_named_query" "ip_address_activity" {
  name        = "Activity from Specific IP Addresses"
  description = "Filter events by source IP address"
  database    = aws_glue_catalog_database.cloudtrail_raw.name
  workgroup   = aws_athena_workgroup.cloudtrail_analytics.name

  query = file("${path.module}/athena-queries/ip_address_activity.sql")
}
```

### dynamodb.tf

```hcl
resource "aws_dynamodb_table" "security_findings" {
  name         = "${var.project_name}-security-findings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "finding_id"
  range_key    = "timestamp"

  attribute {
    name = "finding_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "account_id"
    type = "S"
  }

  attribute {
    name = "finding_type"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  global_secondary_index {
    name            = "AccountIdIndex"
    hash_key        = "account_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "FindingTypeIndex"
    hash_key        = "finding_type"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.cloudtrail.arn
  }

  tags = {
    Name = "${var.project_name}-security-findings"
  }
}
```

### lambda-log-processor.tf

```hcl
# Lambda layer for common dependencies
resource "aws_lambda_layer_version" "analytics_dependencies" {
  filename            = "${path.module}/layers/analytics-dependencies.zip"
  layer_name          = "${var.project_name}-analytics-dependencies"
  compatible_runtimes = [var.lambda_runtime]
  description         = "Common dependencies for CloudTrail analytics"

  # Placeholder - actual layer would include boto3, pandas, pyarrow, etc.
}

# Log processor Lambda
resource "aws_lambda_function" "log_processor" {
  filename         = "${path.module}/lambda/log_processor.zip"
  function_name    = "${var.project_name}-log-processor"
  role            = aws_iam_role.lambda_log_processor.arn
  handler         = "log_processor.handler"
  runtime         = var.lambda_runtime
  memory_size     = var.lambda_memory_size.log_processor
  timeout         = var.lambda_timeout.log_processor

  layers = [aws_lambda_layer_version.analytics_dependencies.arn]

  environment {
    variables = {
      SOURCE_BUCKET     = aws_s3_bucket.cloudtrail_logs.id
      TARGET_BUCKET     = aws_s3_bucket.enriched_logs.id
      RISK_ACTIONS_LIST = jsonencode(var.high_risk_actions)
      GLUE_DATABASE     = aws_glue_catalog_database.cloudtrail_enriched.name
      GLUE_TABLE        = "enriched_events"
    }
  }

  tracing_config {
    mode = "Active"
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq_log_processor.arn
  }
}

resource "aws_lambda_permission" "log_processor_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.log_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.new_cloudtrail_logs.arn
}

# EventBridge rule for new CloudTrail logs
resource "aws_cloudwatch_event_rule" "new_cloudtrail_logs" {
  name        = "${var.project_name}-new-cloudtrail-logs"
  description = "Trigger log processor on new CloudTrail logs"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["Object Created"]
    detail = {
      bucket = {
        name = [aws_s3_bucket.cloudtrail_logs.id]
      }
      object = {
        key = [{
          prefix = "AWSLogs/"
        }]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "log_processor" {
  rule      = aws_cloudwatch_event_rule.new_cloudtrail_logs.name
  target_id = "LogProcessorLambda"
  arn       = aws_lambda_function.log_processor.arn
}

# Dead letter queue
resource "aws_sqs_queue" "dlq_log_processor" {
  name                      = "${var.project_name}-dlq-log-processor"
  message_retention_seconds = 1209600  # 14 days

  kms_master_key_id = aws_kms_key.cloudtrail.id
}
```

### lambda-security-analyzer.tf

```hcl
resource "aws_lambda_function" "security_analyzer" {
  filename         = "${path.module}/lambda/security_analyzer.zip"
  function_name    = "${var.project_name}-security-analyzer"
  role            = aws_iam_role.lambda_security_analyzer.arn
  handler         = "security_analyzer.handler"
  runtime         = var.lambda_runtime
  memory_size     = var.lambda_memory_size.security_analyzer
  timeout         = var.lambda_timeout.security_analyzer

  layers = [aws_lambda_layer_version.analytics_dependencies.arn]

  environment {
    variables = {
      ATHENA_DATABASE        = aws_glue_catalog_database.cloudtrail_enriched.name
      ATHENA_WORKGROUP       = aws_athena_workgroup.cloudtrail_analytics.name
      ATHENA_RESULTS_BUCKET  = aws_s3_bucket.athena_results.id
      FINDINGS_TABLE         = aws_dynamodb_table.security_findings.name
      HIGH_RISK_ACTIONS      = jsonencode(var.high_risk_actions)
      CLOUDWATCH_NAMESPACE   = "Security/CloudTrail"
      SNS_CRITICAL_TOPIC     = aws_sns_topic.alerts_critical.arn
      SNS_HIGH_TOPIC         = aws_sns_topic.alerts_high.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq_security_analyzer.arn
  }
}

resource "aws_lambda_permission" "security_analyzer_schedule" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.security_analyzer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.security_analysis_schedule.arn
}

resource "aws_cloudwatch_event_rule" "security_analysis_schedule" {
  name                = "${var.project_name}-security-analysis-schedule"
  description         = "Trigger security analyzer hourly"
  schedule_expression = var.schedules.security_analysis
}

resource "aws_cloudwatch_event_target" "security_analyzer" {
  rule      = aws_cloudwatch_event_rule.security_analysis_schedule.name
  target_id = "SecurityAnalyzerLambda"
  arn       = aws_lambda_function.security_analyzer.arn
}

resource "aws_sqs_queue" "dlq_security_analyzer" {
  name                      = "${var.project_name}-dlq-security-analyzer"
  message_retention_seconds = 1209600  # 14 days

  kms_master_key_id = aws_kms_key.cloudtrail.id
}
```

### lambda-alert-enricher.tf

```hcl
resource "aws_lambda_function" "alert_enricher" {
  filename         = "${path.module}/lambda/alert_enricher.zip"
  function_name    = "${var.project_name}-alert-enricher"
  role            = aws_iam_role.lambda_alert_enricher.arn
  handler         = "alert_enricher.handler"
  runtime         = var.lambda_runtime
  memory_size     = var.lambda_memory_size.alert_enricher
  timeout         = var.lambda_timeout.alert_enricher

  layers = [aws_lambda_layer_version.analytics_dependencies.arn]

  environment {
    variables = {
      SNS_CRITICAL_TOPIC = aws_sns_topic.alerts_critical.arn
      SNS_HIGH_TOPIC     = aws_sns_topic.alerts_high.arn
      SNS_MEDIUM_TOPIC   = aws_sns_topic.alerts_medium.arn
      CACHE_TABLE        = aws_dynamodb_table.alert_cache.name
    }
  }

  tracing_config {
    mode = "Active"
  }
}

# DynamoDB table for alert deduplication
resource "aws_dynamodb_table" "alert_cache" {
  name         = "${var.project_name}-alert-cache"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "alert_hash"

  attribute {
    name = "alert_hash"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

# Grant EventBridge permission to invoke
resource "aws_lambda_permission" "alert_enricher_eventbridge" {
  count = length(local.alert_event_rules)

  statement_id  = "AllowExecutionFromEventBridge-${count.index}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alert_enricher.function_name
  principal     = "events.amazonaws.com"
  source_arn    = local.alert_event_rules[count.index]
}

locals {
  alert_event_rules = [
    aws_cloudwatch_event_rule.root_account_usage.arn,
    aws_cloudwatch_event_rule.console_login_without_mfa.arn,
    aws_cloudwatch_event_rule.iam_policy_changes.arn,
    aws_cloudwatch_event_rule.public_s3_bucket.arn,
    aws_cloudwatch_event_rule.security_group_public.arn
  ]
}
```

### lambda-compaction.tf

```hcl
resource "aws_lambda_function" "log_compactor" {
  count = var.features.cost_optimization ? 1 : 0

  filename         = "${path.module}/lambda/log_compactor.zip"
  function_name    = "${var.project_name}-log-compactor"
  role            = aws_iam_role.lambda_log_compactor[0].arn
  handler         = "log_compactor.handler"
  runtime         = var.lambda_runtime
  memory_size     = var.lambda_memory_size.log_compactor
  timeout         = var.lambda_timeout.log_compactor

  layers = [aws_lambda_layer_version.analytics_dependencies.arn]

  environment {
    variables = {
      SOURCE_BUCKET    = aws_s3_bucket.cloudtrail_logs.id
      TARGET_BUCKET    = aws_s3_bucket.enriched_logs.id
      MIN_FILE_SIZE_MB = "1"
      MAX_FILES_BATCH  = "100"
      GLUE_DATABASE    = aws_glue_catalog_database.cloudtrail_enriched.name
    }
  }

  tracing_config {
    mode = "Active"
  }
}

resource "aws_lambda_permission" "log_compactor_schedule" {
  count = var.features.cost_optimization ? 1 : 0

  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.log_compactor[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compaction_schedule[0].arn
}

resource "aws_cloudwatch_event_rule" "compaction_schedule" {
  count = var.features.cost_optimization ? 1 : 0

  name                = "${var.project_name}-compaction-schedule"
  description         = "Trigger log compactor weekly"
  schedule_expression = var.schedules.log_compaction
}

resource "aws_cloudwatch_event_target" "log_compactor" {
  count = var.features.cost_optimization ? 1 : 0

  rule      = aws_cloudwatch_event_rule.compaction_schedule[0].name
  target_id = "LogCompactorLambda"
  arn       = aws_lambda_function.log_compactor[0].arn
}
```

### lambda-reporting.tf

```hcl
resource "aws_lambda_function" "compliance_reporter" {
  count = var.features.compliance_reports ? 1 : 0

  filename         = "${path.module}/lambda/compliance_reporter.zip"
  function_name    = "${var.project_name}-compliance-reporter"
  role            = aws_iam_role.lambda_compliance_reporter[0].arn
  handler         = "compliance_reporter.handler"
  runtime         = var.lambda_runtime
  memory_size     = var.lambda_memory_size.compliance_reporter
  timeout         = var.lambda_timeout.compliance_reporter

  layers = [aws_lambda_layer_version.analytics_dependencies.arn]

  environment {
    variables = {
      ATHENA_DATABASE       = aws_glue_catalog_database.cloudtrail_enriched.name
      ATHENA_WORKGROUP      = aws_athena_workgroup.cloudtrail_analytics.name
      ATHENA_RESULTS_BUCKET = aws_s3_bucket.athena_results.id
      REPORTS_BUCKET        = aws_s3_bucket.compliance_reports.id
      FINDINGS_TABLE        = aws_dynamodb_table.security_findings.name
      EMAIL_RECIPIENTS      = jsonencode(var.compliance_report_recipients)
      SES_REGION            = var.aws_region
    }
  }

  tracing_config {
    mode = "Active"
  }
}

resource "aws_lambda_permission" "compliance_reporter_schedule" {
  count = var.features.compliance_reports ? 1 : 0

  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_reporter[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.reporting_schedule[0].arn
}

resource "aws_cloudwatch_event_rule" "reporting_schedule" {
  count = var.features.compliance_reports ? 1 : 0

  name                = "${var.project_name}-reporting-schedule"
  description         = "Trigger compliance reporter monthly"
  schedule_expression = var.schedules.compliance_reporting
}

resource "aws_cloudwatch_event_target" "compliance_reporter" {
  count = var.features.compliance_reports ? 1 : 0

  rule      = aws_cloudwatch_event_rule.reporting_schedule[0].name
  target_id = "ComplianceReporterLambda"
  arn       = aws_lambda_function.compliance_reporter[0].arn
}
```

### eventbridge.tf

```hcl
# Real-time alert rules
resource "aws_cloudwatch_event_rule" "root_account_usage" {
  name        = "${var.project_name}-root-account-usage"
  description = "Alert on root account activity"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["Object Created"]
    detail = {
      bucket = {
        name = [aws_s3_bucket.cloudtrail_logs.id]
      }
      object = {
        key = [{
          wildcard = "*CloudTrail*.json.gz"
        }]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "root_account_alert" {
  rule      = aws_cloudwatch_event_rule.root_account_usage.name
  target_id = "AlertEnricher"
  arn       = aws_lambda_function.alert_enricher.arn

  input_transformer {
    input_paths = {
      bucket = "$.detail.bucket.name"
      key    = "$.detail.object.key"
    }

    input_template = <<EOF
{
  "event_type": "root_account_usage",
  "severity": "critical",
  "bucket": "<bucket>",
  "key": "<key>"
}
EOF
  }
}

resource "aws_cloudwatch_event_rule" "console_login_without_mfa" {
  name        = "${var.project_name}-console-login-no-mfa"
  description = "Alert on console login without MFA"

  event_pattern = jsonencode({
    source      = ["aws.signin"]
    detail-type = ["AWS Console Sign In via CloudTrail"]
    detail = {
      eventName = ["ConsoleLogin"]
      additionalEventData = {
        MFAUsed = ["No"]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "console_login_alert" {
  rule      = aws_cloudwatch_event_rule.console_login_without_mfa.name
  target_id = "AlertEnricher"
  arn       = aws_lambda_function.alert_enricher.arn

  input_transformer {
    input_paths = {
      user       = "$.detail.userIdentity.principalId"
      account    = "$.detail.recipientAccountId"
      sourceIP   = "$.detail.sourceIPAddress"
      eventTime  = "$.detail.eventTime"
    }

    input_template = <<EOF
{
  "event_type": "console_login_no_mfa",
  "severity": "high",
  "user": "<user>",
  "account": "<account>",
  "source_ip": "<sourceIP>",
  "event_time": "<eventTime>"
}
EOF
  }
}

resource "aws_cloudwatch_event_rule" "iam_policy_changes" {
  name        = "${var.project_name}-iam-policy-changes"
  description = "Alert on IAM policy modifications"

  event_pattern = jsonencode({
    source      = ["aws.iam"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "AttachUserPolicy",
        "AttachRolePolicy",
        "PutUserPolicy",
        "PutRolePolicy",
        "DeleteUserPolicy",
        "DeleteRolePolicy",
        "DetachUserPolicy",
        "DetachRolePolicy"
      ]
    }
  })
}

resource "aws_cloudwatch_event_target" "iam_policy_alert" {
  rule      = aws_cloudwatch_event_rule.iam_policy_changes.name
  target_id = "AlertEnricher"
  arn       = aws_lambda_function.alert_enricher.arn

  input_transformer {
    input_paths = {
      eventName  = "$.detail.eventName"
      user       = "$.detail.userIdentity.principalId"
      account    = "$.detail.recipientAccountId"
      sourceIP   = "$.detail.sourceIPAddress"
      eventTime  = "$.detail.eventTime"
    }

    input_template = <<EOF
{
  "event_type": "iam_policy_change",
  "severity": "high",
  "event_name": "<eventName>",
  "user": "<user>",
  "account": "<account>",
  "source_ip": "<sourceIP>",
  "event_time": "<eventTime>"
}
EOF
  }
}

resource "aws_cloudwatch_event_rule" "public_s3_bucket" {
  name        = "${var.project_name}-public-s3-bucket"
  description = "Alert on S3 buckets made public"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = ["PutBucketPolicy", "PutBucketAcl"]
    }
  })
}

resource "aws_cloudwatch_event_target" "public_s3_alert" {
  rule      = aws_cloudwatch_event_rule.public_s3_bucket.name
  target_id = "AlertEnricher"
  arn       = aws_lambda_function.alert_enricher.arn

  input_transformer {
    input_paths = {
      bucket     = "$.detail.requestParameters.bucketName"
      user       = "$.detail.userIdentity.principalId"
      account    = "$.detail.recipientAccountId"
      eventTime  = "$.detail.eventTime"
    }

    input_template = <<EOF
{
  "event_type": "s3_bucket_policy_change",
  "severity": "critical",
  "bucket": "<bucket>",
  "user": "<user>",
  "account": "<account>",
  "event_time": "<eventTime>"
}
EOF
  }
}

resource "aws_cloudwatch_event_rule" "security_group_public" {
  name        = "${var.project_name}-security-group-public"
  description = "Alert on security groups allowing public access"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = ["AuthorizeSecurityGroupIngress"]
      requestParameters = {
        ipPermissions = {
          items = {
            ipRanges = {
              items = {
                cidrIp = ["0.0.0.0/0"]
              }
            }
          }
        }
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "security_group_alert" {
  rule      = aws_cloudwatch_event_rule.security_group_public.name
  target_id = "AlertEnricher"
  arn       = aws_lambda_function.alert_enricher.arn

  input_transformer {
    input_paths = {
      groupId    = "$.detail.requestParameters.groupId"
      user       = "$.detail.userIdentity.principalId"
      account    = "$.detail.recipientAccountId"
      eventTime  = "$.detail.eventTime"
    }

    input_template = <<EOF
{
  "event_type": "security_group_public_access",
  "severity": "critical",
  "security_group": "<groupId>",
  "user": "<user>",
  "account": "<account>",
  "event_time": "<eventTime>"
}
EOF
  }
}

# EventBridge pipe for aggregating failed authorizations
resource "aws_pipes_pipe" "failed_auth_aggregator" {
  name     = "${var.project_name}-failed-auth-aggregator"
  role_arn = aws_iam_role.eventbridge_pipe.arn

  source = aws_kinesis_stream.failed_auth_events.arn
  target = aws_lambda_function.alert_enricher.arn

  source_parameters {
    kinesis_stream_parameters {
      starting_position = "LATEST"
    }
  }

  enrichment = aws_lambda_function.auth_failure_aggregator.arn
}

# Kinesis stream for failed auth events
resource "aws_kinesis_stream" "failed_auth_events" {
  name             = "${var.project_name}-failed-auth-events"
  shard_count      = 1
  retention_period = 24

  encryption_type = "KMS"
  kms_key_id      = aws_kms_key.cloudtrail.arn
}

# Lambda for aggregating auth failures
resource "aws_lambda_function" "auth_failure_aggregator" {
  filename         = "${path.module}/lambda/auth_failure_aggregator.zip"
  function_name    = "${var.project_name}-auth-failure-aggregator"
  role            = aws_iam_role.lambda_aggregator.arn
  handler         = "auth_failure_aggregator.handler"
  runtime         = var.lambda_runtime
  memory_size     = 256
  timeout         = 60

  environment {
    variables = {
      FAILURE_THRESHOLD = var.alert_thresholds.failed_logins_per_5min
      TIME_WINDOW       = "300"  # 5 minutes
    }
  }
}
```

### sns.tf

```hcl
# SNS topics for different severity levels
resource "aws_sns_topic" "alerts_critical" {
  name              = "${var.project_name}-alerts-critical"
  display_name      = "CloudTrail Critical Alerts"
  kms_master_key_id = aws_kms_key.cloudtrail.id
}

resource "aws_sns_topic" "alerts_high" {
  name              = "${var.project_name}-alerts-high"
  display_name      = "CloudTrail High Priority Alerts"
  kms_master_key_id = aws_kms_key.cloudtrail.id
}

resource "aws_sns_topic" "alerts_medium" {
  name              = "${var.project_name}-alerts-medium"
  display_name      = "CloudTrail Medium Priority Alerts"
  kms_master_key_id = aws_kms_key.cloudtrail.id
}

# Email subscriptions for critical alerts
resource "aws_sns_topic_subscription" "critical_emails" {
  for_each = toset(var.sns_email_endpoints.critical)

  topic_arn = aws_sns_topic.alerts_critical.arn
  protocol  = "email"
  endpoint  = each.value
}

# Email subscriptions for high alerts
resource "aws_sns_topic_subscription" "high_emails" {
  for_each = toset(var.sns_email_endpoints.high)

  topic_arn = aws_sns_topic.alerts_high.arn
  protocol  = "email"
  endpoint  = each.value
}

# Email subscriptions for medium alerts
resource "aws_sns_topic_subscription" "medium_emails" {
  for_each = toset(var.sns_email_endpoints.medium)

  topic_arn = aws_sns_topic.alerts_medium.arn
  protocol  = "email"
  endpoint  = each.value
}

# SNS topic policies
resource "aws_sns_topic_policy" "alerts_critical" {
  arn    = aws_sns_topic.alerts_critical.arn
  policy = data.aws_iam_policy_document.sns_topic_policy[0].json
}

resource "aws_sns_topic_policy" "alerts_high" {
  arn    = aws_sns_topic.alerts_high.arn
  policy = data.aws_iam_policy_document.sns_topic_policy[1].json
}

resource "aws_sns_topic_policy" "alerts_medium" {
  arn    = aws_sns_topic.alerts_medium.arn
  policy = data.aws_iam_policy_document.
```
