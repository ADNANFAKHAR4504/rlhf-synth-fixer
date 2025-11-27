## tap_stack.tf
```hcl
# tap_stack.tf - High-Availability PostgreSQL Database Infrastructure

# ================================
# DATA SOURCES
# ================================

data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# ================================
# LOCALS
# ================================

locals {
  name_prefix = "ha-postgres-${var.environment_suffix}"

  common_tags = {
    Environment = var.environment_suffix
    Repository  = var.repository
    Author      = var.commit_author
    PRNumber    = var.pr_number
    Team        = var.team
    Project     = "HA-PostgreSQL-Database"
    ManagedBy   = "Terraform"
  }

  # Select 3 AZs for multi-AZ deployment
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
}

# ================================
# VPC AND NETWORKING
# ================================

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Private Subnets for RDS across 3 AZs
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Public Subnets for NAT Gateway and Lambda
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# NAT Gateway for private subnet internet access
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ================================
# SECURITY GROUPS
# ================================

# Security Group for RDS Aurora Cluster
resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for Aurora PostgreSQL cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from Lambda"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
  })
}

# Security Group for Lambda Functions
resource "aws_security_group" "lambda" {
  name        = "${local.name_prefix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-sg"
  })
}

# ================================
# SECRETS MANAGER
# ================================

# Generate random password for RDS master user
resource "random_password" "master_password" {
  length  = 32
  special = true
  # Aurora PostgreSQL password requirements
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${local.name_prefix}-db-credentials"
  description             = "Aurora PostgreSQL master credentials"
  recovery_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-credentials"
  })
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "postgres"
    password = random_password.master_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
    dbname   = "financialdb"
  })
}

# Secret rotation configuration
resource "aws_secretsmanager_secret_rotation" "db_credentials" {
  secret_id           = aws_secretsmanager_secret.db_credentials.id
  rotation_lambda_arn = aws_lambda_function.secret_rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }

  depends_on = [aws_lambda_permission.secrets_manager]
}

# ================================
# RDS AURORA POSTGRESQL CLUSTER
# ================================

# DB Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier     = "${local.name_prefix}-aurora-cluster"
  engine                 = "aurora-postgresql"
  engine_version         = "15.6"
  engine_mode            = "provisioned"
  database_name          = "financialdb"
  master_username        = "postgres"
  master_password        = random_password.master_password.result
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Serverless v2 scaling configuration
  serverlessv2_scaling_configuration {
    max_capacity = 16.0
    min_capacity = 0.5
  }

  # Backup configuration
  backup_retention_period      = 7
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"

  # Encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  # Enhanced monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # High availability
  availability_zones = local.azs

  # Deletion protection
  deletion_protection = false
  skip_final_snapshot = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-cluster"
  })

  depends_on = [aws_cloudwatch_log_group.rds_postgresql]
}

# Aurora Cluster Instances (3 instances across 3 AZs)
resource "aws_rds_cluster_instance" "aurora_instances" {
  count              = 3
  identifier         = "${local.name_prefix}-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  # Performance Insights
  performance_insights_enabled          = true
  performance_insights_kms_key_id       = aws_kms_key.rds.arn
  performance_insights_retention_period = 7

  # Enhanced Monitoring
  monitoring_interval = 1
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Availability zone
  availability_zone = local.azs[count.index]

  # Auto minor version upgrade
  auto_minor_version_upgrade = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-instance-${count.index + 1}"
    Tier = count.index == 0 ? "primary" : "replica"
  })
}

# ================================
# KMS KEY FOR ENCRYPTION
# ================================

resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS Aurora encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-kms-key"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.name_prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# ================================
# ROUTE53 HEALTH CHECKS
# ================================

# Route53 Private Hosted Zone
resource "aws_route53_zone" "private" {
  name = "db.internal"

  vpc {
    vpc_id = aws_vpc.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-zone"
  })
}

# Route53 Record for primary endpoint
resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "primary.db.internal"
  type    = "CNAME"
  ttl     = 60
  records = [aws_rds_cluster.aurora.endpoint]
}

# Route53 Record for read-only endpoint
resource "aws_route53_record" "reader" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "reader.db.internal"
  type    = "CNAME"
  ttl     = 60
  records = [aws_rds_cluster.aurora.reader_endpoint]
}

# CloudWatch Metric for custom health check
resource "aws_cloudwatch_metric_alarm" "database_health" {
  alarm_name          = "${local.name_prefix}-database-health"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Database connection health check"
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = local.common_tags
}

# ================================
# SNS TOPICS FOR ALERTING
# ================================

resource "aws_sns_topic" "alerts" {
  name              = "${local.name_prefix}-alerts"
  display_name      = "HA PostgreSQL Database Alerts"
  kms_master_key_id = aws_kms_key.sns.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alerts"
  })
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "ops-team@example.com"
}

# SNS KMS Key
resource "aws_kms_key" "sns" {
  description             = "KMS key for SNS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sns-kms-key"
  })
}

# ================================
# EVENTBRIDGE RULES
# ================================

# EventBridge rule for RDS failover events
resource "aws_cloudwatch_event_rule" "rds_failover" {
  name        = "${local.name_prefix}-rds-failover"
  description = "Capture RDS failover events"

  event_pattern = jsonencode({
    source      = ["aws.rds"]
    detail-type = ["RDS DB Cluster Event"]
    detail = {
      EventCategories = ["failover"]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "failover_lambda" {
  rule      = aws_cloudwatch_event_rule.rds_failover.name
  target_id = "FailoverCoordinator"
  arn       = aws_lambda_function.failover_coordinator.arn
}

# EventBridge rule for health check failures
resource "aws_cloudwatch_event_rule" "health_check_failure" {
  name        = "${local.name_prefix}-health-check-failure"
  description = "Capture health check failure events"

  event_pattern = jsonencode({
    source      = ["aws.cloudwatch"]
    detail-type = ["CloudWatch Alarm State Change"]
    detail = {
      alarmName = [aws_cloudwatch_metric_alarm.database_health.alarm_name]
      state = {
        value = ["ALARM"]
      }
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "health_failure_lambda" {
  rule      = aws_cloudwatch_event_rule.health_check_failure.name
  target_id = "HealthCheckHandler"
  arn       = aws_lambda_function.failover_coordinator.arn
}

# ================================
# IAM ROLES
# ================================

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${local.name_prefix}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Lambda IAM Policy
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${local.name_prefix}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogsAccess"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-*"
      },
      {
        Sid    = "RDSDataAPIAccess"
        Effect = "Allow"
        Action = [
          "rds-data:BatchExecuteStatement",
          "rds-data:BeginTransaction",
          "rds-data:CommitTransaction",
          "rds-data:ExecuteStatement",
          "rds-data:RollbackTransaction"
        ]
        Resource = aws_rds_cluster.aurora.arn
      },
      {
        Sid    = "SecretsManagerAccess"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn
        ]
      },
      {
        Sid    = "SNSPublishAccess"
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Sid    = "VPCAccess"
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Sid    = "RDSManagement"
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances",
          "rds:FailoverDBCluster",
          "rds:ModifyDBCluster"
        ]
        Resource = "*"
      }
    ]
  })
}

# ================================
# LAMBDA FUNCTIONS
# ================================

# Lambda Layer for database libraries
resource "aws_lambda_layer_version" "db_layer" {
  filename            = "${path.module}/lambda/layers/db-layer.zip"
  layer_name          = "${local.name_prefix}-db-layer"
  compatible_runtimes = ["python3.11"]
  description         = "PostgreSQL client libraries"

  lifecycle {
    ignore_changes = [filename]
  }
}

# Failover Coordinator Lambda
resource "aws_lambda_function" "failover_coordinator" {
  filename      = "${path.module}/lambda/failover-coordinator/function.zip"
  function_name = "${local.name_prefix}-failover-coordinator"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 300
  memory_size   = 512

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      CLUSTER_IDENTIFIER = aws_rds_cluster.aurora.cluster_identifier
      SNS_TOPIC_ARN      = aws_sns_topic.alerts.arn
      SECRET_ARN         = aws_secretsmanager_secret.db_credentials.arn
      DB_ENDPOINT        = aws_rds_cluster.aurora.endpoint
    }
  }

  layers = [aws_lambda_layer_version.db_layer.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-failover-coordinator"
  })

  lifecycle {
    ignore_changes = [filename]
  }
}

# Connection Draining Lambda
resource "aws_lambda_function" "connection_drainer" {
  filename      = "${path.module}/lambda/connection-drainer/function.zip"
  function_name = "${local.name_prefix}-connection-drainer"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 60
  memory_size   = 256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_ENDPOINT = aws_rds_cluster.aurora.endpoint
      SECRET_ARN  = aws_secretsmanager_secret.db_credentials.arn
    }
  }

  layers = [aws_lambda_layer_version.db_layer.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-connection-drainer"
  })

  lifecycle {
    ignore_changes = [filename]
  }
}

# Health Check Lambda
resource "aws_lambda_function" "health_checker" {
  filename      = "${path.module}/lambda/health-checker/function.zip"
  function_name = "${local.name_prefix}-health-checker"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = 256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_ENDPOINT      = aws_rds_cluster.aurora.endpoint
      READER_ENDPOINT  = aws_rds_cluster.aurora.reader_endpoint
      SECRET_ARN       = aws_secretsmanager_secret.db_credentials.arn
      HEALTH_CHECK_SQL = "SELECT 1"
      SNS_TOPIC_ARN    = aws_sns_topic.alerts.arn
    }
  }

  layers = [aws_lambda_layer_version.db_layer.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-health-checker"
  })

  lifecycle {
    ignore_changes = [filename]
  }
}

# Secret Rotation Lambda
resource "aws_lambda_function" "secret_rotation" {
  filename      = "${path.module}/lambda/secret-rotation/function.zip"
  function_name = "${local.name_prefix}-secret-rotation"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 300
  memory_size   = 512

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      CLUSTER_ARN = aws_rds_cluster.aurora.arn
    }
  }

  layers = [aws_lambda_layer_version.db_layer.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secret-rotation"
  })

  lifecycle {
    ignore_changes = [filename]
  }
}

# Backup Verification Lambda
resource "aws_lambda_function" "backup_verifier" {
  filename      = "${path.module}/lambda/backup-verifier/function.zip"
  function_name = "${local.name_prefix}-backup-verifier"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 900
  memory_size   = 1024

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      CLUSTER_IDENTIFIER = aws_rds_cluster.aurora.cluster_identifier
      SNS_TOPIC_ARN      = aws_sns_topic.alerts.arn
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backup-verifier"
  })

  lifecycle {
    ignore_changes = [filename]
  }
}

# ================================
# LAMBDA PERMISSIONS
# ================================

resource "aws_lambda_permission" "eventbridge_failover" {
  statement_id  = "AllowExecutionFromEventBridgeFailover"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover_coordinator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.rds_failover.arn
}

resource "aws_lambda_permission" "eventbridge_health" {
  statement_id  = "AllowExecutionFromEventBridgeHealth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover_coordinator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.health_check_failure.arn
}

resource "aws_lambda_permission" "secrets_manager" {
  statement_id  = "AllowExecutionFromSecretsManager"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secret_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}

resource "aws_lambda_permission" "eventbridge_scheduler" {
  statement_id  = "AllowExecutionFromEventBridgeScheduler"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health_checker.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.health_check_schedule.arn
}

resource "aws_lambda_permission" "backup_scheduler" {
  statement_id  = "AllowExecutionFromBackupScheduler"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backup_verifier.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.backup_verification_schedule.arn
}

# ================================
# EVENTBRIDGE SCHEDULED RULES
# ================================

# Health check every 1 minute (minimum supported rate)
resource "aws_cloudwatch_event_rule" "health_check_schedule" {
  name                = "${local.name_prefix}-health-check-schedule"
  description         = "Trigger health check every 1 minute"
  schedule_expression = "rate(1 minute)"

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "health_check_schedule" {
  rule      = aws_cloudwatch_event_rule.health_check_schedule.name
  target_id = "HealthChecker"
  arn       = aws_lambda_function.health_checker.arn
}

# Daily backup verification
resource "aws_cloudwatch_event_rule" "backup_verification_schedule" {
  name                = "${local.name_prefix}-backup-verification"
  description         = "Daily backup verification"
  schedule_expression = "cron(0 6 * * ? *)"

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "backup_verification_schedule" {
  rule      = aws_cloudwatch_event_rule.backup_verification_schedule.name
  target_id = "BackupVerifier"
  arn       = aws_lambda_function.backup_verifier.arn
}

# ================================
# CLOUDWATCH LOG GROUPS
# ================================

resource "aws_cloudwatch_log_group" "rds_postgresql" {
  name              = "/aws/rds/cluster/${local.name_prefix}-aurora-cluster/postgresql"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-logs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_failover" {
  name              = "/aws/lambda/${local.name_prefix}-failover-coordinator"
  retention_in_days = 7

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_drainer" {
  name              = "/aws/lambda/${local.name_prefix}-connection-drainer"
  retention_in_days = 7

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_health" {
  name              = "/aws/lambda/${local.name_prefix}-health-checker"
  retention_in_days = 7

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_rotation" {
  name              = "/aws/lambda/${local.name_prefix}-secret-rotation"
  retention_in_days = 7

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_backup" {
  name              = "/aws/lambda/${local.name_prefix}-backup-verifier"
  retention_in_days = 7

  tags = local.common_tags
}

# ================================
# CLOUDWATCH DASHBOARD
# ================================

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", label = "Active Connections" }],
            [".", "CPUUtilization", { stat = "Average", label = "CPU %" }],
            [".", "FreeableMemory", { stat = "Average", label = "Free Memory" }],
            [".", "ReadLatency", { stat = "Average", label = "Read Latency (ms)" }],
            [".", "WriteLatency", { stat = "Average", label = "Write Latency (ms)" }],
          ]
          period = 60
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "RDS Performance Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "AuroraReplicaLag", { stat = "Maximum", label = "Replica Lag (ms)" }],
            [".", "AuroraReplicaLagMaximum", { stat = "Maximum", label = "Max Replica Lag (ms)" }],
            [".", "AuroraReplicaLagMinimum", { stat = "Minimum", label = "Min Replica Lag (ms)" }],
          ]
          period = 60
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "Replication Lag"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CommitThroughput", { stat = "Sum", label = "Commits/sec" }],
            [".", "SelectThroughput", { stat = "Sum", label = "Selects/sec" }],
            [".", "InsertThroughput", { stat = "Sum", label = "Inserts/sec" }],
            [".", "UpdateThroughput", { stat = "Sum", label = "Updates/sec" }],
            [".", "DeleteThroughput", { stat = "Sum", label = "Deletes/sec" }],
          ]
          period = 60
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "Database Throughput (RPS)"
        }
      }
    ]
  })
}

# ================================
# CLOUDWATCH ALARMS
# ================================

# CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${local.name_prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = local.common_tags
}

# Replica Lag Alarm
resource "aws_cloudwatch_metric_alarm" "replica_lag" {
  alarm_name          = "${local.name_prefix}-replica-lag-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuroraReplicaLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1000
  alarm_description   = "Replica lag is too high (>1 second)"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = local.common_tags
}

# Connection Count Alarm
resource "aws_cloudwatch_metric_alarm" "connections_high" {
  alarm_name          = "${local.name_prefix}-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Database connections are too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = local.common_tags
}

# Lambda Error Alarms
resource "aws_cloudwatch_metric_alarm" "lambda_failover_errors" {
  alarm_name          = "${local.name_prefix}-failover-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Failover coordinator Lambda errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.failover_coordinator.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_health_errors" {
  alarm_name          = "${local.name_prefix}-health-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Health checker Lambda errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.health_checker.function_name
  }

  tags = local.common_tags
}

# ================================
# AWS FIS EXPERIMENT TEMPLATE
# ================================

# IAM Role for FIS
resource "aws_iam_role" "fis" {
  name = "${local.name_prefix}-fis-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "fis.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "fis" {
  name = "${local.name_prefix}-fis-policy"
  role = aws_iam_role.fis.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RDSFailoverAccess"
        Effect = "Allow"
        Action = [
          "rds:FailoverDBCluster",
          "rds:RebootDBInstance"
        ]
        Resource = "*"
      }
    ]
  })
}

# FIS Experiment Template for Aurora Failover
resource "aws_fis_experiment_template" "aurora_failover" {
  description = "Test Aurora cluster failover"
  role_arn    = aws_iam_role.fis.arn

  stop_condition {
    source = "none"
  }

  action {
    name      = "failover-aurora-cluster"
    action_id = "aws:rds:failover-db-cluster"

    target {
      key   = "Clusters"
      value = "aurora-cluster-target"
    }
  }

  target {
    name           = "aurora-cluster-target"
    resource_type  = "aws:rds:cluster"
    selection_mode = "ALL"

    resource_arns = [
      aws_rds_cluster.aurora.arn
    ]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-failover-experiment"
  })
}

# Note: FIS experiments must be triggered manually or via AWS CLI/SDK
# EventBridge does not support FIS as a direct target
# To automate FIS testing, use a Lambda function triggered by EventBridge that calls StartExperiment API

```

## provider.tf
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

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}

```

## outputs.tf
```hcl
# outputs.tf

# ================================
# VPC OUTPUTS
# ================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

# ================================
# RDS AURORA OUTPUTS
# ================================

output "aurora_cluster_id" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.aurora.cluster_identifier
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint (write)"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint (read-only)"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "aurora_cluster_arn" {
  description = "ARN of the Aurora cluster"
  value       = aws_rds_cluster.aurora.arn
}

output "aurora_cluster_port" {
  description = "Port of the Aurora cluster"
  value       = aws_rds_cluster.aurora.port
}

output "aurora_database_name" {
  description = "Name of the default database"
  value       = aws_rds_cluster.aurora.database_name
}

output "aurora_master_username" {
  description = "Master username for the Aurora cluster"
  value       = aws_rds_cluster.aurora.master_username
  sensitive   = true
}

output "aurora_instance_ids" {
  description = "IDs of the Aurora cluster instances"
  value       = aws_rds_cluster_instance.aurora_instances[*].id
}

output "aurora_instance_endpoints" {
  description = "Endpoints of the Aurora cluster instances"
  value       = aws_rds_cluster_instance.aurora_instances[*].endpoint
}

# ================================
# ROUTE53 OUTPUTS
# ================================

output "route53_zone_id" {
  description = "ID of the Route53 private hosted zone"
  value       = aws_route53_zone.private.zone_id
}

output "route53_primary_endpoint" {
  description = "Route53 DNS name for primary database endpoint"
  value       = aws_route53_record.primary.fqdn
}

output "route53_reader_endpoint" {
  description = "Route53 DNS name for reader database endpoint"
  value       = aws_route53_record.reader.fqdn
}

# ================================
# SECRETS MANAGER OUTPUTS
# ================================

output "db_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "db_credentials_secret_name" {
  description = "Name of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.name
}

# ================================
# SNS OUTPUTS
# ================================

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "sns_alerts_topic_name" {
  description = "Name of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.name
}

# ================================
# LAMBDA OUTPUTS
# ================================

output "lambda_failover_coordinator_arn" {
  description = "ARN of the failover coordinator Lambda function"
  value       = aws_lambda_function.failover_coordinator.arn
}

output "lambda_health_checker_arn" {
  description = "ARN of the health checker Lambda function"
  value       = aws_lambda_function.health_checker.arn
}

output "lambda_connection_drainer_arn" {
  description = "ARN of the connection drainer Lambda function"
  value       = aws_lambda_function.connection_drainer.arn
}

output "lambda_secret_rotation_arn" {
  description = "ARN of the secret rotation Lambda function"
  value       = aws_lambda_function.secret_rotation.arn
}

output "lambda_backup_verifier_arn" {
  description = "ARN of the backup verifier Lambda function"
  value       = aws_lambda_function.backup_verifier.arn
}

# ================================
# CLOUDWATCH OUTPUTS
# ================================

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "cloudwatch_log_group_rds" {
  description = "Name of the CloudWatch log group for RDS"
  value       = aws_cloudwatch_log_group.rds_postgresql.name
}

# ================================
# SECURITY GROUP OUTPUTS
# ================================

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "lambda_security_group_id" {
  description = "ID of the Lambda security group"
  value       = aws_security_group.lambda.id
}

# ================================
# KMS OUTPUTS
# ================================

output "kms_rds_key_id" {
  description = "ID of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.id
}

output "kms_rds_key_arn" {
  description = "ARN of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.arn
}

output "kms_sns_key_id" {
  description = "ID of the KMS key for SNS encryption"
  value       = aws_kms_key.sns.id
}

# ================================
# FIS OUTPUTS
# ================================

output "fis_experiment_template_id" {
  description = "ID of the FIS experiment template for failover testing"
  value       = aws_fis_experiment_template.aurora_failover.id
}

# ================================
# CONNECTION INFORMATION
# ================================

output "database_connection_info" {
  description = "Database connection information"
  value = {
    endpoint        = aws_rds_cluster.aurora.endpoint
    reader_endpoint = aws_rds_cluster.aurora.reader_endpoint
    port            = aws_rds_cluster.aurora.port
    database        = aws_rds_cluster.aurora.database_name
    secret_arn      = aws_secretsmanager_secret.db_credentials.arn
  }
}

output "monitoring_endpoints" {
  description = "Monitoring and observability endpoints"
  value = {
    dashboard_name   = aws_cloudwatch_dashboard.main.dashboard_name
    sns_topic_arn    = aws_sns_topic.alerts.arn
    log_group_rds    = aws_cloudwatch_log_group.rds_postgresql.name
    log_group_lambda = aws_cloudwatch_log_group.lambda_failover.name
  }
}

```

## variables.tf
```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}
```

