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

provider "aws" {
  region = var.aws_region
}
```

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Logical project identifier"
  type        = string
  default     = "ecommerce"
}

variable "environment" {
  description = "Deployment environment name (e.g. prod, staging)"
  type        = string
  default     = "prod"
}

variable "environment_suffix" {
  description = "Unique suffix appended to resource names for isolation"
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
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of ECS tasks"
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

variable "enable_https" {
  description = "Enable HTTPS listener on the load balancer"
  type        = bool
  default     = false
}

variable "create_acm_certificate" {
  description = "Provision ACM certificate when true"
  type        = bool
  default     = false
}

variable "acm_certificate_domain" {
  description = "Domain name to include in ACM certificate when created"
  type        = string
  default     = ""
}

variable "existing_acm_certificate_arn" {
  description = "Existing ACM certificate ARN to reuse when HTTPS is enabled"
  type        = string
  default     = ""
}

variable "enable_route53" {
  description = "Create Route 53 DNS record pointing to ALB"
  type        = bool
  default     = false
}

variable "route53_hosted_zone_name" {
  description = "Hosted zone name for Route 53 record (trailing dot optional)"
  type        = string
  default     = ""
}

variable "route53_record_name" {
  description = "Record name to create within the hosted zone"
  type        = string
  default     = ""
}

variable "environment_variables" {
  description = "Plaintext environment variables for the container"
  type        = map(string)
  default     = {}
}

variable "ssm_parameters" {
  description = "Map of environment variable names to values stored as SSM parameters"
  type        = map(string)
  default     = {}
}

variable "database_secret_arn" {
  description = "ARN of Secrets Manager secret containing the database password"
  type        = string
  default     = ""
}

variable "database_secret_env_name" {
  description = "Environment variable name exposed to container for database password"
  type        = string
  default     = "DATABASE_PASSWORD"
}

variable "db_engine" {
  description = "Database engine identifier"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "Database engine version"
  type        = string
  default     = "15.4"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.small"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS (in GB)"
  type        = number
  default     = 20
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "app_user"
}

variable "db_name" {
  description = "Initial database name"
  type        = string
  default     = "appdb"
}

variable "db_enable_performance_insights" {
  description = "Toggle Performance Insights for the database when supported"
  type        = bool
  default     = false
}
```

```hcl
# locals.tf
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "region-name"
    values = [var.aws_region]
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}-${var.environment_suffix}"

  common_tags = {
    Project           = var.project_name
    Environment       = var.environment
    EnvironmentSuffix = var.environment_suffix
    ManagedBy         = "terraform"
    Stack             = "ecommerce-${var.environment}-${var.environment_suffix}"
  }

  availability_zones = slice(data.aws_availability_zones.available.names, 0, 3)

  vpc_cidr = "10.0.0.0/16"

  public_subnet_cidrs = [
    for index in range(3) : cidrsubnet(local.vpc_cidr, 8, index)
  ]

  private_subnet_cidrs = [
    for index in range(3) : cidrsubnet(local.vpc_cidr, 8, index + 10)
  ]

  container_name = "${local.name_prefix}-app"
  container_port = 3000

  log_group_name = "/ecs/${local.name_prefix}"

  fqdn = var.enable_route53 && var.route53_record_name != "" && var.route53_hosted_zone_name != "" ? var.route53_record_name : ""

  ssm_parameter_names = [
    for key in keys(var.ssm_parameters) : "/${local.name_prefix}/${key}"
  ]
}
```

```hcl
# networking.tf
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_subnet" "public" {
  count = length(local.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${count.index + 1}"
    Type = "public"
  })
}

resource "aws_subnet" "private" {
  count = length(local.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${count.index + 1}"
    Type = "private"
  })
}

resource "aws_eip" "nat" {
  count = length(local.availability_zones)

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = length(local.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count = length(local.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

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
```

```hcl
# compute.tf
locals {
  sanitized_prefix                 = lower(replace(local.name_prefix, "_", "-"))
  lb_name                          = substr("${local.sanitized_prefix}-alb", 0, 32)
  target_group_name                = substr("${local.sanitized_prefix}-tg", 0, 32)
  ecs_cluster_name                 = substr("${local.sanitized_prefix}-cluster", 0, 255)
  ecs_service_name                 = substr("${local.sanitized_prefix}-service", 0, 255)
  ecr_repository_name              = substr(local.sanitized_prefix, 0, 255)
  db_identifier                    = substr("${local.sanitized_prefix}-db", 0, 63)
  db_subnet_group_name             = substr("${local.sanitized_prefix}-db-subnets", 0, 255)
  db_supports_performance_insights = !contains(["db.t3.micro", "db.t4g.micro"], lower(var.db_instance_class))
  db_enable_performance_insights   = var.db_enable_performance_insights && local.db_supports_performance_insights
}

resource "aws_ecr_repository" "app" {
  name                 = local.ecr_repository_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = local.common_tags
}

resource "aws_ecs_cluster" "main" {
  name = local.ecs_cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

resource "aws_ecs_task_definition" "app" {
  family                   = local.sanitized_prefix
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.container_cpu)
  memory                   = tostring(var.container_memory)
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

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

      environment = concat(
        [
          for key, value in var.environment_variables : {
            name  = key
            value = value
          }
        ],
        [
          {
            name  = "DB_HOST"
            value = aws_db_instance.app.address
          },
          {
            name  = "DB_NAME"
            value = var.db_name
          },
          {
            name  = "DB_USER"
            value = var.db_username
          }
        ]
      )

      secrets = concat(
        [
          for key, param in aws_ssm_parameter.app_config :
          {
            name      = key
            valueFrom = param.arn
          }
        ],
        var.database_secret_arn != "" ? [
          {
            name      = var.database_secret_env_name
            valueFrom = var.database_secret_arn
          }
        ] : []
      )

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${local.container_port}${var.health_check_path} || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 15
      }

      essential = true
    }
  ])

  tags = local.common_tags
}

resource "aws_lb" "main" {
  name               = local.lb_name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = local.common_tags
}

resource "aws_lb_target_group" "app" {
  name        = local.target_group_name
  port        = local.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200-399"
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 10
  }

  deregistration_delay = 30

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  dynamic "default_action" {
    for_each = var.enable_https ? [] : [1]
    content {
      type             = "forward"
      target_group_arn = aws_lb_target_group.app.arn
    }
  }

  dynamic "default_action" {
    for_each = var.enable_https ? [1] : []
    content {
      type = "redirect"

      redirect {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }
}

resource "aws_acm_certificate" "main" {
  count = var.enable_https && var.create_acm_certificate ? 1 : 0

  domain_name       = var.acm_certificate_domain
  validation_method = "DNS"

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "https" {
  count = var.enable_https ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.create_acm_certificate ? aws_acm_certificate.main[0].arn : var.existing_acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  lifecycle {
    precondition {
      condition     = var.create_acm_certificate || var.existing_acm_certificate_arn != ""
      error_message = "HTTPS is enabled but neither create_acm_certificate nor existing_acm_certificate_arn is configured."
    }
  }
}

resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
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
    Name = "${local.name_prefix}-alb-sg"
  })
}

resource "aws_security_group" "ecs_tasks" {
  name        = "${local.name_prefix}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol        = "tcp"
    from_port       = local.container_port
    to_port         = local.container_port
    security_groups = [aws_security_group.alb.id]
    description     = "Traffic from ALB"
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-sg"
  })
}

resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-db-sg"
  description = "Security group for RDS instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Database access from ECS tasks"
    protocol        = "tcp"
    from_port       = 5432
    to_port         = 5432
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-sg"
  })
}

resource "aws_db_subnet_group" "main" {
  name        = local.db_subnet_group_name
  description = "Private subnets for RDS"
  subnet_ids  = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnets"
  })
}

resource "aws_db_instance" "app" {
  identifier = local.db_identifier

  allocated_storage           = var.db_allocated_storage
  engine                      = var.db_engine
  engine_version              = var.db_engine_version
  instance_class              = var.db_instance_class
  db_name                     = var.db_name
  username                    = var.db_username
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az                = true
  storage_encrypted       = true
  backup_retention_period = 7
  copy_tags_to_snapshot   = true
  deletion_protection     = false
  publicly_accessible     = false
  apply_immediately       = true
  skip_final_snapshot     = true

  performance_insights_enabled = local.db_enable_performance_insights

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db"
  })
}

resource "aws_ecs_service" "app" {
  name             = local.ecs_service_name
  cluster          = aws_ecs_cluster.main.id
  task_definition  = aws_ecs_task_definition.app.arn
  desired_count    = var.min_capacity
  launch_type      = "FARGATE"
  platform_version = "LATEST"

  deployment_controller {
    type = "ECS"
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100
  health_check_grace_period_seconds  = 60

  enable_ecs_managed_tags = true
  propagate_tags          = "SERVICE"

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

  tags = local.common_tags

  depends_on = [
    aws_lb_target_group.app,
    aws_iam_role_policy_attachment.ecs_execution_policy,
    aws_lb_listener.http,
    aws_db_instance.app,
    aws_lb_listener.https
  ]
}

resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  depends_on = [aws_ecs_service.app]
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "${local.name_prefix}-cpu-scaling"
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

resource "aws_route53_record" "app" {
  count = var.enable_route53 && var.route53_record_name != "" && var.route53_hosted_zone_name != "" ? 1 : 0

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.route53_record_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

data "aws_route53_zone" "main" {
  count = var.enable_route53 && var.route53_hosted_zone_name != "" ? 1 : 0

  name         = var.route53_hosted_zone_name
  private_zone = false
}

data "aws_caller_identity" "current" {}
```

```hcl
# iam.tf
resource "aws_iam_role" "ecs_execution" {
  name = "${local.name_prefix}-ecs-execution-role"

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

resource "aws_iam_role_policy_attachment" "ecs_execution_policy" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_ssm" {
  count = length(local.ssm_parameter_names) > 0 ? 1 : 0

  name = "${local.name_prefix}-ecs-execution-ssm"
  role = aws_iam_role.ecs_execution.id

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
        Resource = [
          for name in local.ssm_parameter_names :
          "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${name}"
        ]
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "${local.name_prefix}-ecs-task-role"

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

resource "aws_iam_role_policy" "ecs_task" {
  count = (length(local.ssm_parameter_names) > 0 || var.database_secret_arn != "") ? 1 : 0

  name = "${local.name_prefix}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      length(local.ssm_parameter_names) > 0 ? [
        {
          Effect = "Allow"
          Action = [
            "ssm:GetParameter",
            "ssm:GetParameters",
            "ssm:GetParametersByPath"
          ]
          Resource = [
            for name in local.ssm_parameter_names :
            "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${name}"
          ]
        }
      ] : [],
      var.database_secret_arn != "" ? [
        {
          Effect = "Allow"
          Action = [
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret"
          ]
          Resource = var.database_secret_arn
        }
      ] : []
    )
  })
}
```

```hcl
# ssm.tf
resource "aws_ssm_parameter" "app_config" {
  for_each = var.ssm_parameters

  name  = "/${local.name_prefix}/${each.key}"
  type  = "SecureString"
  value = each.value

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${each.key}"
  })
}
```

```hcl
# monitoring.tf
resource "aws_cloudwatch_log_group" "ecs" {
  name              = local.log_group_name
  retention_in_days = 7

  tags = local.common_tags
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = local.name_prefix

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
          region = var.aws_region
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
          region = var.aws_region
          title  = "ALB Metrics"
        }
      }
    ]
  })
}

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

```hcl
# outputs.tf
output "alb_dns_name" {
  description = "DNS name of the application load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Hosted zone ID of the application load balancer"
  value       = aws_lb.main.zone_id
}

output "ecr_repository_url" {
  description = "URL of the application ECR repository"
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

output "alb_target_group_arn" {
  description = "ARN of the Application Load Balancer target group"
  value       = aws_lb_target_group.app.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group used by ECS tasks"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_execution.arn
}

output "task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "vpc_id" {
  description = "Identifier of the application VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs used by ECS tasks and RDS"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB"
  value       = aws_subnet.public[*].id
}

output "rds_endpoint" {
  description = "Writer endpoint of the application database"
  value       = aws_db_instance.app.address
}

output "rds_identifier" {
  description = "Identifier of the application database instance"
  value       = aws_db_instance.app.id
}

output "rds_master_secret_arn" {
  description = "Secrets Manager ARN storing the database credentials"
  value       = try(aws_db_instance.app.master_user_secret[0].secret_arn, "")
}

output "route53_record_fqdn" {
  description = "FQDN of the Route 53 record pointing to the ALB"
  value       = try(aws_route53_record.app[0].fqdn, "")
}

output "aws_region" {
  description = "AWS region where the stack is deployed"
  value       = var.aws_region
}

```
