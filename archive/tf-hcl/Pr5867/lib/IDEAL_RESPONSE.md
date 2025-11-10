## tap_stack.tf

```hcl
# tap_stack.tf
# Payment Processing Application Infrastructure Stack

# Get current AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# KMS Key for encryption
resource "aws_kms_key" "payment_processing" {
  description             = "KMS key for payment processing application encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-kms-key"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_kms_alias" "payment_processing" {
  name          = "alias/${var.project_name}-${var.environment}"
  target_key_id = aws_kms_key.payment_processing.key_id
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-igw-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# Public Subnets (for ALB)
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet-${count.index + 1}-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
    Type        = "Public"
  }
}

# Private Subnets (for ECS and RDS)
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.project_name}-private-subnet-${count.index + 1}-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
    Type        = "Private"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.project_name}-database-subnet-${count.index + 1}-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
    Type        = "Database"
  }
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.availability_zones)

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name        = "${var.project_name}-nat-eip-${count.index + 1}-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "${var.project_name}-nat-gateway-${count.index + 1}-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.project_name}-public-rt-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "${var.project_name}-private-rt-${count.index + 1}-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-${var.environment}"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-alb-sg-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_security_group" "ecs" {
  name_prefix = "${var.project_name}-ecs-${var.environment}"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Traffic from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-ecs-sg-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-${var.environment}"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  tags = {
    Name        = "${var.project_name}-rds-sg-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group-${var.environment}"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name        = "${var.project_name}-db-subnet-group-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# RDS Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier            = "${var.project_name}-cluster-${var.environment}"
  engine                        = "aurora-postgresql"
  engine_version                = var.postgres_engine_version
  database_name                 = var.database_name
  master_username               = var.db_username
  manage_master_user_password   = true
  master_user_secret_kms_key_id = aws_kms_key.payment_processing.key_id

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  storage_encrypted = true
  kms_key_id        = aws_kms_key.payment_processing.arn

  backup_retention_period      = 7
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-final-snapshot-${var.environment}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = {
    Name        = "${var.project_name}-cluster-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# RDS Aurora Instances
resource "aws_rds_cluster_instance" "main" {
  count = 2 # Multi-AZ deployment

  identifier         = "${var.project_name}-instance-${count.index + 1}-${var.environment}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.db_instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = {
    Name        = "${var.project_name}-instance-${count.index + 1}-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# IAM Roles and Policies
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.project_name}-ecs-execution-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-ecs-execution-role-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-ecs-task-role-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project_name}-rds-monitoring-role-${var.environment}"

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

  tags = {
    Name        = "${var.project_name}-rds-monitoring-role-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "${var.project_name}-cluster-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}-${var.environment}"
  retention_in_days = 7

  tags = {
    Name        = "${var.project_name}-ecs-logs-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "main" {
  family                   = "${var.project_name}-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.fargate_cpu
  memory                   = var.fargate_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "${var.project_name}-container"
      image = var.container_image

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs.name
          awslogs-region        = data.aws_region.current.id
          awslogs-stream-prefix = "ecs"
        }
      }

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = tostring(var.container_port)
        }
      ]

      secrets = [
        {
          name      = "DB_HOST"
          valueFrom = aws_ssm_parameter.db_host.arn
        },
        {
          name      = "DB_PASSWORD"
          valueFrom = aws_rds_cluster.main.master_user_secret[0].secret_arn
        }
      ]
    }
  ])

  tags = {
    Name        = "${var.project_name}-task-definition-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name        = "${var.project_name}-alb-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_lb_target_group" "main" {
  name        = "${var.project_name}-tg-${var.environment}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name        = "${var.project_name}-tg-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# HTTP Listener - either redirects to HTTPS or forwards to target group
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  # If certificate is provided, redirect to HTTPS, otherwise forward to target group
  default_action {
    type = var.certificate_arn != "" ? "redirect" : "forward"

    dynamic "redirect" {
      for_each = var.certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    dynamic "forward" {
      for_each = var.certificate_arn == "" ? [1] : []
      content {
        target_group {
          arn = aws_lb_target_group.main.arn
        }
      }
    }
  }
}

# HTTPS Listener - only created when certificate ARN is provided
resource "aws_lb_listener" "https" {
  count = var.certificate_arn != "" ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# ECS Service
resource "aws_ecs_service" "main" {
  name            = "${var.project_name}-service-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs.id]
    subnets          = aws_subnet.private[*].id
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "${var.project_name}-container"
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener.http]

  tags = {
    Name        = "${var.project_name}-service-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_scale_up" {
  name               = "${var.project_name}-scale-up-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# S3 Bucket for Logs
resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-logs-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.project_name}-logs-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
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
      kms_master_key_id = aws_kms_key.payment_processing.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log_retention"
    status = "Enabled"

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# Systems Manager Parameters
resource "aws_ssm_parameter" "db_host" {
  name  = "/${var.project_name}/${var.environment}/db/host"
  type  = "String"
  value = aws_rds_cluster.main.endpoint

  tags = {
    Name        = "${var.project_name}-db-host-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_ssm_parameter" "db_name" {
  name  = "/${var.project_name}/${var.environment}/db/name"
  type  = "String"
  value = aws_rds_cluster.main.database_name

  tags = {
    Name        = "${var.project_name}-db-name-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project_name}-rds-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = {
    Name        = "${var.project_name}-rds-cpu-alarm-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "${var.project_name}-ecs-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = aws_ecs_service.main.name
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = {
    Name        = "${var.project_name}-ecs-cpu-alarm-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_target_health" {
  alarm_name          = "${var.project_name}-alb-target-health-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB target health"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.main.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name        = "${var.project_name}-alb-health-alarm-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${var.environment}"

  tags = {
    Name        = "${var.project_name}-alerts-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# WAF Web ACL (Basic SQL Injection Protection)
resource "aws_wafv2_web_acl" "main" {
  name  = "${var.project_name}-waf-${var.environment}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "SQLInjectionProtection"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLInjectionProtection"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}WAF${var.environment}"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "${var.project_name}-waf-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# Route53 Hosted Zone Data Source (assumes existing hosted zone)
data "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}

# Route53 Health Check for ALB
resource "aws_route53_health_check" "alb" {
  count                           = var.domain_name != "" ? 1 : 0
  fqdn                            = aws_lb.main.dns_name
  port                            = var.certificate_arn != "" ? 443 : 80
  type                            = var.certificate_arn != "" ? "HTTPS" : "HTTP"
  resource_path                   = var.health_check_path
  failure_threshold               = 3
  request_interval                = 30
  insufficient_data_health_status = "Unhealthy"

  tags = {
    Name        = "${var.project_name}-health-check-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# Route53 Weighted Routing Record
resource "aws_route53_record" "main" {
  count = var.domain_name != "" ? 1 : 0

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.environment == "prod" ? var.domain_name : "${var.environment}.${var.domain_name}"
  type    = "A"

  # Weighted routing configuration
  set_identifier = "${var.project_name}-${var.environment}"
  weighted_routing_policy {
    weight = var.route53_weight
  }

  # Health check for failover
  health_check_id = aws_route53_health_check.alb[0].id

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }

  depends_on = [aws_lb.main]
}

# Route53 CNAME Record for www subdomain (optional)
resource "aws_route53_record" "www" {
  count = var.domain_name != "" && var.create_www_record ? 1 : 0

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.environment == "prod" ? "www.${var.domain_name}" : "www.${var.environment}.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [var.environment == "prod" ? var.domain_name : "${var.environment}.${var.domain_name}"]

  # Weighted routing for www subdomain
  set_identifier = "${var.project_name}-www-${var.environment}"
  weighted_routing_policy {
    weight = var.route53_weight
  }
}

# CloudWatch Alarm for Route53 Health Check
resource "aws_cloudwatch_metric_alarm" "route53_health_check" {
  count = var.domain_name != "" ? 1 : 0

  alarm_name          = "${var.project_name}-route53-health-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "This metric monitors Route53 health check status"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.alb[0].id
  }

  tags = {
    Name        = "${var.project_name}-route53-health-alarm-${var.environment}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}
```

## variables.tf
```hcl
# variables.tf
# Payment Processing Application Variables

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "payment-processing"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "cost_center" {
  description = "Cost center for resource tagging"
  type        = string
  default     = "fintech-payments"
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.100.0/24", "10.0.101.0/24", "10.0.102.0/24"]
}

# Database Configuration
variable "postgres_engine_version" {
  description = "PostgreSQL engine version for Aurora"
  type        = string
  default     = "15.6"
}

variable "database_name" {
  description = "Name of the initial database"
  type        = string
  default     = "payments"
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "dbadmin"
}

variable "db_instance_class" {
  description = "RDS instance class for Aurora cluster instances"
  type        = string
  default     = "db.t4g.medium"

  validation {
    condition     = can(regex("^db\\.(t4g|r6g|r5|r4)\\.", var.db_instance_class))
    error_message = "DB instance class must be a valid Aurora PostgreSQL instance class (e.g., db.t4g.medium, db.r6g.large)."
  }
}

# ECS Configuration
variable "container_image" {
  description = "Docker image for the payment processing application"
  type        = string
  default     = "nginx:latest" # Replace with actual application image
}

variable "container_port" {
  description = "Port on which the container listens"
  type        = number
  default     = 3000
}

variable "fargate_cpu" {
  description = "CPU units for Fargate task (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "fargate_memory" {
  description = "Memory for Fargate task in MiB"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum number of ECS tasks for auto scaling"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of ECS tasks for auto scaling"
  type        = number
  default     = 10
}

variable "health_check_path" {
  description = "Health check path for the application"
  type        = string
  default     = "/health"
}

# Route53 Configuration
variable "domain_name" {
  description = "Domain name for the application. Leave empty to skip Route53 configuration"
  type        = string
  default     = ""
}

variable "route53_weight" {
  description = "Weight for Route53 weighted routing (0-255). Use 0 for dev, gradually increase for prod traffic shifting"
  type        = number
  default     = 100

  validation {
    condition     = var.route53_weight >= 0 && var.route53_weight <= 255
    error_message = "Route53 weight must be between 0 and 255."
  }
}

variable "create_www_record" {
  description = "Whether to create a www CNAME record"
  type        = bool
  default     = true
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS. Leave empty to serve HTTP traffic directly without SSL/TLS"
  type        = string
  default     = ""
}

# Monitoring Configuration
variable "notification_email" {
  description = "Email for CloudWatch alarm notifications"
  type        = string
  default     = "admin@company.com"
}
```

## outputs.tf

```hcl
# outputs.tf
# Payment Processing Application Outputs

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "rds_cluster_id" {
  description = "RDS Aurora cluster identifier"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "rds_cluster_endpoint" {
  description = "RDS Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "RDS Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_cluster_port" {
  description = "RDS Aurora cluster port"
  value       = aws_rds_cluster.main.port
}

output "rds_cluster_master_username" {
  description = "RDS Aurora cluster master username"
  value       = aws_rds_cluster.main.master_username
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "s3_logs_bucket_name" {
  description = "Name of the S3 bucket for logs"
  value       = aws_s3_bucket.logs.bucket
}

output "s3_logs_bucket_arn" {
  description = "ARN of the S3 bucket for logs"
  value       = aws_s3_bucket.logs.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.payment_processing.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.payment_processing.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "security_group_alb_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "security_group_ecs_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs.id
}

output "security_group_rds_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "application_url" {
  description = "URL to access the application"
  value       = var.certificate_arn != "" ? "https://${aws_lb.main.dns_name}" : "http://${aws_lb.main.dns_name}"
}

output "application_http_url" {
  description = "HTTP URL to access the application"
  value       = "http://${aws_lb.main.dns_name}"
}

output "application_https_url" {
  description = "HTTPS URL to access the application (only if certificate is configured)"
  value       = var.certificate_arn != "" ? "https://${aws_lb.main.dns_name}" : "N/A - No certificate configured"
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for ECS"
  value       = aws_cloudwatch_log_group.ecs.name
}

# Route53 Outputs
output "route53_zone_id" {
  description = "Route53 hosted zone ID (if domain configured)"
  value       = var.domain_name != "" ? data.aws_route53_zone.main[0].zone_id : "N/A - No domain configured"
}

output "route53_record_fqdn" {
  description = "Fully qualified domain name of the Route53 record"
  value       = var.domain_name != "" ? aws_route53_record.main[0].fqdn : "N/A - No domain configured"
}

output "route53_health_check_id" {
  description = "Route53 health check ID"
  value       = var.domain_name != "" ? aws_route53_health_check.alb[0].id : "N/A - No domain configured"
}

output "domain_url" {
  description = "Primary domain URL for the application"
  value       = var.domain_name != "" ? "${var.certificate_arn != "" ? "https" : "http"}://${var.environment == "prod" ? var.domain_name : "${var.environment}.${var.domain_name}"}" : "N/A - No domain configured"
}

output "www_domain_url" {
  description = "WWW domain URL for the application"
  value       = var.domain_name != "" && var.create_www_record ? "${var.certificate_arn != "" ? "https" : "http"}://www.${var.environment == "prod" ? var.domain_name : "${var.environment}.${var.domain_name}"}" : "N/A - WWW record not configured"
}
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
}
```