I'll create a comprehensive Terraform configuration for your e-commerce stack. Let me break this down into the modular structure you've requested.

## `lib/locals.tf`

```hcl
locals {
  # Common tagging strategy
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Stack       = "ecommerce-${var.environment}"
  }

  # AZ mapping for us-east-1 (exactly 3 AZs)
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
  
  # Subnet CIDR calculations
  vpc_cidr = "10.0.0.0/16"
  public_subnet_cidrs = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24"
  ]
  private_subnet_cidrs = [
    "10.0.11.0/24",
    "10.0.12.0/24",
    "10.0.13.0/24"
  ]

  # ECS configuration
  container_name = "${var.project_name}-app"
  container_port = 3000
  
  # CloudWatch configuration
  log_group_name = "/ecs/${var.project_name}-${var.environment}"
  
  # Route 53 configuration
  fqdn = var.domain_name != "" ? "${var.subdomain}.${var.domain_name}" : ""
}
```

## `lib/variables.tf`

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "ecommerce"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "container_image" {
  description = "Container image URI"
  type        = string
}

variable "container_cpu" {
  description = "Container CPU units (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512
}

variable "container_memory" {
  description = "Container memory in MB"
  type        = number
  default     = 1024
}

variable "min_capacity" {
  description = "Minimum number of tasks"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of tasks"
  type        = number
  default     = 10
}

variable "cpu_target_value" {
  description = "Target CPU utilization percentage for auto-scaling"
  type        = number
  default     = 70
}

variable "health_check_path" {
  description = "Health check path for ALB"
  type        = string
  default     = "/health"
}

variable "domain_name" {
  description = "Root domain name for Route 53"
  type        = string
  default     = ""
}

variable "subdomain" {
  description = "Subdomain for the application"
  type        = string
  default     = "app"
}

variable "enable_https" {
  description = "Enable HTTPS listener with ACM certificate"
  type        = bool
  default     = false
}

variable "acm_certificate_domain" {
  description = "Domain name for ACM certificate (when enable_https is true)"
  type        = string
  default     = ""
}

variable "environment_variables" {
  description = "Environment variables for the container"
  type        = map(string)
  default     = {}
}

variable "parameter_store_keys" {
  description = "List of SSM Parameter Store keys to fetch"
  type        = list(string)
  default     = []
}
```

## `lib/networking.tf`

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(local.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-public-${count.index + 1}"
    Type = "public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(local.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-private-${count.index + 1}"
    Type = "private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(local.availability_zones)
  
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(local.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-public-rt"
  })
}

# Private Route Tables (one per AZ for NAT Gateway)
resource "aws_route_table" "private" {
  count = length(local.availability_zones)
  
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## `lib/compute.tf`

```hcl
# ECR Repository
resource "aws_ecr_repository" "app" {
  name                 = "${var.project_name}-${var.environment}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.common_tags
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = local.container_name
      image = var.container_image

      portMappings = [
        {
          containerPort = local.container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        for key, value in var.environment_variables : {
          name  = key
          value = value
        }
      ]

      secrets = [
        for param_key in var.parameter_store_keys : {
          name      = param_key
          valueFrom = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${param_key}"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }

      essential = true
    }
  ])

  tags = local.common_tags
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2              = true

  tags = local.common_tags
}

# ALB Target Group
resource "aws_lb_target_group" "app" {
  name        = "${var.project_name}-${var.environment}-tg"
  port        = local.container_port
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
    unhealthy_threshold = 10  # 5 minutes (30s * 10)
  }

  deregistration_delay = 30

  tags = local.common_tags
}

# ALB Listener - HTTP
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = var.enable_https ? "redirect" : "forward"
    
    # Conditional redirect to HTTPS
    dynamic "redirect" {
      for_each = var.enable_https ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
    
    # Forward to target group if HTTPS is disabled
    target_group_arn = var.enable_https ? null : aws_lb_target_group.app.arn
  }
}

# ALB Listener - HTTPS (optional)
resource "aws_lb_listener" "https" {
  count = var.enable_https ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.enable_https ? aws_acm_certificate.main[0].arn : null

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# ACM Certificate (optional)
resource "aws_acm_certificate" "main" {
  count = var.enable_https ? 1 : 0

  domain_name       = var.acm_certificate_domain
  validation_method = "DNS"

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "${var.project_name}-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.min_capacity
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = aws_subnet.private[*].id
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = local.container_name
    container_port   = local.container_port
  }

  health_check_grace_period_seconds = 60

  deployment_controller {
    type = "ECS"
  }

  tags = local.common_tags

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_execution_policy
  ]
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - CPU
resource "aws_appautoscaling_policy" "cpu" {
  name               = "${var.project_name}-${var.environment}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value       = var.cpu_target_value
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}

# Security Group - ALB
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-alb-sg"
  })
}

# Security Group - ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-${var.environment}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol        = "tcp"
    from_port       = local.container_port
    to_port         = local.container_port
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-ecs-tasks-sg"
  })
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}
```

## `lib/iam.tf`

```hcl
# ECS Task Execution Role
resource "aws_iam_role" "ecs_execution" {
  name = "${var.project_name}-${var.environment}-ecs-execution-role"

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

  tags = local.common_tags
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_execution_policy" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for ECR and SSM access
resource "aws_iam_role_policy" "ecs_execution_additional" {
  name = "${var.project_name}-${var.environment}-ecs-execution-additional"
  role = aws_iam_role.ecs_execution.id

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
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/*"
      }
    ]
  })
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-${var.environment}-ecs-task-role"

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

  tags = local.common_tags
}

# Task role policy - minimal permissions for the application
resource "aws_iam_role_policy" "ecs_task" {
  name = "${var.project_name}-${var.environment}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/*"
      }
    ]
  })
}
```

## `lib/monitoring.tf`

```hcl
# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = local.log_group_name
  retention_in_days = 7

  tags = local.common_tags
}

# CloudWatch Dashboard (optional but useful)
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.app.name, "ClusterName", aws_ecs_cluster.main.name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "ECS Service Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix],
            [".", "RequestCount", ".", ".", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "ALB Metrics"
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "target_health" {
  alarm_name          = "${var.project_name}-${var.environment}-unhealthy-targets"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = var.min_capacity
  alarm_description   = "Alert when we have less than minimum healthy targets"
  treat_missing_data  = "breaching"

  dimensions = {
    TargetGroup  = aws_lb_target_group.app.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.common_tags
}
```

## `lib/outputs.tf`

```hcl
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "cloudwatch_log_group" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "task_execution_role_arn" {
  description = "ARN of the task execution role"
  value       = aws_iam_role.ecs_execution.arn
}

output "task_role_arn" {
  description = "ARN of the task role"
  value       = aws_iam_role.ecs_task.arn
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}
```

## Additional Files

### Route 53 Record (add to `lib/compute.tf` at the end)

```hcl
# Route 53 Record
resource "aws_route53_record" "app" {
  count = local.fqdn != "" ? 1 : 0

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = local.fqdn
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Data source for Route 53 zone
data "aws_route53_zone" "main" {
  count = local.fqdn != "" ? 1 : 0
  
  name         = var.domain_name
  private_zone = false
}
```

### SSM Parameter Store (create a separate file `lib/ssm.tf` for organization)

```hcl
# Example SSM parameters - these would typically be created outside Terraform
# or in a separate configuration, but showing the structure here
resource "aws_ssm_parameter" "app_config" {
  for_each = var.parameter_store_keys != [] ? toset(var.parameter_store_keys) : toset([])

  name  = "/${var.project_name}/${var.environment}/${each.key}"
  type  = "String"
  value = "placeholder" # This should be set via CI/CD or manually

  lifecycle {
    ignore_changes = [value]
  }

  tags = local.common_tags
}
```

## Usage Example

Create a `terraform.tfvars` file:

```hcl
project_name     = "ecommerce"
environment      = "prod"
container_image  = "123456789012.dkr.ecr.us-east-1.amazonaws.com/ecommerce-prod:latest"
container_cpu    = 512
container_memory = 1024
min_capacity     = 2
max_capacity     = 10
cpu_target_value = 70

domain_name            = "example.com"
subdomain             = "shop"
enable_https          = true
acm_certificate_domain = "shop.example.com"

environment_variables = {
  NODE_ENV = "production"
  PORT     = "3000"
}

parameter_store_keys = [
  "database_url",
  "redis_url",
  "api_key"
]
```

This configuration provides:

1. **Zero-downtime deployments** via ECS rolling updates and ALB health checks
2. **Auto-scaling** based on CPU utilization with proper cooldown periods
3. **High availability** across 3 AZs with NAT gateways for redundancy
4. **Security best practices** with least-privilege IAM roles and proper security groups
5. **Monitoring** with CloudWatch logs, dashboards, and alarms
6. **Clean modular structure** that's easy to maintain and extend

The setup ensures your e-commerce platform can handle traffic spikes while maintaining reliability and security.