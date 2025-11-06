# ECS Fargate Containerized Microservices - Terraform Implementation

I'll provide a complete Terraform HCL implementation for deploying containerized microservices on AWS ECS Fargate with auto-scaling, load balancing, and service discovery.

## File: variables.tf

```hcl
variable "environmentSuffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "fraud_detection_cpu" {
  description = "CPU units for fraud detection service"
  type        = number
  default     = 1024
}

variable "fraud_detection_memory" {
  description = "Memory for fraud detection service"
  type        = number
  default     = 2048
}

variable "transaction_processor_cpu" {
  description = "CPU units for transaction processor service"
  type        = number
  default     = 1024
}

variable "transaction_processor_memory" {
  description = "Memory for transaction processor service"
  type        = number
  default     = 2048
}

variable "environment" {
  description = "Environment tag"
  type        = string
  default     = "production"
}

variable "project" {
  description = "Project tag"
  type        = string
  default     = "fraud-detection"
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
      Environment = var.environment
      Project     = var.project
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}
```

## File: vpc.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-${var.environmentSuffix}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environmentSuffix}"
  }
}

resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}-${var.environmentSuffix}"
    Type = "public"
  }
}

resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}-${var.environmentSuffix}"
    Type = "private"
  }
}

resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"

  tags = {
    Name = "nat-eip-${count.index + 1}-${var.environmentSuffix}"
  }
}

resource "aws_nat_gateway" "main" {
  count = length(var.public_subnet_cidrs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${count.index + 1}-${var.environmentSuffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-rt-${var.environmentSuffix}"
  }
}

resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "private-rt-${count.index + 1}-${var.environmentSuffix}"
  }
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

## File: security_groups.tf

```hcl
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.environmentSuffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "alb-sg-${var.environmentSuffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "ecs_tasks" {
  name_prefix = "ecs-tasks-sg-${var.environmentSuffix}-"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow traffic from ALB on port 8080"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "Allow inter-service communication"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    self        = true
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ecs-tasks-sg-${var.environmentSuffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: alb.tf

```hcl
resource "aws_lb" "main" {
  name               = "alb-${var.environmentSuffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "alb-${var.environmentSuffix}"
  }
}

resource "aws_lb_target_group" "fraud_detection" {
  name        = "fraud-detection-tg-${var.environmentSuffix}"
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
    matcher             = "200"
    protocol            = "HTTP"
  }

  deregistration_delay = 30

  tags = {
    Name = "fraud-detection-tg-${var.environmentSuffix}"
  }
}

resource "aws_lb_target_group" "transaction_processor" {
  name        = "transaction-processor-tg-${var.environmentSuffix}"
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
    matcher             = "200"
    protocol            = "HTTP"
  }

  deregistration_delay = 30

  tags = {
    Name = "transaction-processor-tg-${var.environmentSuffix}"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.fraud_detection.arn
  }
}

resource "aws_lb_listener_rule" "fraud_detection" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.fraud_detection.arn
  }

  condition {
    path_pattern {
      values = ["/fraud-detection/*"]
    }
  }
}

resource "aws_lb_listener_rule" "transaction_processor" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.transaction_processor.arn
  }

  condition {
    path_pattern {
      values = ["/transaction-processor/*"]
    }
  }
}
```

## File: ecr.tf

```hcl
resource "aws_ecr_repository" "fraud_detection" {
  name                 = "fraud-detection-${var.environmentSuffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "fraud-detection-ecr-${var.environmentSuffix}"
  }
}

resource "aws_ecr_lifecycle_policy" "fraud_detection" {
  repository = aws_ecr_repository.fraud_detection.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep only last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecr_repository" "transaction_processor" {
  name                 = "transaction-processor-${var.environmentSuffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "transaction-processor-ecr-${var.environmentSuffix}"
  }
}

resource "aws_ecr_lifecycle_policy" "transaction_processor" {
  repository = aws_ecr_repository.transaction_processor.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep only last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = {
        type = "expire"
      }
    }]
  })
}
```

## File: iam.tf

```hcl
# Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "ecs-task-execution-role-${var.environmentSuffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "ecs-task-execution-role-${var.environmentSuffix}"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_ecr" {
  name = "ecr-access-${var.environmentSuffix}"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ]
      Resource = "*"
    }]
  })
}

# Task Role for Fraud Detection
resource "aws_iam_role" "fraud_detection_task" {
  name = "fraud-detection-task-role-${var.environmentSuffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "fraud-detection-task-role-${var.environmentSuffix}"
  }
}

resource "aws_iam_role_policy" "fraud_detection_s3_dynamodb" {
  name = "s3-dynamodb-access-${var.environmentSuffix}"
  role = aws_iam_role.fraud_detection_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:*:table/*"
        ]
      }
    ]
  })
}

# Task Role for Transaction Processor
resource "aws_iam_role" "transaction_processor_task" {
  name = "transaction-processor-task-role-${var.environmentSuffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "transaction-processor-task-role-${var.environmentSuffix}"
  }
}

resource "aws_iam_role_policy" "transaction_processor_s3_dynamodb" {
  name = "s3-dynamodb-access-${var.environmentSuffix}"
  role = aws_iam_role.transaction_processor_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:*:table/*"
        ]
      }
    ]
  })
}
```

## File: cloudwatch.tf

```hcl
resource "aws_cloudwatch_log_group" "fraud_detection" {
  name              = "/ecs/fraud-detection-${var.environmentSuffix}"
  retention_in_days = 7

  tags = {
    Name = "fraud-detection-logs-${var.environmentSuffix}"
  }
}

resource "aws_cloudwatch_log_group" "transaction_processor" {
  name              = "/ecs/transaction-processor-${var.environmentSuffix}"
  retention_in_days = 7

  tags = {
    Name = "transaction-processor-logs-${var.environmentSuffix}"
  }
}
```

## File: service_discovery.tf

```hcl
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "local-${var.environmentSuffix}"
  description = "Private DNS namespace for service discovery"
  vpc         = aws_vpc.main.id

  tags = {
    Name = "service-discovery-namespace-${var.environmentSuffix}"
  }
}

resource "aws_service_discovery_service" "fraud_detection" {
  name = "fraud-detection"

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
    Name = "fraud-detection-service-discovery-${var.environmentSuffix}"
  }
}

resource "aws_service_discovery_service" "transaction_processor" {
  name = "transaction-processor"

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
    Name = "transaction-processor-service-discovery-${var.environmentSuffix}"
  }
}
```

## File: ecs.tf

```hcl
resource "aws_ecs_cluster" "main" {
  name = "ecs-cluster-${var.environmentSuffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "ecs-cluster-${var.environmentSuffix}"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }

  default_capacity_provider_strategy {
    weight            = 0
    capacity_provider = "FARGATE_SPOT"
  }
}

# Fraud Detection Task Definition
resource "aws_ecs_task_definition" "fraud_detection" {
  family                   = "fraud-detection-${var.environmentSuffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.fraud_detection_cpu
  memory                   = var.fraud_detection_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.fraud_detection_task.arn

  container_definitions = jsonencode([{
    name      = "fraud-detection"
    image     = "${aws_ecr_repository.fraud_detection.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = 8080
      hostPort      = 8080
      protocol      = "tcp"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.fraud_detection.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    environment = [
      {
        name  = "SERVICE_NAME"
        value = "fraud-detection"
      },
      {
        name  = "ENVIRONMENT"
        value = var.environment
      }
    ]
  }])

  tags = {
    Name = "fraud-detection-task-${var.environmentSuffix}"
  }
}

# Transaction Processor Task Definition
resource "aws_ecs_task_definition" "transaction_processor" {
  family                   = "transaction-processor-${var.environmentSuffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.transaction_processor_cpu
  memory                   = var.transaction_processor_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.transaction_processor_task.arn

  container_definitions = jsonencode([{
    name      = "transaction-processor"
    image     = "${aws_ecr_repository.transaction_processor.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = 8080
      hostPort      = 8080
      protocol      = "tcp"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.transaction_processor.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    environment = [
      {
        name  = "SERVICE_NAME"
        value = "transaction-processor"
      },
      {
        name  = "ENVIRONMENT"
        value = var.environment
      }
    ]
  }])

  tags = {
    Name = "transaction-processor-task-${var.environmentSuffix}"
  }
}

# Fraud Detection Service
resource "aws_ecs_service" "fraud_detection" {
  name            = "fraud-detection"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.fraud_detection.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.fraud_detection.arn
    container_name   = "fraud-detection"
    container_port   = 8080
  }

  service_registries {
    registry_arn = aws_service_discovery_service.fraud_detection.arn
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_task_execution
  ]

  tags = {
    Name = "fraud-detection-service-${var.environmentSuffix}"
  }
}

# Transaction Processor Service
resource "aws_ecs_service" "transaction_processor" {
  name            = "transaction-processor"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.transaction_processor.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.transaction_processor.arn
    container_name   = "transaction-processor"
    container_port   = 8080
  }

  service_registries {
    registry_arn = aws_service_discovery_service.transaction_processor.arn
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_task_execution
  ]

  tags = {
    Name = "transaction-processor-service-${var.environmentSuffix}"
  }
}
```

## File: autoscaling.tf

```hcl
# Auto Scaling Target - Fraud Detection
resource "aws_appautoscaling_target" "fraud_detection" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.fraud_detection.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU Scaling Policy - Fraud Detection
resource "aws_appautoscaling_policy" "fraud_detection_cpu" {
  name               = "fraud-detection-cpu-scaling-${var.environmentSuffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.fraud_detection.resource_id
  scalable_dimension = aws_appautoscaling_target.fraud_detection.scalable_dimension
  service_namespace  = aws_appautoscaling_target.fraud_detection.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Memory Scaling Policy - Fraud Detection
resource "aws_appautoscaling_policy" "fraud_detection_memory" {
  name               = "fraud-detection-memory-scaling-${var.environmentSuffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.fraud_detection.resource_id
  scalable_dimension = aws_appautoscaling_target.fraud_detection.scalable_dimension
  service_namespace  = aws_appautoscaling_target.fraud_detection.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Target - Transaction Processor
resource "aws_appautoscaling_target" "transaction_processor" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.transaction_processor.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU Scaling Policy - Transaction Processor
resource "aws_appautoscaling_policy" "transaction_processor_cpu" {
  name               = "transaction-processor-cpu-scaling-${var.environmentSuffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.transaction_processor.resource_id
  scalable_dimension = aws_appautoscaling_target.transaction_processor.scalable_dimension
  service_namespace  = aws_appautoscaling_target.transaction_processor.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Memory Scaling Policy - Transaction Processor
resource "aws_appautoscaling_policy" "transaction_processor_memory" {
  name               = "transaction-processor-memory-scaling-${var.environmentSuffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.transaction_processor.resource_id
  scalable_dimension = aws_appautoscaling_target.transaction_processor.scalable_dimension
  service_namespace  = aws_appautoscaling_target.transaction_processor.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

## File: outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "fraud_detection_service_name" {
  description = "Name of the fraud detection service"
  value       = aws_ecs_service.fraud_detection.name
}

output "transaction_processor_service_name" {
  description = "Name of the transaction processor service"
  value       = aws_ecs_service.transaction_processor.name
}

output "fraud_detection_ecr_url" {
  description = "URL of fraud detection ECR repository"
  value       = aws_ecr_repository.fraud_detection.repository_url
}

output "transaction_processor_ecr_url" {
  description = "URL of transaction processor ECR repository"
  value       = aws_ecr_repository.transaction_processor.repository_url
}

output "service_discovery_namespace" {
  description = "Service discovery namespace"
  value       = aws_service_discovery_private_dns_namespace.main.name
}

output "fraud_detection_endpoint" {
  description = "Fraud detection service endpoint via ALB"
  value       = "http://${aws_lb.main.dns_name}/fraud-detection/"
}

output "transaction_processor_endpoint" {
  description = "Transaction processor service endpoint via ALB"
  value       = "http://${aws_lb.main.dns_name}/transaction-processor/"
}
```

## File: terraform.tfvars.example

```hcl
environmentSuffix              = "dev"
aws_region                     = "us-east-1"
vpc_cidr                       = "10.0.0.0/16"
public_subnet_cidrs            = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs           = ["10.0.10.0/24", "10.0.20.0/24"]
fraud_detection_cpu            = 1024
fraud_detection_memory         = 2048
transaction_processor_cpu      = 1024
transaction_processor_memory   = 2048
environment                    = "production"
project                        = "fraud-detection"
```
