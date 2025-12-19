# Data sources
data "aws_caller_identity" "current" {}

data "aws_region" "primary" {
  provider = aws.primary
}

data "aws_region" "dr" {
  provider = aws.dr
}

# ==================== PRIMARY REGION (us-east-1) RESOURCES ====================

# VPC in primary region
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-primary-${var.environmentSuffix}"
  }
}

# Internet Gateway for primary VPC
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name = "igw-primary-${var.environmentSuffix}"
  }
}

# Private subnets for RDS in primary region (multi-AZ)
resource "aws_subnet" "primary_private" {
  provider = aws.primary
  count    = 2
  vpc_id   = aws_vpc.primary.id

  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "subnet-private-${count.index}-${var.environmentSuffix}"
    Type = "Private"
  }
}

# Application subnets in primary region
resource "aws_subnet" "primary_app" {
  provider = aws.primary
  count    = 2
  vpc_id   = aws_vpc.primary.id

  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-app-${count.index}-${var.environmentSuffix}"
    Type = "Application"
  }
}

# Public subnet for NAT Gateway
resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.0.100.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-public-${var.environmentSuffix}"
    Type = "Public"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "primary_nat" {
  provider = aws.primary
  domain   = "vpc"

  tags = {
    Name = "eip-nat-${var.environmentSuffix}"
  }
}

# NAT Gateway for primary region
resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  allocation_id = aws_eip.primary_nat.id
  subnet_id     = aws_subnet.primary_public.id

  tags = {
    Name = "nat-primary-${var.environmentSuffix}"
  }

  depends_on = [aws_internet_gateway.primary]
}

# Route table for public subnet
resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = {
    Name = "rt-public-${var.environmentSuffix}"
  }
}

# Route table for private subnets
resource "aws_route_table" "primary_private" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary.id
  }

  tags = {
    Name = "rt-private-${var.environmentSuffix}"
  }
}

# Route table associations
resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  subnet_id      = aws_subnet.primary_public.id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  provider = aws.primary
  count    = 2

  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

resource "aws_route_table_association" "primary_app" {
  provider = aws.primary
  count    = 2

  subnet_id      = aws_subnet.primary_app[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Get availability zones for primary region
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

# Security group for RDS in primary region
resource "aws_security_group" "primary_rds" {
  provider    = aws.primary
  name        = "rds-${var.environmentSuffix}"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description = "PostgreSQL from application subnets"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [for subnet in aws_subnet.primary_app : subnet.cidr_block]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sg-rds-${var.environmentSuffix}"
  }
}

# KMS key for RDS encryption in primary region
resource "aws_kms_key" "primary_rds" {
  provider                = aws.primary
  description             = "KMS key for RDS encryption in primary region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name = "kms-rds-primary-${var.environmentSuffix}"
  }
}

resource "aws_kms_alias" "primary_rds" {
  provider      = aws.primary
  name          = "alias/rds-primary-${var.environmentSuffix}"
  target_key_id = aws_kms_key.primary_rds.key_id
}

# RDS subnet group in primary region
resource "aws_db_subnet_group" "primary" {
  provider    = aws.primary
  name        = "subnet-group-${var.environmentSuffix}"
  subnet_ids  = aws_subnet.primary_private[*].id
  description = "Subnet group for RDS database"

  tags = {
    Name = "subnet-group-${var.environmentSuffix}"
  }
}

# RDS PostgreSQL instance in primary region
resource "aws_db_instance" "primary" {
  provider = aws.primary

  identifier = "rds-postgresql-${var.environmentSuffix}"

  engine            = "postgres"
  engine_version    = "14"
  instance_class    = "db.t3.medium"
  allocated_storage = 100
  storage_encrypted = true
  kms_key_id        = aws_kms_key.primary_rds.arn
  storage_type      = "gp3"

  db_name  = "paymentprocessing"
  username = "dbadmin"
  password = var.database_master_password

  vpc_security_group_ids = [aws_security_group.primary_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name

  backup_retention_period = 30
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  deletion_protection        = false
  skip_final_snapshot        = true
  publicly_accessible        = false
  auto_minor_version_upgrade = true

  tags = {
    Name = "rds-postgresql-${var.environmentSuffix}"
  }
}

# S3 bucket for backup metadata in primary region
resource "aws_s3_bucket" "primary_backup_metadata" {
  provider = aws.primary
  bucket   = "backup-metadata-primary-${var.environmentSuffix}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "backup-metadata-primary-${var.environmentSuffix}"
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "primary_backup_metadata" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_backup_metadata.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "primary_backup_metadata" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_backup_metadata.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "primary_backup_metadata" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_backup_metadata.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "primary_backup_metadata" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_backup_metadata.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {}
    transition {
      days          = 7
      storage_class = "GLACIER"
    }

    expiration {
      days = 30
    }
  }
}

# SNS topic for alerts in primary region
resource "aws_sns_topic" "primary_alerts" {
  provider = aws.primary
  name     = "rds-dr-alerts-primary-${var.environmentSuffix}"

  tags = {
    Name = "rds-dr-alerts-primary-${var.environmentSuffix}"
  }
}

# IAM role for Lambda function in primary region
resource "aws_iam_role" "primary_lambda" {
  provider = aws.primary
  name     = "lambda-snapshot-copier-${var.environmentSuffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "lambda-snapshot-copier-${var.environmentSuffix}"
  }
}

# IAM policy for Lambda function in primary region
resource "aws_iam_role_policy" "primary_lambda" {
  provider = aws.primary
  name     = "snapshot-copier-policy"
  role     = aws_iam_role.primary_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBSnapshots",
          "rds:CopyDBSnapshot",
          "rds:DescribeDBInstances",
          "rds:CreateDBSnapshot"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.primary_rds.arn,
          aws_kms_key.dr_rds.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.primary_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.primary_backup_metadata.arn}/*"
      }
    ]
  })
}

# Lambda function for snapshot copying in primary region
resource "aws_lambda_function" "primary_snapshot_copier" {
  provider = aws.primary

  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "snapshot-copier-${var.environmentSuffix}"
  role             = aws_iam_role.primary_lambda.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60

  environment {
    variables = {
      DESTINATION_REGION  = data.aws_region.dr.name
      DESTINATION_KMS_KEY = aws_kms_key.dr_rds.arn
      SNS_TOPIC_ARN       = aws_sns_topic.primary_alerts.arn
      S3_BUCKET_NAME      = aws_s3_bucket.primary_backup_metadata.id
      RDS_INSTANCE_ID     = aws_db_instance.primary.id
    }
  }

  tags = {
    Name = "snapshot-copier-${var.environmentSuffix}"
  }
}

# EventBridge rule to trigger Lambda on new snapshots
resource "aws_cloudwatch_event_rule" "snapshot_created" {
  provider    = aws.primary
  name        = "rds-snapshot-created-${var.environmentSuffix}"
  description = "Trigger Lambda when RDS snapshot is created"

  event_pattern = jsonencode({
    source      = ["aws.rds"]
    detail-type = ["RDS DB Snapshot Event"]
    detail = {
      EventCategories = ["creation"]
      SourceType      = ["SNAPSHOT"]
    }
  })

  tags = {
    Name = "rds-snapshot-created-${var.environmentSuffix}"
  }
}

# EventBridge target for Lambda
resource "aws_cloudwatch_event_target" "snapshot_lambda" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.snapshot_created.name
  target_id = "SnapshotLambdaTarget"
  arn       = aws_lambda_function.primary_snapshot_copier.arn
}

# Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.primary_snapshot_copier.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.snapshot_created.arn
}

# CloudWatch alarms for primary RDS
resource "aws_cloudwatch_metric_alarm" "primary_cpu" {
  provider            = aws.primary
  alarm_name          = "rds-high-cpu-${var.environmentSuffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.primary_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = {
    Name = "rds-high-cpu-${var.environmentSuffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "primary_storage" {
  provider            = aws.primary
  alarm_name          = "rds-low-storage-${var.environmentSuffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240"
  alarm_description   = "This metric monitors RDS free storage"
  alarm_actions       = [aws_sns_topic.primary_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = {
    Name = "rds-low-storage-${var.environmentSuffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "primary_connections" {
  provider            = aws.primary
  alarm_name          = "rds-high-connections-${var.environmentSuffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS connection count"
  alarm_actions       = [aws_sns_topic.primary_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = {
    Name = "rds-high-connections-${var.environmentSuffix}"
  }
}

# Route53 health check for primary database
resource "aws_route53_health_check" "primary_rds" {
  fqdn              = aws_db_instance.primary.address
  port              = 5432
  type              = "TCP"
  resource_path     = ""
  failure_threshold = "3"
  request_interval  = "30"

  tags = {
    Name = "health-check-rds-${var.environmentSuffix}"
  }
}

# CloudWatch alarm for Route53 health check
resource "aws_cloudwatch_metric_alarm" "primary_health_check" {
  provider            = aws.primary
  alarm_name          = "rds-health-check-failed-${var.environmentSuffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "This metric monitors RDS health check status"
  alarm_actions       = [aws_sns_topic.primary_alerts.arn]
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary_rds.id
  }

  tags = {
    Name = "rds-health-check-failed-${var.environmentSuffix}"
  }
}

# ==================== DR REGION (us-west-2) RESOURCES ====================

# VPC in DR region
resource "aws_vpc" "dr" {
  provider             = aws.dr
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-dr-${var.environmentSuffix}"
  }
}

# Internet Gateway for DR VPC
resource "aws_internet_gateway" "dr" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  tags = {
    Name = "igw-dr-${var.environmentSuffix}"
  }
}

# Get availability zones for DR region
data "aws_availability_zones" "dr" {
  provider = aws.dr
  state    = "available"
}

# Private subnets for RDS in DR region
resource "aws_subnet" "dr_private" {
  provider = aws.dr
  count    = 2
  vpc_id   = aws_vpc.dr.id

  cidr_block              = "10.1.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.dr.names[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "subnet-dr-private-${count.index}-${var.environmentSuffix}"
    Type = "Private"
  }
}

# Application subnets in DR region
resource "aws_subnet" "dr_app" {
  provider = aws.dr
  count    = 2
  vpc_id   = aws_vpc.dr.id

  cidr_block              = "10.1.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.dr.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-dr-app-${count.index}-${var.environmentSuffix}"
    Type = "Application"
  }
}

# Public subnet for NAT Gateway in DR
resource "aws_subnet" "dr_public" {
  provider                = aws.dr
  vpc_id                  = aws_vpc.dr.id
  cidr_block              = "10.1.100.0/24"
  availability_zone       = data.aws_availability_zones.dr.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-dr-public-${var.environmentSuffix}"
    Type = "Public"
  }
}

# Elastic IP for NAT Gateway in DR
resource "aws_eip" "dr_nat" {
  provider = aws.dr
  domain   = "vpc"

  tags = {
    Name = "eip-dr-nat-${var.environmentSuffix}"
  }
}

# NAT Gateway for DR region
resource "aws_nat_gateway" "dr" {
  provider      = aws.dr
  allocation_id = aws_eip.dr_nat.id
  subnet_id     = aws_subnet.dr_public.id

  tags = {
    Name = "nat-dr-${var.environmentSuffix}"
  }

  depends_on = [aws_internet_gateway.dr]
}

# Route table for public subnet in DR
resource "aws_route_table" "dr_public" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dr.id
  }

  tags = {
    Name = "rt-dr-public-${var.environmentSuffix}"
  }
}

# Route table for private subnets in DR
resource "aws_route_table" "dr_private" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.dr.id
  }

  tags = {
    Name = "rt-dr-private-${var.environmentSuffix}"
  }
}

# Route table associations for DR
resource "aws_route_table_association" "dr_public" {
  provider       = aws.dr
  subnet_id      = aws_subnet.dr_public.id
  route_table_id = aws_route_table.dr_public.id
}

resource "aws_route_table_association" "dr_private" {
  provider = aws.dr
  count    = 2

  subnet_id      = aws_subnet.dr_private[count.index].id
  route_table_id = aws_route_table.dr_private.id
}

resource "aws_route_table_association" "dr_app" {
  provider = aws.dr
  count    = 2

  subnet_id      = aws_subnet.dr_app[count.index].id
  route_table_id = aws_route_table.dr_public.id
}

# Security group for RDS in DR region
resource "aws_security_group" "dr_rds" {
  provider    = aws.dr
  name        = "dr-rds-${var.environmentSuffix}"
  description = "Security group for RDS database in DR region"
  vpc_id      = aws_vpc.dr.id

  ingress {
    description = "PostgreSQL from application subnets"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [for subnet in aws_subnet.dr_app : subnet.cidr_block]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sg-dr-rds-${var.environmentSuffix}"
  }
}

# KMS key for RDS encryption in DR region
resource "aws_kms_key" "dr_rds" {
  provider                = aws.dr
  description             = "KMS key for RDS encryption in DR region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name = "kms-rds-dr-${var.environmentSuffix}"
  }
}

resource "aws_kms_alias" "dr_rds" {
  provider      = aws.dr
  name          = "alias/rds-dr-${var.environmentSuffix}"
  target_key_id = aws_kms_key.dr_rds.key_id
}

# RDS subnet group in DR region
resource "aws_db_subnet_group" "dr" {
  provider    = aws.dr
  name        = "subnet-group-dr-${var.environmentSuffix}"
  subnet_ids  = aws_subnet.dr_private[*].id
  description = "Subnet group for RDS database in DR region"

  tags = {
    Name = "subnet-group-dr-${var.environmentSuffix}"
  }
}

# S3 bucket for backup metadata in DR region
resource "aws_s3_bucket" "dr_backup_metadata" {
  provider = aws.dr
  bucket   = "backup-metadata-dr-${var.environmentSuffix}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "backup-metadata-dr-${var.environmentSuffix}"
  }
}

# S3 bucket versioning for DR
resource "aws_s3_bucket_versioning" "dr_backup_metadata" {
  provider = aws.dr
  bucket   = aws_s3_bucket.dr_backup_metadata.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption for DR
resource "aws_s3_bucket_server_side_encryption_configuration" "dr_backup_metadata" {
  provider = aws.dr
  bucket   = aws_s3_bucket.dr_backup_metadata.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket public access block for DR
resource "aws_s3_bucket_public_access_block" "dr_backup_metadata" {
  provider = aws.dr
  bucket   = aws_s3_bucket.dr_backup_metadata.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket lifecycle configuration for DR
resource "aws_s3_bucket_lifecycle_configuration" "dr_backup_metadata" {
  provider = aws.dr
  bucket   = aws_s3_bucket.dr_backup_metadata.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"
    filter {}

    transition {
      days          = 7
      storage_class = "GLACIER"
    }

    expiration {
      days = 30
    }
  }
}

# S3 bucket replication role
resource "aws_iam_role" "replication" {
  provider = aws.primary
  name     = "s3-replication-role-${var.environmentSuffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "s3-replication-role-${var.environmentSuffix}"
  }
}

# S3 bucket replication policy
resource "aws_iam_role_policy" "replication" {
  provider = aws.primary
  name     = "s3-replication-policy"
  role     = aws_iam_role.replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = aws_s3_bucket.primary_backup_metadata.arn
      },
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.primary_backup_metadata.arn}/*"
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.dr_backup_metadata.arn}/*"
      }
    ]
  })
}

# S3 bucket replication configuration
resource "aws_s3_bucket_replication_configuration" "primary_to_dr" {
  provider = aws.primary
  role     = aws_iam_role.replication.arn
  bucket   = aws_s3_bucket.primary_backup_metadata.id

  rule {
    id     = "replicate-to-dr"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.dr_backup_metadata.arn
      storage_class = "STANDARD"
    }
  }

  depends_on = [aws_s3_bucket_versioning.primary_backup_metadata]
}

# SNS topic for alerts in DR region
resource "aws_sns_topic" "dr_alerts" {
  provider = aws.dr
  name     = "rds-dr-alerts-dr-${var.environmentSuffix}"

  tags = {
    Name = "rds-dr-alerts-dr-${var.environmentSuffix}"
  }
}

# IAM role for Lambda function in DR region
resource "aws_iam_role" "dr_lambda" {
  provider = aws.dr
  name     = "lambda-snapshot-validator-${var.environmentSuffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "lambda-snapshot-validator-${var.environmentSuffix}"
  }
}

# IAM policy for Lambda function in DR region
resource "aws_iam_role_policy" "dr_lambda" {
  provider = aws.dr
  name     = "snapshot-validator-policy"
  role     = aws_iam_role.dr_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBSnapshots",
          "rds:DescribeDBInstances"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.dr_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.dr_backup_metadata.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda function for snapshot validation in DR region
resource "aws_lambda_function" "dr_snapshot_validator" {
  provider = aws.dr

  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "snapshot-validator-${var.environmentSuffix}"
  role             = aws_iam_role.dr_lambda.arn
  handler          = "lambda_function.validate_snapshot_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60

  environment {
    variables = {
      SNS_TOPIC_ARN  = aws_sns_topic.dr_alerts.arn
      S3_BUCKET_NAME = aws_s3_bucket.dr_backup_metadata.id
      SOURCE_REGION  = data.aws_region.primary.name
    }
  }

  tags = {
    Name = "snapshot-validator-${var.environmentSuffix}"
  }
}

# EventBridge rule to validate snapshots hourly in DR region
resource "aws_cloudwatch_event_rule" "validate_snapshots" {
  provider            = aws.dr
  name                = "validate-snapshots-${var.environmentSuffix}"
  description         = "Validate snapshot freshness hourly"
  schedule_expression = "rate(1 hour)"

  tags = {
    Name = "validate-snapshots-${var.environmentSuffix}"
  }
}

# EventBridge target for validation Lambda
resource "aws_cloudwatch_event_target" "validate_lambda" {
  provider  = aws.dr
  rule      = aws_cloudwatch_event_rule.validate_snapshots.name
  target_id = "ValidateLambdaTarget"
  arn       = aws_lambda_function.dr_snapshot_validator.arn
}

# Lambda permission for EventBridge in DR region
resource "aws_lambda_permission" "allow_eventbridge_dr" {
  provider      = aws.dr
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.dr_snapshot_validator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.validate_snapshots.arn
}

# CloudWatch alarm for snapshot freshness in DR region
resource "aws_cloudwatch_metric_alarm" "snapshot_freshness" {
  provider            = aws.dr
  alarm_name          = "snapshot-staleness-${var.environmentSuffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "SnapshotAge"
  namespace           = "CustomDR"
  period              = "3600"
  statistic           = "Maximum"
  threshold           = "7200"
  alarm_description   = "Alert when snapshot is older than 2 hours"
  alarm_actions       = [aws_sns_topic.dr_alerts.arn]
  treat_missing_data  = "breaching"

  tags = {
    Name = "snapshot-staleness-${var.environmentSuffix}"
  }
}

# Package Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/lambda_function.zip"
}

# ==================== COMPREHENSIVE OUTPUTS FOR INTEGRATION TESTING ====================

# Primary RDS Details
output "rds_details" {
  value = {
    instance_id  = aws_db_instance.primary.id
    instance_arn = aws_db_instance.primary.arn
    endpoint     = aws_db_instance.primary.endpoint
    address      = aws_db_instance.primary.address
    port         = aws_db_instance.primary.port
  }
  description = "Primary RDS instance details for testing"
  sensitive   = true
}

# CloudWatch Alarms
output "alarm_names" {
  value = {
    cpu                = aws_cloudwatch_metric_alarm.primary_cpu.alarm_name
    storage            = aws_cloudwatch_metric_alarm.primary_storage.alarm_name
    connections        = aws_cloudwatch_metric_alarm.primary_connections.alarm_name
    health_check       = aws_cloudwatch_metric_alarm.primary_health_check.alarm_name
    snapshot_freshness = aws_cloudwatch_metric_alarm.snapshot_freshness.alarm_name
  }
  description = "All CloudWatch alarm names for testing"
}

output "alarm_arns" {
  value = {
    cpu                = aws_cloudwatch_metric_alarm.primary_cpu.arn
    storage            = aws_cloudwatch_metric_alarm.primary_storage.arn
    connections        = aws_cloudwatch_metric_alarm.primary_connections.arn
    health_check       = aws_cloudwatch_metric_alarm.primary_health_check.arn
    snapshot_freshness = aws_cloudwatch_metric_alarm.snapshot_freshness.arn
  }
  description = "All CloudWatch alarm ARNs for testing"
}

# Security Groups
output "security_group_ids" {
  value = {
    primary_rds = aws_security_group.primary_rds.id
    dr_rds      = aws_security_group.dr_rds.id
  }
  description = "Security group IDs for RDS instances"
}

output "security_group_arns" {
  value = {
    primary_rds = aws_security_group.primary_rds.arn
    dr_rds      = aws_security_group.dr_rds.arn
  }
  description = "Security group ARNs for RDS instances"
}

# Subnets
output "subnet_ids" {
  value = {
    primary_private = aws_subnet.primary_private[*].id
    primary_app     = aws_subnet.primary_app[*].id
    primary_public  = aws_subnet.primary_public.id
    dr_private      = aws_subnet.dr_private[*].id
    dr_app          = aws_subnet.dr_app[*].id
    dr_public       = aws_subnet.dr_public.id
  }
  description = "All subnet IDs by type and region"
}

# EventBridge Rules
output "eventbridge_rules" {
  value = {
    snapshot_created       = aws_cloudwatch_event_rule.snapshot_created.name
    snapshot_created_arn   = aws_cloudwatch_event_rule.snapshot_created.arn
    validate_snapshots     = aws_cloudwatch_event_rule.validate_snapshots.name
    validate_snapshots_arn = aws_cloudwatch_event_rule.validate_snapshots.arn
  }
  description = "EventBridge rule names and ARNs"
}

# IAM Roles
output "iam_role_arns" {
  value = {
    primary_lambda = aws_iam_role.primary_lambda.arn
    dr_lambda      = aws_iam_role.dr_lambda.arn
    replication    = aws_iam_role.replication.arn
  }
  description = "All IAM role ARNs"
}

output "iam_role_names" {
  value = {
    primary_lambda = aws_iam_role.primary_lambda.name
    dr_lambda      = aws_iam_role.dr_lambda.name
    replication    = aws_iam_role.replication.name
  }
  description = "All IAM role names"
}

# Lambda Functions
output "lambda_functions" {
  value = {
    primary_name = aws_lambda_function.primary_snapshot_copier.function_name
    primary_arn  = aws_lambda_function.primary_snapshot_copier.arn
    dr_name      = aws_lambda_function.dr_snapshot_validator.function_name
    dr_arn       = aws_lambda_function.dr_snapshot_validator.arn
  }
  description = "Lambda function names and ARNs"
}

output "lambda_log_groups" {
  value = {
    primary = "/aws/lambda/${aws_lambda_function.primary_snapshot_copier.function_name}"
    dr      = "/aws/lambda/${aws_lambda_function.dr_snapshot_validator.function_name}"
  }
  description = "CloudWatch log group names for Lambda functions"
}

# S3 Buckets
output "s3_buckets" {
  value = {
    primary_name = aws_s3_bucket.primary_backup_metadata.id
    primary_arn  = aws_s3_bucket.primary_backup_metadata.arn
    dr_name      = aws_s3_bucket.dr_backup_metadata.id
    dr_arn       = aws_s3_bucket.dr_backup_metadata.arn
  }
  description = "S3 bucket names and ARNs"
}

# KMS Keys
output "kms_keys" {
  value = {
    primary_id  = aws_kms_key.primary_rds.id
    primary_arn = aws_kms_key.primary_rds.arn
    dr_id       = aws_kms_key.dr_rds.id
    dr_arn      = aws_kms_key.dr_rds.arn
  }
  description = "KMS key IDs and ARNs"
}

# SNS Topics
output "sns_topics" {
  value = {
    primary_arn  = aws_sns_topic.primary_alerts.arn
    primary_name = aws_sns_topic.primary_alerts.name
    dr_arn       = aws_sns_topic.dr_alerts.arn
    dr_name      = aws_sns_topic.dr_alerts.name
  }
  description = "SNS topic ARNs and names"
}

# VPCs and Networking
output "network_details" {
  value = {
    primary_vpc_id   = aws_vpc.primary.id
    primary_vpc_cidr = aws_vpc.primary.cidr_block
    dr_vpc_id        = aws_vpc.dr.id
    dr_vpc_cidr      = aws_vpc.dr.cidr_block
    primary_nat_id   = aws_nat_gateway.primary.id
    dr_nat_id        = aws_nat_gateway.dr.id
    primary_igw_id   = aws_internet_gateway.primary.id
    dr_igw_id        = aws_internet_gateway.dr.id
  }
  description = "Network infrastructure details"
}

# Route Tables
output "route_tables" {
  value = {
    primary_public  = aws_route_table.primary_public.id
    primary_private = aws_route_table.primary_private.id
    dr_public       = aws_route_table.dr_public.id
    dr_private      = aws_route_table.dr_private.id
  }
  description = "Route table IDs"
}

# DB Subnet Groups
output "db_subnet_groups" {
  value = {
    primary_name = aws_db_subnet_group.primary.name
    primary_arn  = aws_db_subnet_group.primary.arn
    dr_name      = aws_db_subnet_group.dr.name
    dr_arn       = aws_db_subnet_group.dr.arn
  }
  description = "Database subnet group details"
}

# Environment Configuration
output "environment_config" {
  value = {
    environment    = var.environmentSuffix
    primary_region = data.aws_region.primary.name
    dr_region      = data.aws_region.dr.name
    account_id     = data.aws_caller_identity.current.account_id
  }
  description = "Environment and deployment configuration"
}

# Route53 Health Checks
output "route53_health_checks" {
  value = {
    primary_rds_id  = aws_route53_health_check.primary_rds.id
    primary_rds_arn = aws_route53_health_check.primary_rds.arn
  }
  description = "Route53 health check details"
}
