# Store on-premises database credentials in Parameter Store
resource "aws_ssm_parameter" "onprem_db_username" {
  name        = "/payment-migration/${var.environment_suffix}/onprem/db-username"
  description = "On-premises database username for DMS"
  type        = "String"
  value       = var.onprem_db_username

  tags = merge(
    local.common_tags,
    {
      Name = "onprem-db-username-${var.environment_suffix}"
    }
  )
}

resource "aws_ssm_parameter" "onprem_db_password" {
  name        = "/payment-migration/${var.environment_suffix}/onprem/db-password"
  description = "On-premises database password for DMS"
  type        = "SecureString"
  value       = var.onprem_db_password

  tags = merge(
    local.common_tags,
    {
      Name = "onprem-db-password-${var.environment_suffix}"
    }
  )
}

# DMS Subnet Group
resource "aws_dms_replication_subnet_group" "main" {
  replication_subnet_group_id          = "dms-subnet-group-${var.environment_suffix}"
  replication_subnet_group_description = "DMS replication subnet group for payment migration"
  subnet_ids                           = aws_subnet.private_app[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "dms-subnet-group-${var.environment_suffix}"
    }
  )
}

# IAM Role for DMS
resource "aws_iam_role" "dms_vpc" {
  name = "dms-vpc-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dms.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "dms-vpc-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "dms_vpc" {
  role       = aws_iam_role.dms_vpc.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole"
}

resource "aws_iam_role" "dms_cloudwatch" {
  name = "dms-cloudwatch-logs-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dms.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "dms-cloudwatch-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "dms_cloudwatch" {
  role       = aws_iam_role.dms_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonDMSCloudWatchLogsRole"
}

# DMS Replication Instance
resource "aws_dms_replication_instance" "main" {
  replication_instance_id     = "dms-replication-${var.environment_suffix}"
  replication_instance_class  = "dms.t3.medium"
  allocated_storage           = 100
  engine_version              = "3.5.1"
  multi_az                    = true
  publicly_accessible         = false
  replication_subnet_group_id = aws_dms_replication_subnet_group.main.id
  vpc_security_group_ids      = [aws_security_group.dms.id]
  auto_minor_version_upgrade  = false

  tags = merge(
    local.common_tags,
    {
      Name = "dms-replication-${var.environment_suffix}"
    }
  )

  depends_on = [
    aws_iam_role_policy_attachment.dms_vpc,
    aws_iam_role_policy_attachment.dms_cloudwatch
  ]
}

# DMS Source Endpoint (On-premises)
resource "aws_dms_endpoint" "source" {
  endpoint_id                 = "source-onprem-${var.environment_suffix}"
  endpoint_type               = "source"
  engine_name                 = "mysql"
  server_name                 = var.onprem_db_endpoint
  port                        = 3306
  username                    = var.onprem_db_username
  password                    = var.onprem_db_password
  database_name               = "paymentdb"
  ssl_mode                    = "require"
  extra_connection_attributes = "parallelLoadThreads=4;initstmt=SET FOREIGN_KEY_CHECKS=0"

  tags = merge(
    local.common_tags,
    {
      Name = "dms-source-onprem-${var.environment_suffix}"
    }
  )
}

# DMS Target Endpoint (Aurora)
resource "aws_dms_endpoint" "target" {
  endpoint_id   = "target-aurora-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "aurora"
  server_name   = aws_rds_cluster.payment.endpoint
  port          = 3306
  username      = var.db_master_username
  password      = var.db_master_password
  database_name = "paymentdb"
  ssl_mode      = "require"

  tags = merge(
    local.common_tags,
    {
      Name = "dms-target-aurora-${var.environment_suffix}"
    }
  )

  depends_on = [aws_rds_cluster_instance.payment_writer]
}

# DMS Replication Task (Full Load + CDC)
resource "aws_dms_replication_task" "main" {
  replication_task_id       = "payment-migration-${var.environment_suffix}"
  migration_type            = "full-load-and-cdc"
  replication_instance_arn  = aws_dms_replication_instance.main.replication_instance_arn
  source_endpoint_arn       = aws_dms_endpoint.source.endpoint_arn
  target_endpoint_arn       = aws_dms_endpoint.target.endpoint_arn
  table_mappings            = file("${path.module}/dms-table-mappings.json")
  replication_task_settings = file("${path.module}/dms-task-settings.json")

  tags = merge(
    local.common_tags,
    {
      Name = "payment-migration-task-${var.environment_suffix}"
    }
  )

  lifecycle {
    ignore_changes = [replication_task_settings]
  }
}

# CloudWatch Log Group for DMS
resource "aws_cloudwatch_log_group" "dms" {
  name              = "/aws/dms/payment-migration-${var.environment_suffix}"
  retention_in_days = 30

  tags = merge(
    local.common_tags,
    {
      Name = "dms-logs-${var.environment_suffix}"
    }
  )
}

# CloudWatch Alarms for DMS
resource "aws_cloudwatch_metric_alarm" "dms_replication_lag" {
  alarm_name          = "dms-replication-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CDCLatencySource"
  namespace           = "AWS/DMS"
  period              = 300
  statistic           = "Average"
  threshold           = 300
  alarm_description   = "This metric monitors DMS replication lag"

  dimensions = {
    ReplicationInstanceIdentifier = aws_dms_replication_instance.main.replication_instance_id
    ReplicationTaskIdentifier     = aws_dms_replication_task.main.replication_task_id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "dms-replication-lag-alarm-${var.environment_suffix}"
    }
  )
}