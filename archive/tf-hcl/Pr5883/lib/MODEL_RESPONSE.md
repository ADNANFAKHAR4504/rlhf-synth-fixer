# Terraform ECS Fargate Microservices Platform Implementation

This is a comprehensive Terraform implementation for deploying a microservices architecture on AWS ECS Fargate with full observability, auto-scaling, and service mesh capabilities.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming uniqueness"
  type        = string
  default     = "prod"
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
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
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "microservices" {
  description = "List of microservices to deploy"
  type        = list(string)
  default = [
    "payment-api",
    "fraud-detection",
    "notification-service",
    "audit-logger",
    "webhook-processor"
  ]
}

variable "service_config" {
  description = "Configuration for each microservice"
  type = map(object({
    cpu    = number
    memory = number
    port   = number
    path   = string
  }))
  default = {
    payment-api = {
      cpu    = 512
      memory = 1024
      port   = 8080
      path   = "/api/payments/*"
    }
    fraud-detection = {
      cpu    = 1024
      memory = 2048
      port   = 8081
      path   = "/api/fraud/*"
    }
    notification-service = {
      cpu    = 256
      memory = 512
      port   = 8082
      path   = "/api/notifications/*"
    }
    audit-logger = {
      cpu    = 256
      memory = 512
      port   = 8083
      path   = "/api/audit/*"
    }
    webhook-processor = {
      cpu    = 512
      memory = 1024
      port   = 8084
      path   = "/api/webhooks/*"
    }
  }
}

variable "desired_count" {
  description = "Desired number of tasks per service"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum number of tasks for auto-scaling"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of tasks for auto-scaling"
  type        = number
  default     = 10
}

variable "cpu_target_value" {
  description = "Target CPU utilization percentage for scaling"
  type        = number
  default     = 70
}

variable "scale_down_cpu_threshold" {
  description = "CPU threshold for scaling down"
  type        = number
  default     = 30
}

variable "db_connection_secret_arn" {
  description = "ARN of the database connection secret in Secrets Manager"
  type        = string
  default     = ""
}

variable "api_credentials_secret_arn" {
  description = "ARN of the API credentials secret in Secrets Manager"
  type        = string
  default     = ""
}

variable "ecr_image_retention_count" {
  description = "Number of images to retain in ECR"
  type        = number
  default     = 10
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}
```

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      ManagedBy   = "terraform"
      Project     = "ecs-microservices"
    }
  }
}
```

## File: lib/networking.tf

```hcl
# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-microservices-${var.environment_suffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-microservices-${var.environment_suffix}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-public-${var.environment_suffix}-${count.index + 1}"
    Type = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "subnet-private-${var.environment_suffix}-${count.index + 1}"
    Type = "private"
  }
}

# NAT Gateway Elastic IPs
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name = "eip-nat-${var.environment_suffix}-${count.index + 1}"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-${var.environment_suffix}-${count.index + 1}"
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
    Name = "rt-public-${var.environment_suffix}"
  }
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "rt-private-${var.environment_suffix}-${count.index + 1}"
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "sg-alb-${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP traffic"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS traffic"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "sg-alb-${var.environment_suffix}"
  }
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "sg-ecs-tasks-${var.environment_suffix}"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow traffic from ALB"
  }

  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
    description = "Allow traffic between ECS tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "sg-ecs-tasks-${var.environment_suffix}"
  }
}
```

## File: lib/alb.tf

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-microservices-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name = "alb-microservices-${var.environment_suffix}"
  }
}

# Target Groups for each microservice
resource "aws_lb_target_group" "services" {
  for_each = var.service_config

  name        = "tg-${each.key}-${var.environment_suffix}"
  port        = each.value.port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name    = "tg-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Service not found"
      status_code  = "404"
    }
  }

  tags = {
    Name = "listener-http-${var.environment_suffix}"
  }
}

# Listener Rules for path-based routing
resource "aws_lb_listener_rule" "services" {
  for_each = var.service_config

  listener_arn = aws_lb_listener.http.arn
  priority     = 100 + index(keys(var.service_config), each.key)

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.key].arn
  }

  condition {
    path_pattern {
      values = [each.value.path]
    }
  }

  tags = {
    Name    = "rule-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}
```

## File: lib/ecr.tf

```hcl
# ECR Repositories for each microservice
resource "aws_ecr_repository" "services" {
  for_each = toset(var.microservices)

  name                 = "ecr-${each.key}-${var.environment_suffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name    = "ecr-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}

# ECR Lifecycle Policy to retain only last 10 images
resource "aws_ecr_lifecycle_policy" "services" {
  for_each   = toset(var.microservices)
  repository = aws_ecr_repository.services[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.ecr_image_retention_count} images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = var.ecr_image_retention_count
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
```

## File: lib/iam.tf

```hcl
# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "role-ecs-execution-${var.environment_suffix}"

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
    Name = "role-ecs-execution-${var.environment_suffix}"
  }
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for Secrets Manager access
resource "aws_iam_role_policy" "ecs_secrets_access" {
  name = "policy-secrets-access-${var.environment_suffix}"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.region}:*:secret:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:*:log-group:/ecs/*"
      }
    ]
  })
}

# IAM Task Roles for each microservice with specific permissions
resource "aws_iam_role" "ecs_task_role" {
  for_each = toset(var.microservices)

  name = "role-task-${each.key}-${var.environment_suffix}"

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
    Name    = "role-task-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}

# Service-specific policies
resource "aws_iam_role_policy" "payment_api" {
  name = "policy-payment-api-${var.environment_suffix}"
  role = aws_iam_role.ecs_task_role["payment-api"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.region}:*:secret:db-connection-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:*:log-group:/ecs/payment-api*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "fraud_detection" {
  name = "policy-fraud-detection-${var.environment_suffix}"
  role = aws_iam_role.ecs_task_role["fraud-detection"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.region}:*:secret:api-credentials-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:*:log-group:/ecs/fraud-detection*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "notification_service" {
  name = "policy-notification-${var.environment_suffix}"
  role = aws_iam_role.ecs_task_role["notification-service"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish",
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:*:log-group:/ecs/notification-service*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "audit_logger" {
  name = "policy-audit-logger-${var.environment_suffix}"
  role = aws_iam_role.ecs_task_role["audit-logger"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:CreateLogGroup"
        ]
        Resource = "arn:aws:logs:${var.region}:*:log-group:/ecs/audit-logger*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "arn:aws:s3:::audit-logs-*/*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "webhook_processor" {
  name = "policy-webhook-${var.environment_suffix}"
  role = aws_iam_role.ecs_task_role["webhook-processor"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.region}:*:secret:webhook-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:*:log-group:/ecs/webhook-processor*"
      }
    ]
  })
}
```

## File: lib/ecs.tf

```hcl
# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "ecs-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "ecs-cluster-${var.environment_suffix}"
  }
}

# ECS Cluster Capacity Providers
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}

# CloudWatch Log Groups for each service
resource "aws_cloudwatch_log_group" "services" {
  for_each = toset(var.microservices)

  name              = "/ecs/${each.key}-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name    = "log-group-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}

# ECS Task Definitions
resource "aws_ecs_task_definition" "services" {
  for_each = var.service_config

  family                   = "task-${each.key}-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task_role[each.key].arn

  container_definitions = jsonencode([
    {
      name      = each.key
      image     = "${aws_ecr_repository.services[each.key].repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = each.value.port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "SERVICE_NAME"
          value = each.key
        },
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        },
        {
          name  = "AWS_REGION"
          value = var.region
        }
      ]

      secrets = []

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${each.key}-${var.environment_suffix}"
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${each.value.port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      memory            = each.value.memory
      memoryReservation = each.value.memory / 2
    }
  ])

  tags = {
    Name    = "task-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}

# ECS Services
resource "aws_ecs_service" "services" {
  for_each = var.service_config

  name            = "service-${each.key}-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.services[each.key].arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.services[each.key].arn
    container_name   = each.key
    container_port   = each.value.port
  }

  health_check_grace_period_seconds = 60

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = {
    Name    = "service-${each.key}-${var.environment_suffix}"
    Service = each.key
  }

  depends_on = [aws_lb_listener.http]
}
```

## File: lib/autoscaling.tf

```hcl
# Auto Scaling Targets
resource "aws_appautoscaling_target" "services" {
  for_each = var.service_config

  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.services[each.key].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - Scale Up
resource "aws_appautoscaling_policy" "scale_up" {
  for_each = var.service_config

  name               = "policy-scale-up-${each.key}-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.services[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.services[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.services[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = var.cpu_target_value
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

# Auto Scaling Policy - Scale Down (additional policy for lower threshold)
resource "aws_appautoscaling_policy" "scale_down" {
  for_each = var.service_config

  name               = "policy-scale-down-${each.key}-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.services[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.services[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.services[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = var.scale_down_cpu_threshold
    scale_in_cooldown  = 600
    scale_out_cooldown = 300

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
```

## File: lib/appmesh.tf

```hcl
# App Mesh
resource "aws_appmesh_mesh" "main" {
  name = "mesh-microservices-${var.environment_suffix}"

  spec {
    egress_filter {
      type = "ALLOW_ALL"
    }
  }

  tags = {
    Name = "mesh-microservices-${var.environment_suffix}"
  }
}

# App Mesh Virtual Nodes
resource "aws_appmesh_virtual_node" "services" {
  for_each = var.service_config

  name      = "vnode-${each.key}-${var.environment_suffix}"
  mesh_name = aws_appmesh_mesh.main.name

  spec {
    listener {
      port_mapping {
        port     = each.value.port
        protocol = "http"
      }

      health_check {
        protocol            = "http"
        path                = "/health"
        healthy_threshold   = 2
        unhealthy_threshold = 3
        timeout_millis      = 5000
        interval_millis     = 30000
      }
    }

    service_discovery {
      aws_cloud_map {
        namespace_name = aws_service_discovery_private_dns_namespace.main.name
        service_name   = aws_service_discovery_service.services[each.key].name
      }
    }

    backend {
      dynamic "virtual_service" {
        for_each = [for svc in keys(var.service_config) : svc if svc != each.key]
        content {
          virtual_service_name = "${virtual_service.value}.${aws_service_discovery_private_dns_namespace.main.name}"
        }
      }
    }
  }

  tags = {
    Name    = "vnode-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}

# App Mesh Virtual Services
resource "aws_appmesh_virtual_service" "services" {
  for_each = var.service_config

  name      = "${each.key}.${aws_service_discovery_private_dns_namespace.main.name}"
  mesh_name = aws_appmesh_mesh.main.name

  spec {
    provider {
      virtual_node {
        virtual_node_name = aws_appmesh_virtual_node.services[each.key].name
      }
    }
  }

  tags = {
    Name    = "vservice-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}

# Service Discovery Private DNS Namespace
resource "aws_service_discovery_private_dns_namespace" "main" {
  name = "microservices.local"
  vpc  = aws_vpc.main.id

  tags = {
    Name = "sd-namespace-${var.environment_suffix}"
  }
}

# Service Discovery Services
resource "aws_service_discovery_service" "services" {
  for_each = var.service_config

  name = each.key

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }

  tags = {
    Name    = "sd-service-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}
```

## File: lib/secrets.tf

```hcl
# Secrets Manager - Database Connection String
resource "aws_secretsmanager_secret" "db_connection" {
  name                    = "secret-db-connection-${var.environment_suffix}"
  description             = "Database connection string for microservices"
  recovery_window_in_days = 7

  tags = {
    Name = "secret-db-connection-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "db_connection" {
  secret_id = aws_secretsmanager_secret.db_connection.id
  secret_string = jsonencode({
    host     = "db.example.com"
    port     = 5432
    database = "payments"
    username = "dbuser"
    password = "PLACEHOLDER_PASSWORD"
  })
}

# Secrets Manager - API Credentials
resource "aws_secretsmanager_secret" "api_credentials" {
  name                    = "secret-api-credentials-${var.environment_suffix}"
  description             = "Third-party API credentials for microservices"
  recovery_window_in_days = 7

  tags = {
    Name = "secret-api-credentials-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "api_credentials" {
  secret_id = aws_secretsmanager_secret.api_credentials.id
  secret_string = jsonencode({
    stripe_api_key     = "PLACEHOLDER_STRIPE_KEY"
    sendgrid_api_key   = "PLACEHOLDER_SENDGRID_KEY"
    twilio_api_key     = "PLACEHOLDER_TWILIO_KEY"
    fraud_api_key      = "PLACEHOLDER_FRAUD_KEY"
  })
}

# Secrets Manager - Webhook Secrets
resource "aws_secretsmanager_secret" "webhook_secrets" {
  name                    = "secret-webhook-secrets-${var.environment_suffix}"
  description             = "Webhook signing secrets"
  recovery_window_in_days = 7

  tags = {
    Name = "secret-webhook-secrets-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "webhook_secrets" {
  secret_id = aws_secretsmanager_secret.webhook_secrets.id
  secret_string = jsonencode({
    webhook_signing_secret = "PLACEHOLDER_SIGNING_SECRET"
    webhook_encryption_key = "PLACEHOLDER_ENCRYPTION_KEY"
  })
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS Cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = aws_lb.main.arn
}

output "ecr_repository_urls" {
  description = "ECR repository URLs for each microservice"
  value = {
    for service, repo in aws_ecr_repository.services : service => repo.repository_url
  }
}

output "service_discovery_namespace" {
  description = "Service Discovery namespace"
  value       = aws_service_discovery_private_dns_namespace.main.name
}

output "app_mesh_name" {
  description = "App Mesh name"
  value       = aws_appmesh_mesh.main.name
}

output "cloudwatch_log_groups" {
  description = "CloudWatch log group names for each service"
  value = {
    for service, log_group in aws_cloudwatch_log_group.services : service => log_group.name
  }
}

output "secrets_manager_arns" {
  description = "Secrets Manager secret ARNs"
  value = {
    db_connection   = aws_secretsmanager_secret.db_connection.arn
    api_credentials = aws_secretsmanager_secret.api_credentials.arn
    webhook_secrets = aws_secretsmanager_secret.webhook_secrets.arn
  }
}

output "ecs_service_names" {
  description = "ECS service names"
  value = {
    for service, svc in aws_ecs_service.services : service => svc.name
  }
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}
```

## File: lib/README.md

```markdown
# ECS Fargate Microservices Platform

This Terraform configuration deploys a production-ready microservices architecture on AWS ECS Fargate with comprehensive monitoring, auto-scaling, and service mesh capabilities.

## Architecture Overview

The infrastructure includes:

- **ECS Fargate Cluster** with CloudWatch Container Insights enabled
- **5 Microservices**: payment-api, fraud-detection, notification-service, audit-logger, webhook-processor
- **Application Load Balancer** with path-based routing
- **AWS App Mesh** for service-to-service communication
- **Auto Scaling** based on CPU utilization (70% scale up, 30% scale down)
- **ECR Repositories** with lifecycle policies (retain last 10 images)
- **CloudWatch Logs** with 7-day retention
- **IAM Roles** with least-privilege permissions per service
- **Secrets Manager** for secure credential storage
- **Multi-AZ deployment** across 3 availability zones

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Docker images for each microservice built and ready to push to ECR

## Usage

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Review and Customize Variables

Edit `variables.tf` or create a `terraform.tfvars` file:

```hcl
environment_suffix = "prod"
region            = "us-east-1"
desired_count     = 2
min_capacity      = 2
max_capacity      = 10
```

### 3. Plan Infrastructure

```bash
terraform plan -out=tfplan
```

### 4. Apply Infrastructure

```bash
terraform apply tfplan
```

### 5. Push Docker Images to ECR

After infrastructure is created, authenticate with ECR and push your images:

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push each service
docker tag payment-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ecr-payment-api-prod:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ecr-payment-api-prod:latest

# Repeat for other services
```

### 6. Update ECS Services

After pushing images, force a new deployment:

```bash
aws ecs update-service --cluster ecs-cluster-prod --service service-payment-api-prod --force-new-deployment
```

## Architecture Components

### Networking

- VPC with CIDR 10.0.0.0/16
- 3 public subnets for ALB
- 3 private subnets for ECS tasks
- NAT Gateways for outbound internet access
- Security groups for ALB and ECS tasks

### ECS Fargate

- Cluster with Container Insights enabled
- Task definitions with appropriate CPU/memory
- Services with minimum 2 tasks per service
- Health checks and grace periods
- Rolling deployment strategy

### Load Balancing

- Application Load Balancer in public subnets
- Target groups for each microservice
- Path-based routing rules:
  - `/api/payments/*` → payment-api
  - `/api/fraud/*` → fraud-detection
  - `/api/notifications/*` → notification-service
  - `/api/audit/*` → audit-logger
  - `/api/webhooks/*` → webhook-processor

### Auto Scaling

- Target tracking scaling based on CPU utilization
- Scale up at 70% CPU
- Scale down at 30% CPU
- Configurable min/max capacity

### Service Mesh

- AWS App Mesh for service discovery
- Virtual nodes for each microservice
- Virtual services for routing
- Service-to-service communication

### Monitoring

- CloudWatch Container Insights
- Log groups per service with 7-day retention
- CloudWatch metrics for scaling decisions

### Security

- IAM task execution role for ECS
- Service-specific IAM task roles
- Secrets Manager for credentials
- Private ECR repositories
- Security groups with least privilege

## Service Configuration

Each microservice has specific CPU/memory allocations:

| Service                | CPU  | Memory | Port |
|------------------------|------|--------|------|
| payment-api            | 512  | 1024   | 8080 |
| fraud-detection        | 1024 | 2048   | 8081 |
| notification-service   | 256  | 512    | 8082 |
| audit-logger           | 256  | 512    | 8083 |
| webhook-processor      | 512  | 1024   | 8084 |

## Outputs

After applying, Terraform will output:

- ALB DNS name for accessing services
- ECR repository URLs for pushing images
- ECS cluster name and ARN
- CloudWatch log group names
- Secrets Manager ARNs

## Maintenance

### Updating Services

To update a service with a new image:

```bash
# Push new image to ECR
docker push <ecr-url>:latest

# Update ECS service
aws ecs update-service --cluster <cluster-name> --service <service-name> --force-new-deployment
```

### Scaling

Auto-scaling is configured automatically, but you can manually adjust:

```bash
# Update desired count
aws ecs update-service --cluster <cluster-name> --service <service-name> --desired-count 5
```

### Monitoring

View logs in CloudWatch:

```bash
aws logs tail /ecs/payment-api-prod --follow
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all resources including data in secrets manager (after 7-day recovery window).

## Cost Optimization

- Uses Fargate which is serverless (no idle EC2 costs)
- Auto-scaling reduces costs during low traffic
- ECR lifecycle policies prevent storage bloat
- 7-day log retention reduces CloudWatch costs
- NAT Gateways are the primary cost driver (consider removing for dev environments)

## Troubleshooting

### Services Not Starting

1. Check ECS service events:
   ```bash
   aws ecs describe-services --cluster <cluster> --services <service>
   ```

2. Check CloudWatch logs:
   ```bash
   aws logs tail /ecs/<service-name> --follow
   ```

3. Verify security groups allow traffic

### Health Checks Failing

- Ensure `/health` endpoint returns 200
- Check health check timeout and interval
- Verify container port mappings

### Auto-Scaling Issues

- Check CloudWatch metrics for CPU utilization
- Verify scaling policies are attached
- Check IAM permissions for ECS auto-scaling

## Support

For issues or questions, please refer to:
- AWS ECS Documentation
- Terraform AWS Provider Documentation
- AWS App Mesh Documentation
