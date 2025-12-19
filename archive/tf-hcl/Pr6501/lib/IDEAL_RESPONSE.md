# Ideal Terraform Implementation

```hcl
# provider.tf
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

```hcl
# variables.tf
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "environment_suffix" {
  description = "Unique suffix appended to resource names for environment isolation"
  type        = string
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "trading-analytics"
}

variable "vpc_id" {
  description = "VPC ID where EMR will be deployed"
  type        = string
}

variable "public_subnet_id" {
  description = "Public subnet ID for EMR master node"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for EMR core/task nodes across at least two AZs"
  type        = list(string)

  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "Provide at least two private subnet IDs spanning multiple AZs."
  }
}

variable "corporate_cidr" {
  description = "Corporate CIDR block for SSH access"
  type        = string
  default     = "10.0.0.0/8"
}

variable "s3_raw_bucket_name" {
  description = "Optional override for the raw input S3 bucket name"
  type        = string
  default     = null
}

variable "s3_curated_bucket_name" {
  description = "Optional override for the curated output S3 bucket name"
  type        = string
  default     = null
}

variable "s3_logs_bucket_name" {
  description = "Optional override for the EMR logs S3 bucket name"
  type        = string
  default     = null
}

variable "emr_release_label" {
  description = "EMR release version"
  type        = string
  default     = "emr-6.9.0"
}

variable "master_instance_type" {
  description = "Instance type for master node"
  type        = string
  default     = "m5.xlarge"
}

variable "core_instance_type" {
  description = "Instance type for core nodes"
  type        = string
  default     = "m5.xlarge"
}

variable "core_instance_count" {
  description = "Number of core instances"
  type        = number
  default     = 2

  validation {
    condition     = var.core_instance_count >= 2
    error_message = "Core instance group must contain at least two instances for HDFS replication."
  }
}

variable "task_instance_type" {
  description = "Instance type for task nodes"
  type        = string
  default     = "m5.xlarge"
}

variable "task_instance_min" {
  description = "Minimum number of task instances"
  type        = number
  default     = 0
}

variable "task_instance_max" {
  description = "Maximum number of task instances"
  type        = number
  default     = 10
}

variable "yarn_memory_target" {
  description = "Target value for YARNMemoryAvailablePercentage used by the autoscaling policy"
  type        = number
  default     = 25
}

variable "idle_timeout_seconds" {
  description = "Idle timeout in seconds (8 hours)"
  type        = number
  default     = 28800
}

variable "step_concurrency_level" {
  description = "Maximum concurrent steps"
  type        = number
  default     = 5
}

variable "ec2_key_pair_name" {
  description = "EC2 key pair name for SSH access"
  type        = string
}

variable "emr_kms_key_deletion_window_days" {
  description = "Number of days before the EMR-specific KMS key is deleted after destroy"
  type        = number
  default     = 7

  validation {
    condition     = var.emr_kms_key_deletion_window_days >= 7 && var.emr_kms_key_deletion_window_days <= 30
    error_message = "KMS key deletion window must be between 7 and 30 days."
  }
}
```

```hcl
# tap_stack.tf
locals {
  normalized_project = lower(regexreplace(var.project_name, "[^a-z0-9-]", "-"))
  normalized_suffix  = lower(regexreplace(var.environment_suffix, "[^a-z0-9-]", "-"))
  normalized_region  = lower(regexreplace(var.aws_region, "[^a-z0-9-]", "-"))

  bucket_prefix = trim(lower(join("-", compact([
    local.normalized_project,
    local.normalized_suffix,
    local.normalized_region
  ]))), "-")

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
```

```hcl
# main.tf
##############################
# Encryption and Data Stores #
##############################

resource "aws_kms_key" "emr" {
  description             = "KMS key for EMR local disk encryption (${var.project_name})"
  deletion_window_in_days = var.emr_kms_key_deletion_window_days
  enable_key_rotation     = true
  tags                    = local.common_tags
}

resource "aws_kms_alias" "emr" {
  name          = "alias/${local.bucket_prefix}-emr"
  target_key_id = aws_kms_key.emr.key_id
}

resource "aws_s3_bucket" "raw" {
  bucket        = local.raw_bucket_name
  force_destroy = false

  tags = merge(local.common_tags, {
    DataClassification = "raw"
  })
}

resource "aws_s3_bucket_public_access_block" "raw" {
  bucket = aws_s3_bucket.raw.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "raw" {
  bucket = aws_s3_bucket.raw.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "raw" {
  bucket = aws_s3_bucket.raw.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "curated" {
  bucket        = local.curated_bucket_name
  force_destroy = false

  tags = merge(local.common_tags, {
    DataClassification = "curated"
  })
}

resource "aws_s3_bucket_public_access_block" "curated" {
  bucket = aws_s3_bucket.curated.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "curated" {
  bucket = aws_s3_bucket.curated.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "curated" {
  bucket = aws_s3_bucket.curated.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "logs" {
  bucket        = local.logs_bucket_name
  force_destroy = false

  tags = merge(local.common_tags, {
    Purpose = "emr-logs"
  })
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "logs_https_only" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

####################
# Network Security #
####################

resource "aws_security_group" "emr_master" {
  name_prefix = "${local.bucket_prefix}-master-"
  description = "Security group for EMR master node"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH from corporate network"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.corporate_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-emr-master-sg"
  })
}

resource "aws_security_group" "emr_core_task" {
  name_prefix = "${local.bucket_prefix}-core-task-"
  description = "Security group for EMR core and task nodes"
  vpc_id      = var.vpc_id

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-emr-core-task-sg"
  })
}

resource "aws_security_group" "emr_service" {
  name_prefix = "${local.bucket_prefix}-service-"
  description = "Service access security group for EMR control plane"
  vpc_id      = var.vpc_id

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-emr-service-sg"
  })
}

resource "aws_security_group_rule" "core_task_from_master" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.emr_master.id
  security_group_id        = aws_security_group.emr_core_task.id
  description              = "Allow traffic from master nodes to core/task nodes"
}

resource "aws_security_group_rule" "master_from_core_task" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.emr_core_task.id
  security_group_id        = aws_security_group.emr_master.id
  description              = "Allow traffic from core/task nodes to master"
}

resource "aws_security_group_rule" "core_task_self" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.emr_core_task.id
  security_group_id        = aws_security_group.emr_core_task.id
  description              = "Allow intra-node communication between core/task nodes"
}

resource "aws_security_group_rule" "service_from_master" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.emr_master.id
  security_group_id        = aws_security_group.emr_service.id
  description              = "Allow EMR control plane traffic from master"
}

############################
# Security Configuration  #
############################

resource "aws_emr_security_configuration" "main" {
  name = "${local.bucket_prefix}-security-config"

  configuration = jsonencode({
    EncryptionConfiguration = {
      EnableInTransitEncryption = true
      EnableAtRestEncryption    = true
      AtRestEncryptionConfiguration = {
        S3EncryptionConfiguration = {
          EncryptionMode = "SSE-S3"
        }
        LocalDiskEncryptionConfiguration = {
          EncryptionKeyProviderType = "AwsKms"
          AwsKmsKey                 = aws_kms_key.emr.arn
        }
      }
      InTransitEncryptionConfiguration = {
        TLSCertificateConfiguration = {
          CertificateProviderType = "PEM"
        }
      }
    }
  })
}

####################
# Bootstrap Script #
####################

resource "aws_s3_object" "bootstrap_script" {
  bucket = aws_s3_bucket.logs.id
  key    = "bootstrap/install-analytics-libs.sh"
  source = "${path.module}/bootstrap.sh"
  etag   = filemd5("${path.module}/bootstrap.sh")
}

################
# EMR Cluster #
################

resource "aws_emr_cluster" "main" {
  name          = "${local.bucket_prefix}-emr-cluster"
  release_label = var.emr_release_label
  applications  = ["Spark", "Hadoop", "Hive"]

  termination_protection            = true
  keep_job_flow_alive_when_no_steps = true
  step_concurrency_level            = var.step_concurrency_level
  visible_to_all_users              = true

  ec2_attributes {
    subnet_ids                        = concat([var.public_subnet_id], var.private_subnet_ids)
    emr_managed_master_security_group = aws_security_group.emr_master.id
    emr_managed_slave_security_group  = aws_security_group.emr_core_task.id
    service_access_security_group     = aws_security_group.emr_service.id
    instance_profile                  = aws_iam_instance_profile.emr_ec2_instance_profile.arn
    key_name                          = var.ec2_key_pair_name
  }

  master_instance_group {
    instance_type  = var.master_instance_type
    instance_count = 1

    ebs_config {
      size                 = 100
      type                 = "gp3"
      iops                 = 3000
      throughput           = 125
      volumes_per_instance = 1
    }
  }

  core_instance_group {
    instance_type  = var.core_instance_type
    instance_count = var.core_instance_count

    ebs_config {
      size                 = 100
      type                 = "gp3"
      iops                 = 3000
      throughput           = 125
      volumes_per_instance = 1
    }
  }

  service_role     = aws_iam_role.emr_service_role.arn
  autoscaling_role = aws_iam_role.emr_autoscaling_role.arn

  security_configuration = aws_emr_security_configuration.main.name

  configurations_json = jsonencode([
    {
      Classification = "spark"
      Properties = {
        "maximizeResourceAllocation" = "true"
      }
    },
    {
      Classification = "spark-defaults"
      Properties = {
        "spark.dynamicAllocation.enabled"               = "true"
        "spark.shuffle.service.enabled"                 = "true"
        "spark.serializer"                              = "org.apache.spark.serializer.KryoSerializer"
        "spark.sql.adaptive.enabled"                    = "true"
        "spark.sql.adaptive.coalescePartitions.enabled" = "true"
        "spark.sql.adaptive.localShuffleReader.enabled" = "true"
      }
    },
    {
      Classification = "yarn-site"
      Properties = {
        "yarn.nodemanager.vmem-check-enabled" = "false"
      }
    },
    {
      Classification = "capacity-scheduler"
      Properties = {
        "yarn.scheduler.capacity.resource-calculator" = "org.apache.hadoop.yarn.util.resource.DominantResourceCalculator"
      }
    },
    {
      Classification = "spark-hive-site"
      Properties = {
        "hive.metastore.client.factory.class" = "com.amazonaws.glue.catalog.metastore.AWSGlueDataCatalogHiveClientFactory"
      }
    }
  ])

  bootstrap_action {
    name = "install_analytics_libraries"
    path = "s3://${aws_s3_bucket.logs.bucket}/bootstrap/install-analytics-libs.sh"
  }

  log_uri = "s3://${aws_s3_bucket.logs.bucket}/emr-logs/"

  auto_termination_policy {
    idle_timeout = var.idle_timeout_seconds
  }

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-emr-cluster"
  })

  depends_on = [
    aws_s3_bucket.logs,
    aws_s3_bucket.curated,
    aws_s3_bucket.raw,
    aws_s3_object.bootstrap_script
  ]
}

resource "aws_emr_instance_group" "task" {
  cluster_id     = aws_emr_cluster.main.id
  instance_type  = var.task_instance_type
  instance_count = max(1, var.task_instance_min)
  name           = "Task Instance Group"
  market         = "SPOT"

  ebs_config {
    size                 = 100
    type                 = "gp3"
    iops                 = 3000
    throughput           = 125
    volumes_per_instance = 1
  }

  lifecycle {
    create_before_destroy = true
  }

  configurations_json = jsonencode([
    {
      Classification = "spark"
      Properties = {
        "maximizeResourceAllocation" = "true"
      }
    }
  ])
}

######################
# CloudWatch Logging #
######################

resource "aws_cloudwatch_log_group" "emr_cluster_logs" {
  name              = "/aws/emr/${local.bucket_prefix}"
  retention_in_days = 30
  tags              = local.common_tags
}
```

```hcl
# iam.tf
# EMR Service Role
resource "aws_iam_role" "emr_service_role" {
  name = "${local.bucket_prefix}-emr-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "elasticmapreduce.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "emr_service_role" {
  role       = aws_iam_role.emr_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEMRServicePolicy_v2"
}

# EMR EC2 Instance Profile Role
resource "aws_iam_role" "emr_ec2_role" {
  name = "${local.bucket_prefix}-emr-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Least-privilege S3 access policy
resource "aws_iam_role_policy" "emr_s3_access" {
  name = "${local.bucket_prefix}-emr-s3-access"
  role = aws_iam_role.emr_ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListAndLocateDataBuckets"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.raw.arn,
          aws_s3_bucket.curated.arn,
          aws_s3_bucket.logs.arn
        ]
      },
      {
        Sid    = "ReadRawTradingData"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.raw.arn}/*"
      },
      {
        Sid    = "WriteCuratedAnalyticsData"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.curated.arn}/*"
      },
      {
        Sid    = "PublishClusterLogs"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.logs.arn}/bootstrap/*",
          "${aws_s3_bucket.logs.arn}/emr-logs/*"
        ]
      }
    ]
  })
}

# CloudWatch Logs policy
resource "aws_iam_role_policy" "emr_cloudwatch_logs" {
  name = "${local.bucket_prefix}-emr-cloudwatch-logs"
  role = aws_iam_role.emr_ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:${aws_cloudwatch_log_group.emr_cluster_logs.name}",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:${aws_cloudwatch_log_group.emr_cluster_logs.name}:*"
        ]
      }
    ]
  })
}

# EC2 tagging policy for EMR
resource "aws_iam_role_policy" "emr_ec2_tagging" {
  name = "${local.bucket_prefix}-emr-ec2-tagging"
  role = aws_iam_role.emr_ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags",
          "ec2:DescribeTags",
          "ec2:DescribeInstances"
        ]
        Resource = [
          "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/*",
          "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:volume/*"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "emr_ec2_instance_profile" {
  name = "${local.bucket_prefix}-emr-ec2-profile"
  role = aws_iam_role.emr_ec2_role.name
}

# Auto Scaling Role
resource "aws_iam_role" "emr_autoscaling_role" {
  name = "${local.bucket_prefix}-emr-autoscaling-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "application-autoscaling.amazonaws.com",
            "elasticmapreduce.amazonaws.com"
          ]
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "emr_autoscaling_role" {
  role       = aws_iam_role.emr_autoscaling_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonElasticMapReduceforAutoScalingRole"
}
```

```hcl
# autoscaling.tf
# Auto Scaling Policy for Task Nodes
resource "aws_emr_managed_scaling_policy" "main" {
  cluster_id = aws_emr_cluster.main.id

  compute_limits {
    unit_type                       = "Instances"
    minimum_capacity_units          = 1 + var.core_instance_count
    maximum_capacity_units          = 1 + var.core_instance_count + var.task_instance_max
    maximum_ondemand_capacity_units = 1 + var.core_instance_count
    maximum_core_capacity_units     = 1 + var.core_instance_count
  }
}

# Custom Auto Scaling Rules based on YARN Memory
resource "aws_applicationautoscaling_target" "emr_task_group" {
  max_capacity       = var.task_instance_max
  min_capacity       = var.task_instance_min
  resource_id        = "instancegroup/${aws_emr_cluster.main.id}/${aws_emr_instance_group.task.id}"
  role_arn           = aws_iam_role.emr_autoscaling_role.arn
  scalable_dimension = "elasticmapreduce:instancegroup:InstanceCount"
  service_namespace  = "elasticmapreduce"
}

# Scale Out Policy - When YARN Memory Available is Low
resource "aws_applicationautoscaling_policy" "scale_out" {
  name               = "${local.bucket_prefix}-emr-yarn-memory"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_applicationautoscaling_target.emr_task_group.resource_id
  scalable_dimension = aws_applicationautoscaling_target.emr_task_group.scalable_dimension
  service_namespace  = aws_applicationautoscaling_target.emr_task_group.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = var.yarn_memory_target

    customized_metric_specification {
      metric_name = "YARNMemoryAvailablePercentage"
      namespace   = "AWS/ElasticMapReduce"
      statistic   = "Average"
      unit        = "Percent"

      dimensions {
        name  = "ClusterId"
        value = aws_emr_cluster.main.id
      }
    }

    scale_out_cooldown = 300
    scale_in_cooldown  = 300
  }
}

# CloudWatch Dashboard for Monitoring
resource "aws_cloudwatch_dashboard" "emr_monitoring" {
  dashboard_name = "${local.bucket_prefix}-emr-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ElasticMapReduce", "YARNMemoryAvailablePercentage", { stat = "Average" }],
            [".", "ContainerPendingRatio", { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "YARN Memory and Container Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ElasticMapReduce", "CoreNodesRunning", { stat = "Average" }],
            [".", "TaskNodesRunning", { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Running Instances"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 24
        height = 6

        properties = {
          metrics = [
            ["AWS/ElasticMapReduce", "AppsCompleted", { stat = "Sum" }],
            [".", "AppsFailed", { stat = "Sum" }],
            [".", "AppsRunning", { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Application Status"
          period  = 300
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_yarn_memory_pressure" {
  alarm_name          = "${local.bucket_prefix}-emr-high-memory-pressure"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "YARNMemoryAvailablePercentage"
  namespace           = "AWS/ElasticMapReduce"
  period              = "300"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "YARN memory available is critically low"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterId = aws_emr_cluster.main.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "failed_apps" {
  alarm_name          = "${local.bucket_prefix}-emr-failed-apps"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "AppsFailed"
  namespace           = "AWS/ElasticMapReduce"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "More than 5 applications failed in the last 5 minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterId = aws_emr_cluster.main.id
  }

  tags = local.common_tags
}
```

```bash
# bootstrap.sh
#!/bin/bash
set -euo pipefail

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

log "Starting EMR bootstrap action"

if ! command -v python3 >/dev/null 2>&1; then
  log "Installing Python 3 and pip via yum"
  sudo yum install -y python3 python3-pip
fi

log "Upgrading pip to the latest available version"
sudo python3 -m pip install --upgrade pip

REQUIRED_PACKAGES=(
  "numpy==1.24.3"
  "pandas==2.0.3"
  "pyarrow==12.0.1"
)

log "Installing analytics Python packages: ${REQUIRED_PACKAGES[*]}"
sudo python3 -m pip install --upgrade "${REQUIRED_PACKAGES[@]}"

log "Verifying installed package versions"
python3 - <<'PYTHON'
import numpy, pandas, pyarrow
print(f"NumPy version: {numpy.__version__}")
print(f"Pandas version: {pandas.__version__}")
print(f"PyArrow version: {pyarrow.__version__}")
PYTHON

SPARK_ENV="/etc/spark/conf/spark-env.sh"
log "Configuring Spark to use system Python at ${SPARK_ENV}"
sudo tee -a "${SPARK_ENV}" >/dev/null <<'EOF'
export PYSPARK_PYTHON=/usr/bin/python3
export PYSPARK_DRIVER_PYTHON=/usr/bin/python3
EOF

log "Bootstrap actions completed successfully"
```