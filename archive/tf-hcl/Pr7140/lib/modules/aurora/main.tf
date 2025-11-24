resource "aws_rds_global_cluster" "main" {
  provider                  = aws.primary
  global_cluster_identifier = "global-aurora-${var.environment_suffix}"
  engine                    = "aurora-postgresql"
  engine_version            = "14.6"
  database_name             = "payments"
  storage_encrypted         = true
}

resource "aws_db_subnet_group" "primary" {
  provider    = aws.primary
  name_prefix = "aurora-primary-${var.environment_suffix}-"
  subnet_ids  = var.primary_subnet_ids

  tags = merge(var.tags, {
    Name   = "aurora-subnet-group-primary-${var.environment_suffix}"
    Region = var.primary_region
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_subnet_group" "dr" {
  provider    = aws.dr
  name_prefix = "aurora-dr-${var.environment_suffix}-"
  subnet_ids  = var.dr_subnet_ids

  tags = merge(var.tags, {
    Name   = "aurora-subnet-group-dr-${var.environment_suffix}"
    Region = var.dr_region
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "aurora_primary" {
  provider    = aws.primary
  name_prefix = "aurora-sg-primary-${var.environment_suffix}-"
  description = "Security group for Aurora primary cluster"
  vpc_id      = var.primary_vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "PostgreSQL from primary VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name   = "aurora-sg-primary-${var.environment_suffix}"
    Region = var.primary_region
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "aurora_dr" {
  provider    = aws.dr
  name_prefix = "aurora-sg-dr-${var.environment_suffix}-"
  description = "Security group for Aurora DR cluster"
  vpc_id      = var.dr_vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.1.0.0/16"]
    description = "PostgreSQL from DR VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name   = "aurora-sg-dr-${var.environment_suffix}"
    Region = var.dr_region
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_rds_cluster" "primary" {
  provider                     = aws.primary
  cluster_identifier           = "aurora-primary-${var.environment_suffix}"
  engine                       = aws_rds_global_cluster.main.engine
  engine_version               = aws_rds_global_cluster.main.engine_version
  database_name                = "payments"
  master_username              = var.db_master_username
  master_password              = var.db_master_password
  backup_retention_period      = 7
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"
  db_subnet_group_name         = aws_db_subnet_group.primary.name
  vpc_security_group_ids       = [aws_security_group.aurora_primary.id]
  storage_encrypted            = true
  skip_final_snapshot          = true
  deletion_protection          = false
  global_cluster_identifier    = aws_rds_global_cluster.main.id

  tags = merge(var.tags, {
    Name   = "aurora-primary-${var.environment_suffix}"
    Region = var.primary_region
  })
}

resource "aws_rds_cluster_instance" "primary" {
  provider            = aws.primary
  count               = 2
  identifier          = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier  = aws_rds_cluster.primary.id
  instance_class      = "db.r6g.large"
  engine              = aws_rds_cluster.primary.engine
  engine_version      = aws_rds_cluster.primary.engine_version
  publicly_accessible = false

  tags = merge(var.tags, {
    Name   = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
    Region = var.primary_region
  })
}

resource "aws_rds_cluster" "dr" {
  provider                  = aws.dr
  cluster_identifier        = "aurora-dr-${var.environment_suffix}"
  engine                    = aws_rds_global_cluster.main.engine
  engine_version            = aws_rds_global_cluster.main.engine_version
  db_subnet_group_name      = aws_db_subnet_group.dr.name
  vpc_security_group_ids    = [aws_security_group.aurora_dr.id]
  storage_encrypted         = true
  skip_final_snapshot       = true
  deletion_protection       = false
  global_cluster_identifier = aws_rds_global_cluster.main.id

  depends_on = [
    aws_rds_cluster_instance.primary
  ]

  tags = merge(var.tags, {
    Name   = "aurora-dr-${var.environment_suffix}"
    Region = var.dr_region
  })
}

resource "aws_rds_cluster_instance" "dr" {
  provider            = aws.dr
  count               = 2
  identifier          = "aurora-dr-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier  = aws_rds_cluster.dr.id
  instance_class      = "db.r6g.large"
  engine              = aws_rds_cluster.dr.engine
  engine_version      = aws_rds_cluster.dr.engine_version
  publicly_accessible = false

  tags = merge(var.tags, {
    Name   = "aurora-dr-instance-${count.index + 1}-${var.environment_suffix}"
    Region = var.dr_region
  })
}

resource "aws_cloudwatch_metric_alarm" "replication_lag" {
  provider            = aws.primary
  alarm_name          = "aurora-replication-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = var.replication_lag_threshold
  alarm_description   = "This metric monitors Aurora Global Database replication lag"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  tags = merge(var.tags, {
    Name = "aurora-replication-lag-alarm-${var.environment_suffix}"
  })
}

resource "aws_sns_topic" "aurora_alarms" {
  provider = aws.primary
  name     = "aurora-alarms-${var.environment_suffix}"

  tags = merge(var.tags, {
    Name = "aurora-alarms-${var.environment_suffix}"
  })
}

resource "aws_sns_topic_subscription" "aurora_alarms_email" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.aurora_alarms.arn
  protocol  = "email"
  endpoint  = "admin@example.com"
}

resource "aws_cloudwatch_metric_alarm" "primary_cpu" {
  provider            = aws.primary
  alarm_name          = "aurora-primary-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors Aurora primary cluster CPU utilization"
  alarm_actions       = [aws_sns_topic.aurora_alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  tags = merge(var.tags, {
    Name = "aurora-primary-cpu-alarm-${var.environment_suffix}"
  })
}
