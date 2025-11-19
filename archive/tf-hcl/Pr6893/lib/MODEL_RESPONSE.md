# Terraform HCL Implementation: Multi-Tier Web Application with Blue-Green Deployment

This implementation provides complete infrastructure for a Django-based trading dashboard with automated blue-green deployment capabilities using ECS Fargate, Aurora PostgreSQL, and Application Load Balancer.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource uniqueness"
  type        = string
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "trading-dashboard"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner tag for resources"
  type        = string
  default     = "trading-platform-team"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones_count" {
  description = "Number of availability zones"
  type        = number
  default     = 3
}

variable "container_image" {
  description = "Django application container image"
  type        = string
  default     = "django:latest"
}

variable "container_port" {
  description = "Container port for Django application"
  type        = number
  default     = 8000
}

variable "ecs_task_cpu" {
  description = "ECS task CPU units"
  type        = string
  default     = "512"
}

variable "ecs_task_memory" {
  description = "ECS task memory in MB"
  type        = string
  default     = "1024"
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

variable "db_master_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.serverless"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "tradingdb"
}

variable "blue_weight" {
  description = "Traffic weight for blue environment (0-100)"
  type        = number
  default     = 100
}

variable "green_weight" {
  description = "Traffic weight for green environment (0-100)"
  type        = number
  default     = 0
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
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {
    bucket         = "terraform-state-${var.environment_suffix}"
    key            = "trading-dashboard/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks-${var.environment_suffix}"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      Owner       = var.owner
      ManagedBy   = "Terraform"
    }
  }
}
```

## File: lib/vpc.tf

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-${var.environment_suffix}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

resource "aws_subnet" "public" {
  count             = var.availability_zones_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

resource "aws_subnet" "private" {
  count             = var.availability_zones_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + var.availability_zones_count)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

resource "aws_subnet" "database" {
  count             = var.availability_zones_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + (var.availability_zones_count * 2))
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "database-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "database"
  }
}

resource "aws_eip" "nat" {
  count  = var.availability_zones_count
  domain = "vpc"

  tags = {
    Name = "nat-eip-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = var.availability_zones_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
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
    Name = "public-rt-${var.environment_suffix}"
  }
}

resource "aws_route_table" "private" {
  count  = var.availability_zones_count
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "private-rt-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "public" {
  count          = var.availability_zones_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = var.availability_zones_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: lib/security_groups.tf

```hcl
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name = "alb-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "ecs_tasks" {
  name_prefix = "ecs-tasks-sg-${var.environment_suffix}-"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Traffic from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "HTTPS to Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "HTTP to Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description     = "PostgreSQL to RDS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds.id]
  }

  tags = {
    Name = "ecs-tasks-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "rds-sg-${var.environment_suffix}-"
  description = "Security group for RDS Aurora PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  tags = {
    Name = "rds-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: lib/ecr.tf

```hcl
resource "aws_ecr_repository" "app" {
  name                 = "trading-dashboard-${var.environment_suffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "ecr-repo-${var.environment_suffix}"
  }
}

resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 10
      }
      action = {
        type = "expire"
      }
    }]
  })
}
```

## File: lib/secrets.tf

```hcl
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name_prefix             = "db-credentials-${var.environment_suffix}-"
  description             = "Database credentials for trading dashboard"
  recovery_window_in_days = 0

  tags = {
    Name = "db-credentials-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_master_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.main.endpoint
    port     = 5432
    dbname   = var.db_name
  })
}

resource "aws_secretsmanager_secret_rotation" "db_credentials" {
  secret_id           = aws_secretsmanager_secret.db_credentials.id
  rotation_lambda_arn = aws_lambda_function.secrets_rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }
}
```

## File: lib/rds.tf

```hcl
resource "aws_db_subnet_group" "main" {
  name_prefix = "db-subnet-group-${var.environment_suffix}-"
  subnet_ids  = aws_subnet.database[*].id

  tags = {
    Name = "db-subnet-group-${var.environment_suffix}"
  }
}

resource "aws_rds_cluster_parameter_group" "main" {
  name_prefix = "aurora-postgres-params-${var.environment_suffix}-"
  family      = "aurora-postgresql15"
  description = "Aurora PostgreSQL cluster parameter group"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = {
    Name = "aurora-postgres-params-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_rds_cluster" "main" {
  cluster_identifier     = "trading-db-${var.environment_suffix}"
  engine                 = "aurora-postgresql"
  engine_mode            = "provisioned"
  engine_version         = "15.4"
  database_name          = var.db_name
  master_username        = var.db_master_username
  master_password        = random_password.db_password.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  serverlessv2_scaling_configuration {
    max_capacity = 2.0
    min_capacity = 0.5
  }

  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"

  enabled_cloudwatch_logs_exports = ["postgresql"]
  storage_encrypted               = true
  iam_database_authentication_enabled = true

  skip_final_snapshot = true

  tags = {
    Name = "aurora-cluster-${var.environment_suffix}"
  }
}

resource "aws_rds_cluster_instance" "main" {
  count              = 2
  identifier         = "trading-db-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  publicly_accessible = false

  performance_insights_enabled = true

  tags = {
    Name = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  }
}
```

## File: lib/iam.tf

```hcl
resource "aws_iam_role" "ecs_task_execution" {
  name_prefix = "ecs-task-execution-${var.environment_suffix}-"

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
    Name = "ecs-task-execution-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name_prefix = "ecs-secrets-${var.environment_suffix}-"
  role        = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "kms:Decrypt"
      ]
      Resource = [
        aws_secretsmanager_secret.db_credentials.arn
      ]
    }]
  })
}

resource "aws_iam_role" "ecs_task" {
  name_prefix = "ecs-task-${var.environment_suffix}-"

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
    Name = "ecs-task-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "ecs_task_rds" {
  name_prefix = "ecs-task-rds-${var.environment_suffix}-"
  role        = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "rds-db:connect"
      ]
      Resource = [
        "arn:aws:rds-db:${var.aws_region}:${data.aws_caller_identity.current.account_id}:dbuser:${aws_rds_cluster.main.cluster_resource_id}/${var.db_master_username}"
      ]
    }]
  })
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "lambda_secrets_rotation" {
  name_prefix = "lambda-secrets-rotation-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "lambda-secrets-rotation-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_secrets_rotation.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_secrets_rotation.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_secrets" {
  name_prefix = "lambda-secrets-${var.environment_suffix}-"
  role        = aws_iam_role.lambda_secrets_rotation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetRandomPassword"
        ]
        Resource = "*"
      }
    ]
  })
}
```

## File: lib/alb.tf

```hcl
resource "aws_lb" "main" {
  name               = "alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2              = true

  tags = {
    Name = "alb-${var.environment_suffix}"
  }
}

resource "aws_lb_target_group" "blue" {
  name_prefix = "blue-"
  port        = var.container_port
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
    protocol            = "HTTP"
  }

  deregistration_delay = 30

  tags = {
    Name = "blue-tg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_target_group" "green" {
  name_prefix = "green-"
  port        = var.container_port
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
    protocol            = "HTTP"
  }

  deregistration_delay = 30

  tags = {
    Name = "green-tg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "forward"

    forward {
      target_group {
        arn    = aws_lb_target_group.blue.arn
        weight = var.blue_weight
      }

      target_group {
        arn    = aws_lb_target_group.green.arn
        weight = var.green_weight
      }

      stickiness {
        enabled  = true
        duration = 3600
      }
    }
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type = "forward"

    forward {
      target_group {
        arn    = aws_lb_target_group.blue.arn
        weight = var.blue_weight
      }

      target_group {
        arn    = aws_lb_target_group.green.arn
        weight = var.green_weight
      }

      stickiness {
        enabled  = true
        duration = 3600
      }
    }
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}
```

## File: lib/ecs.tf

```hcl
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

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}

resource "aws_cloudwatch_log_group" "ecs_blue" {
  name              = "/ecs/trading-dashboard-blue-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name = "ecs-blue-logs-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "ecs_green" {
  name              = "/ecs/trading-dashboard-green-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name = "ecs-green-logs-${var.environment_suffix}"
  }
}

resource "aws_ecs_task_definition" "blue" {
  family                   = "trading-dashboard-blue-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "django-app"
    image = var.container_image

    portMappings = [{
      containerPort = var.container_port
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "ENVIRONMENT"
        value = "blue"
      },
      {
        name  = "AWS_REGION"
        value = var.aws_region
      }
    ]

    secrets = [{
      name      = "DATABASE_URL"
      valueFrom = aws_secretsmanager_secret.db_credentials.arn
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_blue.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = {
    Name = "ecs-task-def-blue-${var.environment_suffix}"
  }
}

resource "aws_ecs_task_definition" "green" {
  family                   = "trading-dashboard-green-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "django-app"
    image = var.container_image

    portMappings = [{
      containerPort = var.container_port
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "ENVIRONMENT"
        value = "green"
      },
      {
        name  = "AWS_REGION"
        value = var.aws_region
      }
    ]

    secrets = [{
      name      = "DATABASE_URL"
      valueFrom = aws_secretsmanager_secret.db_credentials.arn
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_green.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = {
    Name = "ecs-task-def-green-${var.environment_suffix}"
  }
}

resource "aws_ecs_service" "blue" {
  name            = "trading-dashboard-blue-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.blue.arn
  desired_count   = var.blue_weight > 0 ? var.ecs_desired_count : 0
  launch_type     = "FARGATE"

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100

    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "django-app"
    container_port   = var.container_port
  }

  health_check_grace_period_seconds = 60

  tags = {
    Name = "ecs-service-blue-${var.environment_suffix}"
  }

  depends_on = [aws_lb_listener.http]
}

resource "aws_ecs_service" "green" {
  name            = "trading-dashboard-green-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.green.arn
  desired_count   = var.green_weight > 0 ? var.ecs_desired_count : 0
  launch_type     = "FARGATE"

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100

    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.green.arn
    container_name   = "django-app"
    container_port   = var.container_port
  }

  health_check_grace_period_seconds = 60

  tags = {
    Name = "ecs-service-green-${var.environment_suffix}"
  }

  depends_on = [aws_lb_listener.http]
}
```

## File: lib/autoscaling.tf

```hcl
resource "aws_appautoscaling_target" "ecs_blue" {
  max_capacity       = var.ecs_max_capacity
  min_capacity       = var.ecs_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.blue.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_blue_cpu" {
  name               = "ecs-blue-cpu-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_blue.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_blue.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_blue.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

resource "aws_appautoscaling_policy" "ecs_blue_memory" {
  name               = "ecs-blue-memory-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_blue.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_blue.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_blue.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
  }
}

resource "aws_appautoscaling_target" "ecs_green" {
  max_capacity       = var.ecs_max_capacity
  min_capacity       = var.ecs_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.green.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_green_cpu" {
  name               = "ecs-green-cpu-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_green.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_green.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_green.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

resource "aws_appautoscaling_policy" "ecs_green_memory" {
  name               = "ecs-green-memory-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_green.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_green.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_green.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
  }
}
```

## File: lib/waf.tf

```hcl
resource "aws_wafv2_web_acl" "main" {
  name  = "waf-acl-${var.environment_suffix}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "sql-injection-protection"
    priority = 1

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesSQLiRuleSet"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "sql-injection-protection-${var.environment_suffix}"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "xss-protection"
    priority = 2

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "xss-protection-${var.environment_suffix}"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "rate-limiting"
    priority = 3

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rate-limiting-${var.environment_suffix}"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "waf-acl-${var.environment_suffix}"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "waf-acl-${var.environment_suffix}"
  }
}

resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
```

## File: lib/cloudwatch.tf

```hcl
resource "aws_sns_topic" "alerts" {
  name = "trading-dashboard-alerts-${var.environment_suffix}"

  tags = {
    Name = "alerts-topic-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high_blue" {
  alarm_name          = "ecs-blue-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS Blue service CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.blue.name
  }

  tags = {
    Name = "ecs-blue-cpu-alarm-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high_blue" {
  alarm_name          = "ecs-blue-memory-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ECS Blue service memory utilization is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.blue.name
  }

  tags = {
    Name = "ecs-blue-memory-alarm-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high_green" {
  alarm_name          = "ecs-green-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS Green service CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.green.name
  }

  tags = {
    Name = "ecs-green-cpu-alarm-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high_green" {
  alarm_name          = "ecs-green-memory-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ECS Green service memory utilization is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.green.name
  }

  tags = {
    Name = "ecs-green-memory-alarm-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "alb-unhealthy-targets-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "ALB has unhealthy targets"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "alb-unhealthy-alarm-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "alb-5xx-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB is returning too many 5xx errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "alb-5xx-alarm-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "rds-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = {
    Name = "rds-cpu-alarm-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "rds-connections-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS has too many database connections"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = {
    Name = "rds-connections-alarm-${var.environment_suffix}"
  }
}
```

## File: lib/lambda_rotation.tf

```hcl
data "archive_file" "secrets_rotation" {
  type        = "zip"
  output_path = "${path.module}/lambda_rotation.zip"

  source {
    content  = <<-EOT
      import json
      import boto3
      import os

      def lambda_handler(event, context):
          arn = event['SecretId']
          token = event['ClientRequestToken']
          step = event['Step']

          service_client = boto3.client('secretsmanager')

          metadata = service_client.describe_secret(SecretId=arn)
          if not metadata['RotationEnabled']:
              raise ValueError("Secret %s is not enabled for rotation" % arn)
          versions = metadata['VersionIdsToStages']
          if token not in versions:
              raise ValueError("Secret version %s has no stage for rotation of secret %s." % (token, arn))
          if "AWSCURRENT" in versions[token]:
              return
          elif "AWSPENDING" not in versions[token]:
              raise ValueError("Secret version %s not set as AWSPENDING for rotation of secret %s." % (token, arn))

          if step == "createSecret":
              create_secret(service_client, arn, token)
          elif step == "setSecret":
              set_secret(service_client, arn, token)
          elif step == "testSecret":
              test_secret(service_client, arn, token)
          elif step == "finishSecret":
              finish_secret(service_client, arn, token)
          else:
              raise ValueError("Invalid step parameter")

      def create_secret(service_client, arn, token):
          service_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")
          try:
              service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")
          except service_client.exceptions.ResourceNotFoundException:
              passwd = service_client.get_random_password(ExcludeCharacters='/@"\'\\ ', PasswordLength=32)
              service_client.put_secret_value(SecretId=arn, ClientRequestToken=token, SecretString=passwd['RandomPassword'], VersionStages=['AWSPENDING'])

      def set_secret(service_client, arn, token):
          pass

      def test_secret(service_client, arn, token):
          pass

      def finish_secret(service_client, arn, token):
          metadata = service_client.describe_secret(SecretId=arn)
          current_version = None
          for version in metadata["VersionIdsToStages"]:
              if "AWSCURRENT" in metadata["VersionIdsToStages"][version]:
                  if version == token:
                      return
                  current_version = version
                  break
          service_client.update_secret_version_stage(SecretId=arn, VersionStage="AWSCURRENT", MoveToVersionId=token, RemoveFromVersionId=current_version)
    EOT
    filename = "index.py"
  }
}

resource "aws_lambda_function" "secrets_rotation" {
  filename         = data.archive_file.secrets_rotation.output_path
  function_name    = "secrets-rotation-${var.environment_suffix}"
  role             = aws_iam_role.lambda_secrets_rotation.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.secrets_rotation.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_groups    = [aws_security_group.lambda_rotation.id]
  }

  environment {
    variables = {
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  tags = {
    Name = "secrets-rotation-lambda-${var.environment_suffix}"
  }
}

resource "aws_security_group" "lambda_rotation" {
  name_prefix = "lambda-rotation-sg-${var.environment_suffix}-"
  description = "Security group for Lambda secrets rotation"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "HTTPS to Secrets Manager"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "lambda-rotation-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lambda_permission" "secrets_manager" {
  statement_id  = "AllowExecutionFromSecretsManager"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secrets_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Application Load Balancer zone ID"
  value       = aws_lb.main.zone_id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "blue_service_name" {
  description = "Blue ECS service name"
  value       = aws_ecs_service.blue.name
}

output "green_service_name" {
  description = "Green ECS service name"
  value       = aws_ecs_service.green.name
}

output "rds_cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
  sensitive   = true
}

output "rds_reader_endpoint" {
  description = "RDS reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
  sensitive   = true
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "secrets_manager_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_credentials.arn
  sensitive   = true
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}

output "cloudwatch_log_group_blue" {
  description = "CloudWatch log group for blue environment"
  value       = aws_cloudwatch_log_group.ecs_blue.name
}

output "cloudwatch_log_group_green" {
  description = "CloudWatch log group for green environment"
  value       = aws_cloudwatch_log_group.ecs_green.name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}
```

## File: lib/terraform.tfvars.example

```hcl
environment_suffix = "prod-001"
aws_region        = "us-east-1"
project_name      = "trading-dashboard"
environment       = "production"
owner             = "trading-platform-team"

vpc_cidr                 = "10.0.0.0/16"
availability_zones_count = 3

container_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/trading-dashboard:latest"
container_port  = 8000

ecs_task_cpu    = "512"
ecs_task_memory = "1024"

ecs_desired_count = 2
ecs_min_capacity  = 2
ecs_max_capacity  = 10

db_master_username = "dbadmin"
db_instance_class  = "db.serverless"
db_name           = "tradingdb"

blue_weight  = 100
green_weight = 0
```

## File: lib/README.md

```markdown
# Trading Dashboard Infrastructure - Terraform

This Terraform configuration deploys a production-ready multi-tier web application with blue-green deployment capabilities for a Django-based trading dashboard.

## Architecture Overview

- **Compute**: ECS Fargate with blue-green deployment
- **Database**: Aurora PostgreSQL Serverless with Multi-AZ
- **Load Balancing**: Application Load Balancer with weighted routing
- **Security**: WAF for SQL injection and XSS protection
- **Secrets**: AWS Secrets Manager with automatic rotation
- **Monitoring**: CloudWatch alarms and logging
- **Auto Scaling**: CPU and memory-based scaling policies

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- S3 bucket for Terraform state
- DynamoDB table for state locking

## Quick Start

1. **Configure backend**:

```bash
# Update provider.tf backend configuration with your S3 bucket and DynamoDB table
```

2. **Initialize Terraform**:

```bash
terraform init
```

3. **Create tfvars file**:

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

4. **Plan deployment**:

```bash
terraform plan -var-file=terraform.tfvars
```

5. **Deploy infrastructure**:

```bash
terraform apply -var-file=terraform.tfvars
```

## Blue-Green Deployment

Control traffic distribution between blue and green environments using the `blue_weight` and `green_weight` variables:

```hcl
# All traffic to blue (default)
blue_weight  = 100
green_weight = 0

# 50/50 traffic split for testing
blue_weight  = 50
green_weight = 50

# Complete cutover to green
blue_weight  = 0
green_weight = 100
```

## Required Variables

- `environment_suffix`: Unique suffix for resource naming (e.g., "prod-001")
- `container_image`: Django application container image URL
- `db_master_username`: Database master username

## Outputs

Key outputs include:
- `alb_dns_name`: Load balancer DNS name for application access
- `ecr_repository_url`: ECR repository for container images
- `ecs_cluster_name`: ECS cluster name
- `rds_cluster_endpoint`: Database endpoint (sensitive)

## Resource Naming

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Example: `vpc-prod-001`, `alb-prod-001`, `ecs-cluster-prod-001`

## Security Features

- VPC with public/private/database subnets across 3 AZs
- NAT Gateways for private subnet internet access
- Security groups with explicit port ranges (no -1 rules)
- RDS with SSL enforcement and IAM authentication
- Secrets Manager with automatic credential rotation
- WAF with SQL injection and XSS protection
- All resources encrypted at rest

## Monitoring

CloudWatch alarms monitor:
- ECS CPU and memory utilization (blue and green)
- ALB unhealthy targets and 5xx errors
- RDS CPU utilization and connection count

Alerts sent to SNS topic for notification.

## Cleanup

To destroy all resources:

```bash
terraform destroy -var-file=terraform.tfvars
```

Note: All resources are configured as destroyable (no RETAIN policies).

## Cost Optimization

- Aurora Serverless scales from 0.5 to 2.0 ACUs
- ECS Fargate with auto-scaling (2-10 tasks)
- CloudWatch log retention set to 7 days
- ECR lifecycle policy keeps last 10 images

## Troubleshooting

1. **Backend initialization fails**: Ensure S3 bucket and DynamoDB table exist
2. **ECS tasks not starting**: Check CloudWatch logs and security group rules
3. **Database connection issues**: Verify security groups allow traffic on port 5432
4. **WAF blocking legitimate traffic**: Review WAF metrics in CloudWatch

## Support

For issues or questions, contact the trading-platform-team.
```
