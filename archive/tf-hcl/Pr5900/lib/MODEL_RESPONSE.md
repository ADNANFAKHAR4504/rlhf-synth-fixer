# ECS Fargate Microservices Architecture - Terraform Implementation

This solution provides a complete Terraform configuration for deploying three microservices on Amazon ECS Fargate with an internal Application Load Balancer, auto-scaling, and comprehensive monitoring.

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Suffix for resource names to support multiple environments"
  type        = string
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (for NAT gateways)"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "ecr_repository_urls" {
  description = "ECR repository URLs for each service"
  type = object({
    payment_service   = string
    auth_service      = string
    analytics_service = string
  })
  default = {
    payment_service   = "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/payment-service"
    auth_service      = "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/auth-service"
    analytics_service = "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/analytics-service"
  }
}

variable "container_image_tags" {
  description = "Image tags for each service"
  type = object({
    payment_service   = string
    auth_service      = string
    analytics_service = string
  })
  default = {
    payment_service   = "latest"
    auth_service      = "latest"
    analytics_service = "latest"
  }
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "enable_container_insights" {
  description = "Enable ECS Container Insights"
  type        = bool
  default     = true
}

variable "task_cpu" {
  description = "CPU units for ECS tasks"
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Memory for ECS tasks in MiB"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired number of tasks per service"
  type        = number
  default     = 2
}

variable "autoscaling_min_capacity" {
  description = "Minimum number of tasks for autoscaling"
  type        = number
  default     = 2
}

variable "autoscaling_max_capacity" {
  description = "Maximum number of tasks for autoscaling"
  type        = number
  default     = 10
}

variable "autoscaling_cpu_threshold" {
  description = "CPU utilization threshold for autoscaling"
  type        = number
  default     = 70
}

variable "autoscaling_memory_threshold" {
  description = "Memory utilization threshold for autoscaling"
  type        = number
  default     = 70
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "health_check_timeout" {
  description = "Health check timeout in seconds"
  type        = number
  default     = 5
}

variable "health_check_healthy_threshold" {
  description = "Number of consecutive successful health checks"
  type        = number
  default     = 2
}

variable "health_check_unhealthy_threshold" {
  description = "Number of consecutive failed health checks"
  type        = number
  default     = 3
}
```

## File: main.tf

```hcl
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment       = var.environment_suffix
      Project           = "fintech-microservices"
      ManagedBy         = "terraform"
      EnvironmentSuffix = var.environment_suffix
    }
  }
}
```

## File: networking.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "fintech-vpc-${var.environment_suffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "fintech-igw-${var.environment_suffix}"
  }
}

# Public Subnets (for NAT Gateways)
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "fintech-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# Private Subnets (for ECS tasks)
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "fintech-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name = "fintech-nat-eip-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "fintech-nat-${count.index + 1}-${var.environment_suffix}"
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
    Name = "fintech-public-rt-${var.environment_suffix}"
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "fintech-private-rt-${count.index + 1}-${var.environment_suffix}"
  }
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: security-groups.tf

```hcl
# Security Group for Internal ALB
resource "aws_security_group" "alb" {
  name_prefix = "fintech-alb-${var.environment_suffix}-"
  description = "Security group for internal ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "fintech-alb-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for ECS Services
resource "aws_security_group" "ecs_services" {
  name_prefix = "fintech-ecs-${var.environment_suffix}-"
  description = "Security group for ECS services"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Port 8080 from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "Port 8080 from same security group (inter-service communication)"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    self        = true
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "fintech-ecs-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: iam.tf

```hcl
# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution_role" {
  name_prefix = "ecs-task-exec-${var.environment_suffix}-"

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
    Name = "ecs-task-execution-role-${var.environment_suffix}"
  }
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for ECR and Parameter Store access
resource "aws_iam_role_policy" "ecs_task_execution_additional" {
  name_prefix = "ecs-exec-additional-${var.environment_suffix}-"
  role        = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/ecs/fintech/*"
      }
    ]
  })
}

# ECS Task Role
resource "aws_iam_role" "ecs_task_role" {
  name_prefix = "ecs-task-${var.environment_suffix}-"

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
    Name = "ecs-task-role-${var.environment_suffix}"
  }
}

# Policy for Parameter Store access
resource "aws_iam_role_policy" "ecs_task_parameter_store" {
  name_prefix = "ecs-task-ssm-${var.environment_suffix}-"
  role        = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/fintech/*"
      }
    ]
  })
}

# Policy for CloudWatch Logs
resource "aws_iam_role_policy" "ecs_task_cloudwatch" {
  name_prefix = "ecs-task-cw-${var.environment_suffix}-"
  role        = aws_iam_role.ecs_task_role.id

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
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/ecs/fintech/*"
      }
    ]
  })
}
```

## File: cloudwatch.tf

```hcl
# CloudWatch Log Groups for each service
resource "aws_cloudwatch_log_group" "payment_service" {
  name              = "/ecs/fintech/payment-service-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name    = "payment-service-logs-${var.environment_suffix}"
    Service = "payment-service"
  }
}

resource "aws_cloudwatch_log_group" "auth_service" {
  name              = "/ecs/fintech/auth-service-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name    = "auth-service-logs-${var.environment_suffix}"
    Service = "auth-service"
  }
}

resource "aws_cloudwatch_log_group" "analytics_service" {
  name              = "/ecs/fintech/analytics-service-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name    = "analytics-service-logs-${var.environment_suffix}"
    Service = "analytics-service"
  }
}
```

## File: alb.tf

```hcl
# Internal Application Load Balancer
resource "aws_lb" "internal" {
  name               = "fintech-alb-${var.environment_suffix}"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.private[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name = "fintech-internal-alb-${var.environment_suffix}"
  }
}

# Target Group for Payment Service
resource "aws_lb_target_group" "payment_service" {
  name_prefix          = "pay-"
  port                 = 8080
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    interval            = var.health_check_interval
    timeout             = var.health_check_timeout
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
    matcher             = "200"
  }

  tags = {
    Name    = "payment-service-tg-${var.environment_suffix}"
    Service = "payment-service"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Target Group for Auth Service
resource "aws_lb_target_group" "auth_service" {
  name_prefix          = "auth-"
  port                 = 8080
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = "/auth/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    interval            = var.health_check_interval
    timeout             = var.health_check_timeout
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
    matcher             = "200"
  }

  tags = {
    Name    = "auth-service-tg-${var.environment_suffix}"
    Service = "auth-service"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Target Group for Analytics Service
resource "aws_lb_target_group" "analytics_service" {
  name_prefix          = "anlyt-"
  port                 = 8080
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = "/analytics/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    interval            = var.health_check_interval
    timeout             = var.health_check_timeout
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
    matcher             = "200"
  }

  tags = {
    Name    = "analytics-service-tg-${var.environment_suffix}"
    Service = "analytics-service"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.internal.arn
  port              = "80"
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
    Name = "fintech-alb-listener-${var.environment_suffix}"
  }
}

# Listener Rules for routing
resource "aws_lb_listener_rule" "payment_service" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.payment_service.arn
  }

  condition {
    path_pattern {
      values = ["/payment/*", "/health"]
    }
  }

  tags = {
    Name    = "payment-service-rule-${var.environment_suffix}"
    Service = "payment-service"
  }
}

resource "aws_lb_listener_rule" "auth_service" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.auth_service.arn
  }

  condition {
    path_pattern {
      values = ["/auth/*"]
    }
  }

  tags = {
    Name    = "auth-service-rule-${var.environment_suffix}"
    Service = "auth-service"
  }
}

resource "aws_lb_listener_rule" "analytics_service" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 300

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.analytics_service.arn
  }

  condition {
    path_pattern {
      values = ["/analytics/*"]
    }
  }

  tags = {
    Name    = "analytics-service-rule-${var.environment_suffix}"
    Service = "analytics-service"
  }
}
```

## File: ecs-cluster.tf

```hcl
# ECS Cluster
resource "aws_ecs_cluster" "fintech_cluster" {
  name = "fintech-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }

  tags = {
    Name = "fintech-cluster-${var.environment_suffix}"
  }
}

# ECS Cluster Capacity Provider (Fargate)
resource "aws_ecs_cluster_capacity_providers" "fintech_cluster" {
  cluster_name = aws_ecs_cluster.fintech_cluster.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}
```

## File: ecs-payment-service.tf

```hcl
# Task Definition for Payment Service
resource "aws_ecs_task_definition" "payment_service" {
  family                   = "payment-service-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "payment-service"
      image     = "${var.ecr_repository_urls.payment_service}:${var.container_image_tags.payment_service}"
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "SERVICE_NAME"
          value = "payment-service"
        },
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.payment_service.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "payment"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name    = "payment-service-task-${var.environment_suffix}"
    Service = "payment-service"
  }
}

# ECS Service for Payment Service
resource "aws_ecs_service" "payment_service" {
  name            = "payment-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.fintech_cluster.id
  task_definition = aws_ecs_task_definition.payment_service.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_services.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.payment_service.arn
    container_name   = "payment-service"
    container_port   = 8080
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  health_check_grace_period_seconds = 60

  tags = {
    Name    = "payment-service-${var.environment_suffix}"
    Service = "payment-service"
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy.ecs_task_execution_additional
  ]
}
```

## File: ecs-auth-service.tf

```hcl
# Task Definition for Auth Service
resource "aws_ecs_task_definition" "auth_service" {
  family                   = "auth-service-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "auth-service"
      image     = "${var.ecr_repository_urls.auth_service}:${var.container_image_tags.auth_service}"
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "SERVICE_NAME"
          value = "auth-service"
        },
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.auth_service.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "auth"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/auth/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name    = "auth-service-task-${var.environment_suffix}"
    Service = "auth-service"
  }
}

# ECS Service for Auth Service
resource "aws_ecs_service" "auth_service" {
  name            = "auth-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.fintech_cluster.id
  task_definition = aws_ecs_task_definition.auth_service.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_services.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.auth_service.arn
    container_name   = "auth-service"
    container_port   = 8080
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  health_check_grace_period_seconds = 60

  tags = {
    Name    = "auth-service-${var.environment_suffix}"
    Service = "auth-service"
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy.ecs_task_execution_additional
  ]
}
```

## File: ecs-analytics-service.tf

```hcl
# Task Definition for Analytics Service
resource "aws_ecs_task_definition" "analytics_service" {
  family                   = "analytics-service-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "analytics-service"
      image     = "${var.ecr_repository_urls.analytics_service}:${var.container_image_tags.analytics_service}"
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "SERVICE_NAME"
          value = "analytics-service"
        },
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.analytics_service.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "analytics"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/analytics/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name    = "analytics-service-task-${var.environment_suffix}"
    Service = "analytics-service"
  }
}

# ECS Service for Analytics Service
resource "aws_ecs_service" "analytics_service" {
  name            = "analytics-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.fintech_cluster.id
  task_definition = aws_ecs_task_definition.analytics_service.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_services.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.analytics_service.arn
    container_name   = "analytics-service"
    container_port   = 8080
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  health_check_grace_period_seconds = 60

  tags = {
    Name    = "analytics-service-${var.environment_suffix}"
    Service = "analytics-service"
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy.ecs_task_execution_additional
  ]
}
```

## File: autoscaling.tf

```hcl
# Auto Scaling Target for Payment Service
resource "aws_appautoscaling_target" "payment_service" {
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.fintech_cluster.name}/${aws_ecs_service.payment_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU-based Auto Scaling Policy for Payment Service
resource "aws_appautoscaling_policy" "payment_service_cpu" {
  name               = "payment-service-cpu-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.payment_service.resource_id
  scalable_dimension = aws_appautoscaling_target.payment_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.payment_service.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.autoscaling_cpu_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Memory-based Auto Scaling Policy for Payment Service
resource "aws_appautoscaling_policy" "payment_service_memory" {
  name               = "payment-service-memory-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.payment_service.resource_id
  scalable_dimension = aws_appautoscaling_target.payment_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.payment_service.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = var.autoscaling_memory_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Target for Auth Service
resource "aws_appautoscaling_target" "auth_service" {
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.fintech_cluster.name}/${aws_ecs_service.auth_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU-based Auto Scaling Policy for Auth Service
resource "aws_appautoscaling_policy" "auth_service_cpu" {
  name               = "auth-service-cpu-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.auth_service.resource_id
  scalable_dimension = aws_appautoscaling_target.auth_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.auth_service.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.autoscaling_cpu_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Memory-based Auto Scaling Policy for Auth Service
resource "aws_appautoscaling_policy" "auth_service_memory" {
  name               = "auth-service-memory-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.auth_service.resource_id
  scalable_dimension = aws_appautoscaling_target.auth_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.auth_service.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = var.autoscaling_memory_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Target for Analytics Service
resource "aws_appautoscaling_target" "analytics_service" {
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.fintech_cluster.name}/${aws_ecs_service.analytics_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU-based Auto Scaling Policy for Analytics Service
resource "aws_appautoscaling_policy" "analytics_service_cpu" {
  name               = "analytics-service-cpu-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.analytics_service.resource_id
  scalable_dimension = aws_appautoscaling_target.analytics_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.analytics_service.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.autoscaling_cpu_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Memory-based Auto Scaling Policy for Analytics Service
resource "aws_appautoscaling_policy" "analytics_service_memory" {
  name               = "analytics-service-memory-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.analytics_service.resource_id
  scalable_dimension = aws_appautoscaling_target.analytics_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.analytics_service.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = var.autoscaling_memory_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

## File: outputs.tf

```hcl
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.fintech_cluster.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.fintech_cluster.arn
}

output "alb_dns_name" {
  description = "DNS name of the internal ALB"
  value       = aws_lb.internal.dns_name
}

output "alb_arn" {
  description = "ARN of the internal ALB"
  value       = aws_lb.internal.arn
}

output "payment_service_target_group_arn" {
  description = "ARN of the payment service target group"
  value       = aws_lb_target_group.payment_service.arn
}

output "auth_service_target_group_arn" {
  description = "ARN of the auth service target group"
  value       = aws_lb_target_group.auth_service.arn
}

output "analytics_service_target_group_arn" {
  description = "ARN of the analytics service target group"
  value       = aws_lb_target_group.analytics_service.arn
}

output "payment_service_name" {
  description = "Name of the payment ECS service"
  value       = aws_ecs_service.payment_service.name
}

output "auth_service_name" {
  description = "Name of the auth ECS service"
  value       = aws_ecs_service.auth_service.name
}

output "analytics_service_name" {
  description = "Name of the analytics ECS service"
  value       = aws_ecs_service.analytics_service.name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "ecs_security_group_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs_services.id
}

output "cloudwatch_log_groups" {
  description = "CloudWatch log group names for each service"
  value = {
    payment_service   = aws_cloudwatch_log_group.payment_service.name
    auth_service      = aws_cloudwatch_log_group.auth_service.name
    analytics_service = aws_cloudwatch_log_group.analytics_service.name
  }
}
```

## File: terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and customize for your environment

environment_suffix = "dev"
aws_region         = "ap-southeast-1"

# VPC Configuration
vpc_cidr               = "10.0.0.0/16"
availability_zones     = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
private_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
public_subnet_cidrs    = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

# ECR Repository URLs (update with your account ID)
ecr_repository_urls = {
  payment_service   = "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/payment-service"
  auth_service      = "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/auth-service"
  analytics_service = "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/analytics-service"
}

# Container Image Tags
container_image_tags = {
  payment_service   = "v1.0.0"
  auth_service      = "v1.0.0"
  analytics_service = "v1.0.0"
}

# ECS Configuration
task_cpu    = 512
task_memory = 1024

# Service Configuration
desired_count = 2

# Auto Scaling
autoscaling_min_capacity    = 2
autoscaling_max_capacity    = 10
autoscaling_cpu_threshold   = 70
autoscaling_memory_threshold = 70

# CloudWatch Logs
log_retention_days = 7

# Container Insights
enable_container_insights = true

# Health Checks
health_check_interval            = 30
health_check_timeout             = 5
health_check_healthy_threshold   = 2
health_check_unhealthy_threshold = 3
```

## File: README.md

```markdown
# ECS Fargate Microservices Architecture

This Terraform configuration deploys a containerized microservices architecture on Amazon ECS Fargate with three services: payment-service, auth-service, and analytics-service.

## Architecture Overview

- **ECS Cluster**: fintech-cluster with Container Insights enabled
- **Services**: Three ECS Fargate services, each running 2 tasks minimum
- **Networking**: Multi-AZ VPC with private subnets across 3 availability zones
- **Load Balancing**: Internal Application Load Balancer with separate target groups per service
- **Auto Scaling**: CPU and memory-based auto-scaling (70% threshold)
- **Logging**: CloudWatch log groups with '/ecs/fintech/' prefix and 7-day retention
- **Security**: IAM roles for ECR and Parameter Store access, security groups restricting traffic to port 8080

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** version 1.5 or higher
3. **AWS CLI** configured with credentials
4. **ECR Repositories** with container images:
   - payment-service
   - auth-service
   - analytics-service

## Deployment Instructions

### Step 1: Configure Variables

Copy the example tfvars file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and update:
- `environment_suffix`: Your environment identifier (e.g., "dev", "staging", "prod")
- `ecr_repository_urls`: Your ECR repository URLs
- `container_image_tags`: Your container image tags

### Step 2: Initialize Terraform

```bash
terraform init
```

### Step 3: Review the Plan

```bash
terraform plan
```

### Step 4: Deploy

```bash
terraform apply
```

Review the changes and type `yes` to confirm.

### Step 5: Verify Deployment

Check ECS services:

```bash
aws ecs list-services --cluster fintech-cluster-${ENVIRONMENT_SUFFIX} --region ap-southeast-1
```

Check ALB health:

```bash
aws elbv2 describe-target-health \
  --target-group-arn $(terraform output -raw payment_service_target_group_arn) \
  --region ap-southeast-1
```

## Resource Naming Convention

All resources use the `environment_suffix` variable in their names:
- ECS Cluster: `fintech-cluster-${environment_suffix}`
- Services: `payment-service-${environment_suffix}`, etc.
- ALB: `fintech-alb-${environment_suffix}`
- Security Groups: `fintech-ecs-${environment_suffix}`, `fintech-alb-${environment_suffix}`

## Configuration Details

### Task Specifications
- **CPU**: 512 units
- **Memory**: 1024 MiB
- **Network Mode**: awsvpc (required for Fargate)

### Health Checks
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Healthy Threshold**: 2
- **Unhealthy Threshold**: 3
- **Paths**:
  - Payment Service: `/health`
  - Auth Service: `/auth/health`
  - Analytics Service: `/analytics/health`

### Auto Scaling
- **Minimum Tasks**: 2
- **Maximum Tasks**: 10
- **CPU Threshold**: 70%
- **Memory Threshold**: 70%
- **Scale Out Cooldown**: 60 seconds
- **Scale In Cooldown**: 300 seconds

### Circuit Breaker
Enabled on all services with automatic rollback on deployment failures.

## Security

### IAM Roles

**Task Execution Role** permissions:
- Pull images from ECR
- Write to CloudWatch Logs
- Access Secrets Manager (if needed)

**Task Role** permissions:
- Read from Parameter Store (`/fintech/*` path)
- Write to CloudWatch Logs

### Security Groups

**ALB Security Group**:
- Ingress: HTTP (80), HTTPS (443) from VPC CIDR
- Egress: All traffic

**ECS Services Security Group**:
- Ingress: Port 8080 from ALB and same security group (inter-service)
- Egress: All traffic

### Network Isolation
- ECS tasks run in private subnets
- Internal ALB for service-to-service communication
- NAT Gateways for outbound internet access

## Monitoring

### CloudWatch Logs
- Log groups: `/ecs/fintech/{service-name}-${environment_suffix}`
- Retention: 7 days (configurable)

### Container Insights
Enabled by default, provides:
- CPU and memory utilization metrics
- Network metrics
- Task-level metrics

### ALB Metrics
- Request count
- Target response time
- HTTP error codes
- Healthy/unhealthy host count

## Outputs

After deployment, Terraform outputs:
- ECS cluster name and ARN
- ALB DNS name
- Target group ARNs
- Service names
- VPC and subnet IDs
- Security group IDs
- CloudWatch log group names

Access outputs:

```bash
terraform output
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all ECS services, tasks, load balancer, and networking resources.

## Troubleshooting

### Service fails to start
1. Check CloudWatch logs for container errors
2. Verify ECR repository access
3. Ensure container images exist with specified tags
4. Check security group rules

### Health checks failing
1. Verify health check paths match application endpoints
2. Check container is listening on port 8080
3. Review security group rules allow ALB to task communication
4. Check CloudWatch logs for application errors

### Auto scaling not triggering
1. Verify CloudWatch metrics are being published
2. Check auto scaling policy configuration
3. Ensure Container Insights is enabled
4. Review scaling cooldown periods

## Cost Optimization

- Uses Fargate for serverless container management (no EC2 instances)
- Auto scaling adjusts capacity based on load
- 7-day log retention (adjust as needed)
- Consider using Fargate Spot for non-critical workloads

## Support

For issues or questions:
1. Check CloudWatch logs for error messages
2. Review AWS service quotas
3. Verify IAM permissions
4. Consult Terraform state file for resource status
```
