# Requirement 2: Parameterized RDS module supporting MySQL and PostgreSQL

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "cluster" {
  name        = "${var.environment}-${var.region_name}-${var.cluster_name}-${var.environment_suffix}"
  description = "Subnet group for ${var.cluster_name} RDS cluster"
  subnet_ids  = var.subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-${var.region_name}-${var.cluster_name}-subnet-group-${var.environment_suffix}"
    }
  )
}

# RDS Cluster Parameter Group
resource "aws_rds_cluster_parameter_group" "cluster" {
  name        = "${var.environment}-${var.region_name}-${var.cluster_name}-${var.environment_suffix}"
  family      = var.engine == "aurora-mysql" ? "aurora-mysql8.0" : "aurora-postgresql15"
  description = "Parameter group for ${var.cluster_name} cluster"

  dynamic "parameter" {
    for_each = var.cluster_parameters
    content {
      name         = parameter.value.name
      value        = parameter.value.value
      apply_method = lookup(parameter.value, "apply_method", "immediate")
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-${var.region_name}-${var.cluster_name}-cluster-params-${var.environment_suffix}"
    }
  )
}

# DB Parameter Group
resource "aws_db_parameter_group" "instance" {
  name        = "${var.environment}-${var.region_name}-${var.cluster_name}-instance-${var.environment_suffix}"
  family      = var.engine == "aurora-mysql" ? "aurora-mysql8.0" : "aurora-postgresql15"
  description = "Parameter group for ${var.cluster_name} instances"

  dynamic "parameter" {
    for_each = var.instance_parameters
    content {
      name         = parameter.value.name
      value        = parameter.value.value
      apply_method = lookup(parameter.value, "apply_method", "immediate")
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-${var.region_name}-${var.cluster_name}-instance-params-${var.environment_suffix}"
    }
  )
}

# Security Group
resource "aws_security_group" "cluster" {
  name_prefix = "${var.environment}-${var.region_name}-${var.cluster_name}-${var.environment_suffix}-"
  description = "Security group for ${var.cluster_name} RDS cluster"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = var.engine == "aurora-mysql" ? 3306 : 5432
    to_port         = var.engine == "aurora-mysql" ? 3306 : 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
    description     = "Allow database access from application tier"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-${var.region_name}-${var.cluster_name}-sg-${var.environment_suffix}"
    }
  )
}

# RDS Aurora Cluster
resource "aws_rds_cluster" "cluster" {
  cluster_identifier = "${var.environment}-${var.region_name}-${var.cluster_name}-${var.environment_suffix}"
  engine             = var.engine
  engine_version     = var.engine_version
  database_name      = var.database_name
  master_username    = var.master_username
  master_password    = var.master_password

  db_subnet_group_name            = aws_db_subnet_group.cluster.name
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.cluster.name
  vpc_security_group_ids          = [aws_security_group.cluster.id]

  backup_retention_period      = var.backup_retention_period
  preferred_backup_window      = var.preferred_backup_window
  preferred_maintenance_window = var.preferred_maintenance_window

  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports

  storage_encrypted = true
  kms_key_id        = var.kms_key_id

  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.environment}-${var.region_name}-${var.cluster_name}-final-${var.environment_suffix}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  apply_immediately = var.apply_immediately

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [final_snapshot_identifier]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-${var.region_name}-${var.cluster_name}-cluster-${var.environment_suffix}"
    }
  )
}

# Requirement 4: Use for_each instead of count for cluster instances
resource "aws_rds_cluster_instance" "instances" {
  for_each = { for idx in range(var.instance_count) : idx => idx }

  identifier         = "${var.environment}-${var.region_name}-${var.cluster_name}-${each.key}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.cluster.id
  instance_class     = var.instance_class
  engine             = var.engine
  engine_version     = var.engine_version

  db_parameter_group_name = aws_db_parameter_group.instance.name

  performance_insights_enabled    = var.performance_insights_enabled
  performance_insights_kms_key_id = var.performance_insights_enabled ? var.kms_key_id : null

  monitoring_interval = var.enhanced_monitoring_interval
  monitoring_role_arn = var.enhanced_monitoring_interval > 0 ? var.monitoring_role_arn : null

  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  publicly_accessible = false

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-${var.region_name}-${var.cluster_name}-instance-${each.key}-${var.environment_suffix}"
      Role = each.key == 0 ? "writer" : "reader"
    }
  )
}