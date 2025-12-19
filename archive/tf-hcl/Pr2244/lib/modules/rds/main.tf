resource "aws_db_subnet_group" "main" {
  name       = "prod-db-subnet-group-${var.region}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "prod-db-subnet-group-${var.region}"
  }
}

# New subnet group with unique identifier to avoid VPC conflicts
resource "aws_db_subnet_group" "custom" {
  name       = "prod-db-subnet-group-${var.region}-${var.subnet_group_suffix}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "prod-db-subnet-group-${var.region}-${var.subnet_group_suffix}"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "prod-rds-sg-${var.region}-"
  vpc_id      = var.vpc_id

  ingress {
    description = "MySQL/Aurora"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "prod-rds-sg-${var.region}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_parameter_group" "main" {
  family = "mysql8.0"
  name   = "prod-db-params-${var.region}"

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  parameter {
    name  = "long_query_time"
    value = "2"
  }

  tags = {
    Name = "prod-db-params-${var.region}"
  }
}

# New parameter group with unique identifier
resource "aws_db_parameter_group" "custom" {
  family = "mysql8.0"
  name   = "prod-db-params-${var.region}-${var.parameter_group_suffix}"

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  parameter {
    name  = "long_query_time"
    value = "2"
  }

  # Add any custom parameters here
  dynamic "parameter" {
    for_each = var.custom_parameters
    content {
      name  = parameter.value.name
      value = parameter.value.value
    }
  }

  tags = {
    Name = "prod-db-params-${var.region}-${var.parameter_group_suffix}"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "prod-database-${var.region}"
  engine         = "mysql"
  engine_version = "8.0.37"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = var.kms_key_id

  db_name  = "proddb"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  # Multi-AZ deployment for high availability
  multi_az = true

  # Backup configuration
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Security settings
  deletion_protection = true
  skip_final_snapshot = true
  # final_snapshot_identifier = "prod-database-${var.region}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Monitoring
  monitoring_interval             = 60
  monitoring_role_arn             = var.monitoring_role_arn
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  # Performance Insights (disabled for t3.micro)
  performance_insights_enabled = false

  tags = {
    Name = "prod-database-${var.region}"
  }

  lifecycle {
    ignore_changes = [
      password
    ]
  }
}

# CloudWatch Log Groups for RDS logs
resource "aws_cloudwatch_log_group" "rds_error" {
  name              = "/aws/rds/instance/prod-database-${var.region}/error"
  retention_in_days = 30

  tags = {
    Name = "prod-rds-error-logs-${var.region}"
  }
}

resource "aws_cloudwatch_log_group" "rds_general" {
  name              = "/aws/rds/instance/prod-database-${var.region}/general"
  retention_in_days = 7

  tags = {
    Name = "prod-rds-general-logs-${var.region}"
  }
}

resource "aws_cloudwatch_log_group" "rds_slow_query" {
  name              = "/aws/rds/instance/prod-database-${var.region}/slowquery"
  retention_in_days = 30

  tags = {
    Name = "prod-rds-slow-query-logs-${var.region}"
  }

  lifecycle {
    ignore_changes = [name]
  }
}
