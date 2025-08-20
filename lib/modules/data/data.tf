#######################
# S3 Logging Bucket
#######################

resource "aws_s3_bucket" "logs" {
  bucket = var.logs_bucket_name

  tags = merge(var.common_tags, { Name = "${var.name_prefix}-logs", Type = "Logging" })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_main_arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    id     = "log-lifecycle"
    status = "Enabled"
    filter {
      prefix = "logs/"
    }
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    expiration { days = 365 }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = { Service = "delivery.logs.amazonaws.com" }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = { Service = "delivery.logs.amazonaws.com" }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logs.arn
      },
      {
        Sid = "ALBLogs"
        Effect = "Allow"
        Principal = { AWS = var.elb_service_account_arn }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/alb-logs/AWSLogs/${var.aws_account_id}/*"
      },
      {
        Sid = "AllowALBToPutObjectFromThisAccount"
        Effect = "Allow"
        Principal = { Service = "elasticloadbalancing.amazonaws.com" }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = var.aws_account_id
          },
          ArnLike = {
            "aws:SourceArn" = "arn:aws:elasticloadbalancing:${var.aws_region_name}:${var.aws_account_id}:loadbalancer/*"
          }
        }
      }
    ]
  })
}

#######################
# Database
#######################

resource "aws_db_subnet_group" "main" {
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = var.db_subnet_ids
  tags       = merge(var.common_tags, { Name = "${var.name_prefix}-db-subnet-group" })
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.name_prefix}-db-params"
  family = "${var.db_engine}8.0"
  parameter {
    name  = "character_set_server"
    value = "utf8"
  }
  parameter {
    name  = "character_set_client"
    value = "utf8"
  }
  parameter {
    name  = "log_output"
    value = "FILE"
  }
  parameter {
    name  = "slow_query_log"
    value = "1"
  }
  tags = merge(var.common_tags, { Name = "${var.name_prefix}-db-params" })
}

resource "aws_db_instance" "main" {
  identifier            = "${var.name_prefix}-db"
  engine                = var.db_engine
  engine_version        = var.db_engine_version
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 5

  db_name              = "app_${var.environment}"
  username             = var.db_username
  password             = var.db_password
  port                 = var.db_port
  multi_az             = var.db_multi_az
  db_subnet_group_name = aws_db_subnet_group.main.name
  parameter_group_name = aws_db_parameter_group.main.name
  vpc_security_group_ids = [var.sg_db_id]

  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = var.kms_key_rds_arn

  backup_retention_period = var.backup_retention_days
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:30-sun:05:30"

  deletion_protection       = var.environment == "prod" ? true : false
  skip_final_snapshot       = var.environment == "prod" ? false : true
  final_snapshot_identifier = var.environment == "prod" ? "${var.name_prefix}-final-snapshot" : null

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery", "audit"]

  performance_insights_enabled          = var.enable_performance_insights
  performance_insights_retention_period = var.enable_performance_insights ? 7 : 0
  performance_insights_kms_key_id       = var.enable_performance_insights ? var.kms_key_rds_arn : null

  monitoring_interval = 60
  monitoring_role_arn = var.rds_monitoring_role_arn

  auto_minor_version_upgrade = true
  apply_immediately          = var.environment != "prod"

  tags = merge(var.common_tags, { Name = "${var.name_prefix}-db" })
}
