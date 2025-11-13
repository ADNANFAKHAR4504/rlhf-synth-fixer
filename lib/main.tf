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
    subnet_id                         = var.public_subnet_id
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
      type                 = "gp2"
      volumes_per_instance = 1
    }
  }

  core_instance_group {
    instance_type  = var.core_instance_type
    instance_count = var.core_instance_count

    ebs_config {
      size                 = 100
      type                 = "gp2"
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
  bid_price      = var.task_spot_bid_price

  ebs_config {
    size                 = 100
    type                 = "gp2"
    volumes_per_instance = 1
  }

  autoscaling_policy = jsonencode({
    Constraints = {
      MinCapacity = var.task_instance_min
      MaxCapacity = var.task_instance_max
    }
    Rules = [
      {
        Name        = "ScaleOutOnYarnMemory"
        Description = "Increase task nodes when available YARN memory falls below threshold"
        Action = {
          Market = "SPOT"
          SimpleScalingPolicyConfiguration = {
            AdjustmentType    = "CHANGE_IN_CAPACITY"
            ScalingAdjustment = 1
            CoolDown          = 300
          }
        }
        Trigger = {
          CloudWatchAlarmDefinition = {
            ComparisonOperator = "LESS_THAN"
            EvaluationPeriods  = 2
            MetricName         = "YARNMemoryAvailablePercentage"
            Namespace          = "AWS/ElasticMapReduce"
            Period             = 300
            Statistic          = "AVERAGE"
            Threshold          = var.yarn_memory_scale_out_threshold
            Unit               = "PERCENT"
            Dimensions = [
              {
                Key   = "JobFlowId"
                Value = aws_emr_cluster.main.id
              }
            ]
          }
        }
      },
      {
        Name        = "ScaleInOnYarnMemory"
        Description = "Reduce task nodes when the cluster has ample YARN memory available"
        Action = {
          Market = "SPOT"
          SimpleScalingPolicyConfiguration = {
            AdjustmentType    = "CHANGE_IN_CAPACITY"
            ScalingAdjustment = -1
            CoolDown          = 300
          }
        }
        Trigger = {
          CloudWatchAlarmDefinition = {
            ComparisonOperator = "GREATER_THAN"
            EvaluationPeriods  = 2
            MetricName         = "YARNMemoryAvailablePercentage"
            Namespace          = "AWS/ElasticMapReduce"
            Period             = 300
            Statistic          = "AVERAGE"
            Threshold          = var.yarn_memory_scale_in_threshold
            Unit               = "PERCENT"
            Dimensions = [
              {
                Key   = "JobFlowId"
                Value = aws_emr_cluster.main.id
              }
            ]
          }
        }
      }
    ]
  })

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