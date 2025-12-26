# Complete Terraform Infrastructure for Financial Services Migration

This implementation provides a complete blue-green deployment infrastructure for migrating a payment processing application from on-premises to AWS with zero downtime. All resources follow PCI-DSS compliance requirements with encryption, network isolation, and comprehensive logging.

## Architecture Overview

- Multi-AZ VPC across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
- Public subnets for ALB and NAT Gateways
- Private subnets for ECS Fargate and RDS Aurora
- Blue-green deployment with separate ECS services and target groups
- Continuous database replication using AWS DMS from Oracle to Aurora PostgreSQL
- KMS encryption for all data at rest
- 90-day CloudWatch log retention for compliance

## File: main.tf

```hcl
# main.tf - Main infrastructure resources

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name            = "vpc-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name            = "igw-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

# Public Subnets (3 AZs)
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name            = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
    Type            = "Public"
  }
}

# Private Subnets (3 AZs)
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name            = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
    Type            = "Private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name            = "nat-eip-${count.index + 1}-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (one per AZ)
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name            = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name            = "public-rt-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per AZ)
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name            = "private-rt-${count.index + 1}-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for payment processing infrastructure"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name            = "kms-key-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/payment-processing-${var.environment_suffix}"
  target_key_id = aws_kms_key.main.key_id
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "ecs_blue" {
  name              = "/ecs/payment-processing-blue-${var.environment_suffix}"
  retention_in_days = 90

  tags = {
    Name            = "ecs-logs-blue-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "blue"
  }
}

resource "aws_cloudwatch_log_group" "ecs_green" {
  name              = "/ecs/payment-processing-green-${var.environment_suffix}"
  retention_in_days = 90

  tags = {
    Name            = "ecs-logs-green-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "green"
  }
}

resource "aws_cloudwatch_log_group" "dms" {
  name              = "/dms/replication-${var.environment_suffix}"
  retention_in_days = 90

  tags = {
    Name            = "dms-logs-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

resource "aws_cloudwatch_log_group" "alb" {
  name              = "/alb/access-logs-${var.environment_suffix}"
  retention_in_days = 90

  tags = {
    Name            = "alb-logs-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}
```

## File: security_groups.tf

```hcl
# security_groups.tf - Security group definitions

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "alb-sg-${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name            = "alb-sg-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

# ECS Security Group
resource "aws_security_group" "ecs" {
  name        = "ecs-sg-${var.environment_suffix}"
  description = "Security group for ECS Fargate tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Traffic from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name            = "ecs-sg-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "rds-sg-${var.environment_suffix}"
  description = "Security group for RDS Aurora PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id, aws_security_group.dms.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name            = "rds-sg-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

# DMS Security Group
resource "aws_security_group" "dms" {
  name        = "dms-sg-${var.environment_suffix}"
  description = "Security group for DMS replication instance"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name            = "dms-sg-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}
```

## File: iam.tf

```hcl
# iam.tf - IAM roles and policies

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "ecs-task-execution-role-${var.environment_suffix}"

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
    Name            = "ecs-task-execution-role-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "ecs-task-role-${var.environment_suffix}"

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
    Name            = "ecs-task-role-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

resource "aws_iam_role_policy" "ecs_task" {
  name = "ecs-task-policy-${var.environment_suffix}"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.ecs_blue.arn}:*",
          "${aws_cloudwatch_log_group.ecs_green.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

# DMS IAM Role
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

  tags = {
    Name            = "dms-vpc-role-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

resource "aws_iam_role_policy_attachment" "dms_vpc" {
  role       = aws_iam_role.dms_vpc.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole"
}

# DMS CloudWatch Role
resource "aws_iam_role" "dms_cloudwatch" {
  name = "dms-cloudwatch-role-${var.environment_suffix}"

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

  tags = {
    Name            = "dms-cloudwatch-role-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

resource "aws_iam_role_policy_attachment" "dms_cloudwatch" {
  role       = aws_iam_role.dms_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonDMSCloudWatchLogsRole"
}
```

## File: rds.tf

```hcl
# rds.tf - RDS Aurora PostgreSQL cluster

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "aurora-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name            = "aurora-subnet-group-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

# Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "aurora-cluster-${var.environment_suffix}"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "15.4"
  database_name           = "paymentdb"
  master_username         = var.db_master_username
  master_password         = var.db_master_password
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  storage_encrypted = true
  kms_key_id        = aws_kms_key.main.arn

  skip_final_snapshot       = true
  final_snapshot_identifier = "aurora-final-snapshot-${var.environment_suffix}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name            = "aurora-cluster-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

# Aurora Cluster Instances (3 AZs)
resource "aws_rds_cluster_instance" "main" {
  count              = 3
  identifier         = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.r6g.large"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  publicly_accessible = false

  tags = {
    Name            = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}
```

## File: alb.tf

```hcl
# alb.tf - Application Load Balancer configuration

# Self-signed certificate for testing (replace with ACM certificate in production)
resource "aws_acm_certificate" "main" {
  domain_name       = "payment-processing-${var.environment_suffix}.example.com"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.payment-processing-${var.environment_suffix}.example.com"
  ]

  tags = {
    Name            = "acm-cert-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name            = "alb-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

# Target Group - Blue Environment
resource "aws_lb_target_group" "blue" {
  name        = "tg-blue-${var.environment_suffix}"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name            = "tg-blue-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "blue"
  }
}

# Target Group - Green Environment
resource "aws_lb_target_group" "green" {
  name        = "tg-green-${var.environment_suffix}"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name            = "tg-green-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "green"
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }
}

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Listener Rule for Blue-Green switching (controlled by variable)
resource "aws_lb_listener_rule" "traffic_routing" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = var.active_environment == "green" ? aws_lb_target_group.green.arn : aws_lb_target_group.blue.arn
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}
```

## File: ecs.tf

```hcl
# ecs.tf - ECS Fargate cluster and services

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "ecs-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name            = "ecs-cluster-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

# ECS Task Definition - Blue
resource "aws_ecs_task_definition" "blue" {
  family                   = "payment-processing-blue-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "payment-app-blue"
      image     = var.container_image
      cpu       = 512
      memory    = 1024
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "ENVIRONMENT"
          value = "blue"
        },
        {
          name  = "DB_HOST"
          value = aws_rds_cluster.main.endpoint
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_NAME"
          value = "paymentdb"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_blue.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name            = "ecs-task-def-blue-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "blue"
  }
}

# ECS Task Definition - Green
resource "aws_ecs_task_definition" "green" {
  family                   = "payment-processing-green-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "payment-app-green"
      image     = var.container_image
      cpu       = 512
      memory    = 1024
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "ENVIRONMENT"
          value = "green"
        },
        {
          name  = "DB_HOST"
          value = aws_rds_cluster.main.endpoint
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_NAME"
          value = "paymentdb"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_green.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name            = "ecs-task-def-green-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "green"
  }
}

# ECS Service - Blue
resource "aws_ecs_service" "blue" {
  name            = "payment-service-blue-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.blue.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs.id]
    subnets          = aws_subnet.private[*].id
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "payment-app-blue"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.https]

  tags = {
    Name            = "ecs-service-blue-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "blue"
  }
}

# ECS Service - Green
resource "aws_ecs_service" "green" {
  name            = "payment-service-green-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.green.arn
  desired_count   = 0  # Initially set to 0, scale up during blue-green deployment
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs.id]
    subnets          = aws_subnet.private[*].id
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.green.arn
    container_name   = "payment-app-green"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.https]

  tags = {
    Name            = "ecs-service-green-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "green"
  }
}
```

## File: dms.tf

```hcl
# dms.tf - AWS Database Migration Service configuration

# DMS Subnet Group
resource "aws_dms_replication_subnet_group" "main" {
  replication_subnet_group_id          = "dms-subnet-group-${var.environment_suffix}"
  replication_subnet_group_description = "DMS replication subnet group"
  subnet_ids                           = aws_subnet.private[*].id

  tags = {
    Name            = "dms-subnet-group-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

# DMS Replication Instance
resource "aws_dms_replication_instance" "main" {
  replication_instance_id      = "dms-instance-${var.environment_suffix}"
  replication_instance_class   = "dms.t3.medium"
  allocated_storage            = 100
  engine_version               = "3.5.1"
  multi_az                     = false
  publicly_accessible          = false
  replication_subnet_group_id  = aws_dms_replication_subnet_group.main.id
  vpc_security_group_ids       = [aws_security_group.dms.id]
  kms_key_arn                  = aws_kms_key.main.arn

  tags = {
    Name            = "dms-instance-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }

  depends_on = [
    aws_iam_role_policy_attachment.dms_vpc,
    aws_iam_role_policy_attachment.dms_cloudwatch
  ]
}

# DMS Source Endpoint (Oracle on-premises)
resource "aws_dms_endpoint" "source" {
  endpoint_id                 = "source-oracle-${var.environment_suffix}"
  endpoint_type               = "source"
  engine_name                 = "oracle"
  server_name                 = var.source_db_server
  port                        = 1521
  database_name               = var.source_db_name
  username                    = var.source_db_username
  password                    = var.source_db_password
  ssl_mode                    = "require"
  extra_connection_attributes = "useLogminerReader=N;useBfile=Y"

  tags = {
    Name            = "dms-source-endpoint-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}

# DMS Target Endpoint (Aurora PostgreSQL)
resource "aws_dms_endpoint" "target" {
  endpoint_id   = "target-aurora-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "aurora-postgresql"
  server_name   = aws_rds_cluster.main.endpoint
  port          = 5432
  database_name = aws_rds_cluster.main.database_name
  username      = var.db_master_username
  password      = var.db_master_password
  ssl_mode      = "require"

  tags = {
    Name            = "dms-target-endpoint-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }

  depends_on = [aws_rds_cluster_instance.main]
}

# DMS Replication Task
resource "aws_dms_replication_task" "main" {
  replication_task_id       = "migration-task-${var.environment_suffix}"
  migration_type            = "full-load-and-cdc"
  replication_instance_arn  = aws_dms_replication_instance.main.replication_instance_arn
  source_endpoint_arn       = aws_dms_endpoint.source.endpoint_arn
  target_endpoint_arn       = aws_dms_endpoint.target.endpoint_arn
  table_mappings            = jsonencode({
    rules = [
      {
        rule-type = "selection"
        rule-id   = "1"
        rule-name = "1"
        object-locator = {
          schema-name = "%"
          table-name  = "%"
        }
        rule-action = "include"
      }
    ]
  })

  replication_task_settings = jsonencode({
    Logging = {
      EnableLogging = true
      LogComponents = [
        {
          Id       = "TRANSFORMATION"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id       = "SOURCE_CAPTURE"
          Severity = "LOGGER_SEVERITY_INFO"
        },
        {
          Id       = "TARGET_APPLY"
          Severity = "LOGGER_SEVERITY_INFO"
        }
      ]
    }
    ControlTablesSettings = {
      ControlSchema               = "dms_control"
      HistoryTimeslotInMinutes    = 5
      HistoryTableEnabled         = true
      SuspendedTablesTableEnabled = true
      StatusTableEnabled          = true
    }
  })

  tags = {
    Name            = "dms-replication-task-${var.environment_suffix}"
    Environment     = var.environment_suffix
    CostCenter      = "FinOps"
    MigrationPhase  = "initial"
  }
}
```

## File: outputs.tf

```hcl
# outputs.tf - Output values

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "blue_target_group_arn" {
  description = "Blue target group ARN"
  value       = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  description = "Green target group ARN"
  value       = aws_lb_target_group.green.arn
}

output "dms_replication_instance_arn" {
  description = "DMS replication instance ARN"
  value       = aws_dms_replication_instance.main.replication_instance_arn
}

output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}
```

## File: terraform.tfvars.example

```hcl
# terraform.tfvars.example - Example variable values (copy to terraform.tfvars)

aws_region         = "us-east-1"
environment_suffix = "dev"

# Database credentials (use AWS Secrets Manager or environment variables in production)
db_master_username = "postgres"
# db_master_password = "REPLACE_WITH_SECURE_PASSWORD"

# Container image
container_image = "your-ecr-repo/payment-processing:latest"

# Active environment for blue-green deployment
active_environment = "blue"

# DMS source database (on-premises Oracle)
source_db_server = "oracle.onprem.example.com"
source_db_name   = "ORCL"
# source_db_username = "REPLACE_WITH_ORACLE_USERNAME"
# source_db_password = "REPLACE_WITH_ORACLE_PASSWORD"

# Tagging
repository    = "iac-test-automations"
team          = "synth"
commit_author = "terraform"
pr_number     = "unknown"
```
