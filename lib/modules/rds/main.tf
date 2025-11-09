# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "payment-rds-sg-${var.environment}"
  description = "Security group for RDS database"
  vpc_id      = var.vpc_id

  tags = {
    Name = "payment-rds-sg-${var.environment}"
  }
}

resource "aws_security_group_rule" "rds_from_ecs" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = var.ecs_security_group_id
  security_group_id        = aws_security_group.rds.id
  description              = "Allow PostgreSQL access from ECS tasks"
}

resource "aws_security_group_rule" "rds_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.rds.id
  description       = "Allow all outbound traffic"
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "payment-db-subnet-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "payment-db-subnet-${var.environment}"
  }
}

# Generate random password
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store password in SSM Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name  = "/payment/${var.environment}/database/password"
  type  = "SecureString"
  value = random_password.db_password.result

  tags = {
    Name = "payment-db-password-${var.environment}"
  }
}

# RDS Parameter Group
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "payment-db-params-${var.environment}"

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "100"
  }

  tags = {
    Name = "payment-db-params-${var.environment}"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "payment-db-${var.environment}"
  engine         = "postgres"
  engine_version = "15.14"

  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = var.backup_retention
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  multi_az                  = var.multi_az
  deletion_protection       = false
  skip_final_snapshot       = true
  final_snapshot_identifier = null

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name = "payment-db-${var.environment}"
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "payment-db-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.environment == "prod" ? "75" : "85"
  alarm_description   = "This metric monitors RDS CPU utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "database_storage" {
  alarm_name          = "payment-db-storage-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2147483648" # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}
