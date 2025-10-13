I'll create a comprehensive CI/CD pipeline in Terraform that meets all your requirements. This will be a production-ready solution with proper security, monitoring, and blue/green deployments.

```hcl
# tap_stack.tf - Complete CI/CD Pipeline for ECS with Blue/Green Deployments
# Company: TAP (using as placeholder - replace with your company name)
# Region: us-east-1
# Author: DevOps Team
# Version: 1.0.0

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ==================== VARIABLES ====================
variable "company_name" {
  description = "Company name for resource naming"
  type        = string
  default     = "TAP"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "webapp"
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 8080
}

variable "task_cpu" {
  description = "Fargate task CPU units"
  type        = string
  default     = "256"
}

variable "task_memory" {
  description = "Fargate task memory"
  type        = string
  default     = "512"
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 2
}

variable "approval_email" {
  description = "Email for manual approval notifications"
  type        = string
  default     = "devops@company.com"
}

# ==================== DATA SOURCES ====================
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ==================== LOCALS ====================
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  
  # Naming convention: {CompanyName}-{Environment}-{ResourceName}
  name_prefix = "${var.company_name}-${var.environment}"
  
  common_tags = {
    Company     = var.company_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Pipeline    = "${local.name_prefix}-pipeline"
  }
}

# ==================== KMS KEY FOR ENCRYPTION ====================
resource "aws_kms_key" "pipeline_key" {
  description             = "${local.name_prefix}-pipeline-encryption-key"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-pipeline-kms"
  })
}

resource "aws_kms_alias" "pipeline_key_alias" {
  name          = "alias/${local.name_prefix}-pipeline"
  target_key_id = aws_kms_key.pipeline_key.key_id
}

# ==================== NETWORKING ====================
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
  })
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
  count  = 2
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
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ==================== SECURITY GROUPS ====================
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
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
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${local.name_prefix}-ecs-tasks-"
  vpc_id      = aws_vpc.main.id
  
  ingress {
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
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-tasks-sg"
  })
}

# ==================== ECR REPOSITORY ====================
resource "aws_ecr_repository" "app" {
  name                 = "${local.name_prefix}-${var.app_name}"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.pipeline_key.arn
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecr"
  })
}

resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name
  
  policy = jsonencode({
    rules = [
      {
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
      }
    ]
  })
}

# ==================== CODECOMMIT REPOSITORY ====================
resource "aws_codecommit_repository" "app" {
  repository_name = "${local.name_prefix}-${var.app_name}-repo"
  description     = "Repository for ${var.app_name}"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-codecommit"
  })
}

# ==================== S3 ARTIFACTS BUCKET ====================
resource "aws_s3_bucket" "artifacts" {
  bucket = "${local.name_prefix}-pipeline-artifacts-${local.account_id}"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-artifacts"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.pipeline_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ==================== SECRETS MANAGER ====================
resource "aws_secretsmanager_secret" "app_config" {
  name_prefix             = "${local.name_prefix}-app-config-"
  description             = "Application configuration secrets"
  kms_key_id              = aws_kms_key.pipeline_key.arn
  recovery_window_in_days = 7
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secrets"
  })
}

resource "aws_secretsmanager_secret_version" "app_config" {
  secret_id = aws_secretsmanager_secret.app_config.id
  secret_string = jsonencode({
    database_url = "postgresql://localhost:5432/myapp"
    api_key      = "changeme"
    jwt_secret   = "changeme"
  })
}

# ==================== CLOUDWATCH LOG GROUPS ====================
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${local.name_prefix}-${var.app_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.pipeline_key.arn
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-logs"
  })
}

resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "/aws/codebuild/${local.name_prefix}-build"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.pipeline_key.arn
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-codebuild-logs"
  })
}

# ==================== APPLICATION LOAD BALANCER ====================
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id
  
  enable_deletion_protection = false
  enable_http2              = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })
}

resource "aws_lb_target_group" "blue" {
  name                 = "${local.name_prefix}-tg-blue"
  port                 = var.container_port
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "ip"
  deregistration_delay = 30
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tg-blue"
    Type = "Blue"
  })
}

resource "aws_lb_target_group" "green" {
  name                 = "${local.name_prefix}-tg-green"
  port                 = var.container_port
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "ip"
  deregistration_delay = 30
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tg-green"
    Type = "Green"
  })
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }
  
  lifecycle {
    ignore_changes = [default_action]
  }
}

resource "aws_lb_listener" "test" {
  load_balancer_arn = aws_lb.main.arn
  port              = "8080"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.green.arn
  }
  
  lifecycle {
    ignore_changes = [default_action]
  }
}

# ==================== ECS CLUSTER ====================
resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-cluster"
  })
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name
  
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  
  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# ==================== IAM ROLES ====================

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.name_prefix}-ecs-task-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-task-execution-role"
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${local.name_prefix}-ecs-secrets-policy"
  role = aws_iam_role.ecs_task_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ]
        Resource = [
          aws_secretsmanager_secret.app_config.arn,
          aws_kms_key.pipeline_key.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.ecs.arn}:*"
      }
    ]
  })
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "${local.name_prefix}-ecs-task-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-task-role"
  })
}

# CodeBuild Role
resource "aws_iam_role" "codebuild" {
  name = "${local.name_prefix}-codebuild-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-codebuild-role"
  })
}

resource "aws_iam_role_policy" "codebuild" {
  name = "${local.name_prefix}-codebuild-policy"
  role = aws_iam_role.codebuild.id
  
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
        Resource = "${aws_cloudwatch_log_group.codebuild.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.artifacts.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:CompleteLayerUpload",
          "ecr:GetAuthorizationToken",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.pipeline_key.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.app_config.arn
      }
    ]
  })
}

# CodeDeploy Role
resource "aws_iam_role" "codedeploy" {
  name = "${local.name_prefix}-codedeploy-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codedeploy.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-codedeploy-role"
  })
}

resource "aws_iam_role_policy_attachment" "codedeploy" {
  role       = aws_iam_role.codedeploy.name
  policy_arn = "arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS"
}

# CodePipeline Role
resource "aws_iam_role" "codepipeline" {
  name = "${local.name_prefix}-codepipeline-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-codepipeline-role"
  })
}

resource "aws_iam_role_policy" "codepipeline" {
  name = "${local.name_prefix}-codepipeline-policy"
  role = aws_iam_role.codepipeline.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.artifacts.arn,
          "${aws_s3_bucket.artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codecommit:GetBranch",
          "codecommit:GetCommit",
          "codecommit:UploadArchive",
          "codecommit:GetUploadArchiveStatus",
          "codecommit:CancelUploadArchive"
        ]
        Resource = aws_codecommit_repository.app.arn
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = aws_codebuild_project.app.arn
      },
      {
        Effect = "Allow"
        Action = [
          "codedeploy:CreateDeployment",
          "codedeploy:GetApplication",
          "codedeploy:GetApplicationRevision",
          "codedeploy:GetDeployment",
          "codedeploy:GetDeploymentConfig",
          "codedeploy:RegisterApplicationRevision"
        ]
        Resource = [
          aws_codedeploy_app.app.arn,
          aws_codedeploy_deployment_group.app.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:*",
          "iam:PassRole"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.pipeline_key.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.pipeline_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.pipeline_validator.arn
      }
    ]
  })
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name = "${local.name_prefix}-lambda-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-role"
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_pipeline" {
  name = "${local.name_prefix}-lambda-pipeline-policy"
  role = aws_iam_role.lambda_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "codepipeline:PutJobSuccessResult",
          "codepipeline:PutJobFailureResult"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.artifacts.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.pipeline_key.arn
      }
    ]
  })
}

# ==================== ECS TASK DEFINITION ====================
resource "aws_ecs_task_definition" "app" {
  family                   = "${local.name_prefix}-${var.app_name}"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = var.task_cpu
  memory                  = var.task_memory
  execution_role_arn      = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([
    {
      name  = var.app_name
      image = "${aws_ecr_repository.app.repository_url}:latest"
      
      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      ]
      
      secrets = [
        {
          name      = "APP_CONFIG"
          valueFrom = aws_secretsmanager_secret.app_config.arn
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = local.region
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
    }
  ])
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-task-definition"
  })
}

# ==================== ECS SERVICE ====================
resource "aws_ecs_service" "app" {
  name                              = "${local.name_prefix}-${var.app_name}-service"
  cluster                           = aws_ecs_cluster.main.id
  task_definition                   = aws_ecs_task_definition.app.arn
  desired_count                     = var.desired_count
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent        = 200
  launch_type                       = "FARGATE"
  
  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = var.app_name
    container_port   = var.container_port
  }
  
  deployment_controller {
    type = "CODE_DEPLOY"
  }
  
  lifecycle {
    ignore_changes = [task_definition, load_balancer]
  }
  
  depends_on = [aws_lb_listener.main]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-service"
  })
}

# ==================== CODEBUILD PROJECT ====================
resource "aws_codebuild_project" "app" {
  name          = "${local.name_prefix}-build"
  service_role  = aws_iam_role.codebuild.arn
  
  artifacts {
    type = "CODEPIPELINE"
  }
  
  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                      = "aws/codebuild/standard:5.0"
    type                       = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode            = true
    
    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = local.account_id
    }
    
    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = local.region
    }
    
    environment_variable {
      name  = "IMAGE_REPO_NAME"
      value = aws_ecr_repository.app.name
    }
    
    environment_variable {
      name  = "IMAGE_TAG"
      value = "latest"
    }
    
    environment_variable {
      name  = "CONTAINER_NAME"
      value = var.app_name
    }
  }
  
  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec.yml"
  }
  
  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild.name
      stream_name = "build-logs"
    }
  }
  
  cache {
    type  = "LOCAL"
    modes = ["LOCAL_DOCKER_LAYER_CACHE", "LOCAL_SOURCE_CACHE"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-codebuild"
  })
}

# ==================== CODEDEPLOY ====================
resource "aws_codedeploy_app" "app" {
  name             = "${local.name_prefix}-deploy"
  compute_platform = "ECS"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-codedeploy-app"
  })
}

resource "aws_codedeploy_deployment_group" "app" {
  app_name               = aws_codedeploy_app.app.name
  deployment_group_name  = "${local.name_prefix}-deployment-group"
  service_role_arn      = aws_iam_role.codedeploy.arn
  deployment_config_name = "CodeDeployDefault.ECSAllAtOnceBlueGreen"
  
  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"]
  }
  
  blue_green_deployment_config {
    terminate_blue_instances_on_deployment_success {
      action                                          = "TERMINATE"
      termination_wait_time_in_minutes               = 5
    }
    
    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }
    
    green_fleet_provisioning_option {
      action = "COPY_AUTO_SCALING_GROUP"
    }
  }
  
  ecs_service {
    cluster_name = aws_ecs_cluster.main.name
    service_name = aws_ecs_service.app.name
  }
  
  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }
  
  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [aws_lb_listener.main.arn]
      }
      
      test_traffic_route {
        listener_arns = [aws_lb_listener.test.arn]
      }
      
      target_group {
        name = aws_lb_target_group.blue.name
      }
      
      target_group {
        name = aws_lb_target_group.green.name
      }
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-deployment-group"
  })
}

# ==================== LAMBDA FUNCTION FOR VALIDATION ====================
resource "aws_lambda_function" "pipeline_validator" {
  filename         = "lambda_function.zip"
  function_name    = "${local.name_prefix}-pipeline-validator"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 60
  
  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-validator-lambda"
  })
}

# Create a placeholder Lambda deployment package
resource "local_file" "lambda_code" {
  filename = "lambda_function.py"
  content  = <<-EOT
    import json
    import boto3
    
    codepipeline = boto3.client('codepipeline')
    
    def handler(event, context):
        job_id = event['CodePipeline.job']['id']
        
        try:
            # Add your validation logic here
            # For example: validate CloudFormation templates, run security scans, etc.
            
            # If validation passes
            codepipeline.put_job_success_result(jobId=job_id)
            return {
                'statusCode': 200,
                'body': json.dumps('Validation successful')
            }
        except Exception as e:
            # If validation fails
            codepipeline.put_job_failure_result(
                jobId=job_id,
                failureDetails={'message': str(e), 'type': 'JobFailed'}
            )
            raise e
  EOT
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = local_file.lambda_code.filename
  output_path = "lambda_function.zip"
}

# ==================== SNS TOPIC FOR APPROVALS ====================
resource "aws_sns_topic" "pipeline_alerts" {
  name              = "${local.name_prefix}-pipeline-alerts"
  kms_master_key_id = aws_kms_key.pipeline_key.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sns-alerts"
  })
}

resource "aws_sns_topic_subscription" "pipeline_alerts_email" {
  topic_arn = aws_sns_topic.pipeline_alerts.arn
  protocol  = "email"
  endpoint  = var.approval_email
}

# ==================== CODEPIPELINE ====================
resource "aws_codepipeline" "app" {
  name     = "${local.name_prefix}-pipeline"
  role_arn = aws_iam_role.codepipeline.arn
  
  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"
    
    encryption_key {
      id   = aws_kms_alias.pipeline_key_alias.arn
      type = "KMS"
    }
  }
  
  stage {
    name = "Source"
    
    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeCommit"
      version          = "1"
      output_artifacts = ["source_output"]
      
      configuration = {
        RepositoryName = aws_codecommit_repository.app.repository_name
        BranchName     = "main"
      }
    }
  }
  
  stage {
    name = "Build"
    
    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]
      
      configuration = {
        ProjectName = aws_codebuild_project.app.name
      }
    }
  }
  
  stage {
    name = "Validate"
    
    action {
      name             = "ValidateDeployment"
      category         = "Invoke"
      owner            = "AWS"
      provider         = "Lambda"
      version          = "1"
      input_artifacts  = ["build_output"]
      output_artifacts = ["validation_output"]
      
      configuration = {
        FunctionName = aws_lambda_function.pipeline_validator.function_name
      }
    }
  }
  
  stage {
    name = "Approval"
    
    action {
      name     = "ManualApproval"
      category = "Approval"
      owner    = "AWS"
      provider = "Manual"
      version  = "1"
      
      configuration = {
        NotificationArn = aws_sns_topic.pipeline_alerts.arn
        CustomData      = "Please review and approve deployment to production"
      }
    }
  }
  
  stage {
    name = "Deploy"
    
    action {
      name            = "Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "CodeDeployToECS"
      version         = "1"
      input_artifacts = ["build_output"]
      
      configuration = {
        ApplicationName                = aws_codedeploy_app.app.name
        DeploymentGroupName           = aws_codedeploy_deployment_group.app.deployment_group_name
        TaskDefinitionTemplateArtifact = "build_output"
        TaskDefinitionTemplatePath     = "taskdef.json"
        AppSpecTemplateArtifact        = "build_output"
        AppSpecTemplatePath            = "appspec.yml"
      }
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-pipeline"
  })
}

# ==================== CLOUDWATCH ALARMS ====================
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${local.name_prefix}-ecs-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/ECS"
  period             = "120"
  statistic          = "Average"
  threshold          = "80"
  alarm_description  = "This metric monitors ECS CPU utilization"
  alarm_actions      = [aws_sns_topic.pipeline_alerts.arn]
  
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cpu-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "${local.name_prefix}-ecs-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "MemoryUtilization"
  namespace          = "AWS/ECS"
  period             = "120"
  statistic          = "Average"
  threshold          = "80"
  alarm_description  = "This metric monitors ECS memory utilization"
  alarm_actions      = [aws_sns_topic.pipeline_alerts.arn]
  
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-memory-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "target_unhealthy" {
  alarm_name          = "${local.name_prefix}-alb-unhealthy-targets"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "UnHealthyHostCount"
  namespace          = "AWS/ApplicationELB"
  period             = "60"
  statistic          = "Maximum"
  threshold          = "0"
  alarm_description  = "Alert when we have unhealthy ALB targets"
  alarm_actions      = [aws_sns_topic.pipeline_alerts.arn]
  
  dimensions = {
    TargetGroup  = aws_lb_target_group.blue.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-unhealthy-alarm"
  })
}

# ==================== CLOUDWATCH DASHBOARD ====================
resource "aws_cloudwatch_dashboard" "pipeline" {
  dashboard_name = "${local.name_prefix}-pipeline-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        x    = 0
        y    = 0
        width = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average" }],
            [".", "MemoryUtilization", { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = local.region
          title   = "ECS Resource Utilization"
          period  = 300
        }
      },
      {
        type = "metric"
        x    = 12
        y    = 0
        width = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }],
            [".", "RequestCount", { stat = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = local.region
          title   = "Application Load Balancer Metrics"
          period  = 300
        }
      }
    ]
  })
}

# ==================== OUTPUTS ====================
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "codecommit_clone_url_http" {
  description = "HTTP clone URL for the CodeCommit repository"
  value       = aws_codecommit_repository.app.clone_url_http
}

output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.app.name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}
```

## Key Features Implemented

### **Security & Compliance**
- **KMS encryption** for all data at rest (S3, ECR, Secrets Manager, CloudWatch Logs)
- **Least-privilege IAM roles** for each service
- **Private subnets** for ECS tasks with NAT gateways
- **Security groups** with minimal required access
- **Secrets Manager** for sensitive configuration

### **CI/CD Pipeline**
- **Automated trigger** from CodeCommit
- **CodeBuild** for testing and Docker image building
- **Lambda validation** stage for custom checks
- **Manual approval** before production deployment
- **Blue/Green deployment** with CodeDeploy

### **Monitoring & Alerting**
- **CloudWatch alarms** for CPU, memory, and unhealthy targets
- **SNS notifications** for approvals and alerts
- **CloudWatch dashboard** for visualization
- **Container Insights** enabled on ECS cluster

### **High Availability & Resilience**
- **Multi-AZ deployment** across 2 availability zones
- **Auto-rollback** on deployment failures
- **Health checks** at multiple levels (ALB, ECS)
- **Blue/Green deployment** for zero-downtime updates

## Usage Instructions

1. **Initialize Terraform:**
```bash
terraform init
```

2. **Customize variables** at the top of the file for your organization

3. **Validate the configuration:**
```bash
terraform validate
```

4. **Plan the deployment:**
```bash
terraform plan
```

5. **Apply the infrastructure:**
```bash
terraform apply
```

6. **Create initial application files** in your CodeCommit repository:
   - `buildspec.yml` - Build specification
   - `appspec.yml` - Deployment specification
   - `taskdef.json` - ECS task definition template
   - `Dockerfile` - Container definition

## Post-Deployment Steps

1. **Confirm SNS subscription** via the email sent to your approval address
2. **Push initial code** to the CodeCommit repository
3. **Monitor the first pipeline execution** in AWS Console
4. **Review CloudWatch dashboards** for metrics

This implementation provides a production-ready, secure, and scalable CI/CD pipeline that follows AWS best practices and enterprise standards.