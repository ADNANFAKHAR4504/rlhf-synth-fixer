## `main.tf`

```hcl
# main.tf

locals {
  environment = terraform.workspace == "default" ? "dev" : terraform.workspace

  # Environment-specific configurations
  env_config = {
    dev = {
      vpc_cidr          = "${var.vpc_cidr_base}.0.0/16"
      instance_class    = "db.t3.micro"
      multi_az          = false
      task_count        = 1
      task_cpu          = 256
      task_memory       = 512
      log_retention     = 7
      s3_lifecycle_days = 30
      min_capacity      = 1
      max_capacity      = 2
    }
    staging = {
      vpc_cidr          = "${var.vpc_cidr_base}.16.0/16"
      instance_class    = "db.t3.small"
      multi_az          = false
      task_count        = 1
      task_cpu          = 512
      task_memory       = 1024
      log_retention     = 30
      s3_lifecycle_days = 60
      min_capacity      = 1
      max_capacity      = 3
    }
    prod = {
      vpc_cidr          = "${var.vpc_cidr_base}.32.0/16"
      instance_class    = "db.r6g.large"
      multi_az          = true
      task_count        = 3
      task_cpu          = 1024
      task_memory       = 2048
      log_retention     = 90
      s3_lifecycle_days = 90
      min_capacity      = 3
      max_capacity      = 10
    }
  }

  current_env_config = local.env_config[local.environment]

  common_tags = {
    Environment = local.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Workspace   = terraform.workspace
    PRNumber    = var.pr_number
  }

  resource_prefix = "${var.project_name}-${var.pr_number}"
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# KMS Module - Shared encryption key for RDS, S3, and EBS
module "kms" {
  source = "./modules/kms"

  environment  = local.environment
  project_name = var.project_name
  pr_number    = var.pr_number
  aws_region   = var.aws_region
  tags         = local.common_tags

  # This will be updated after compute module creates the role
  ecs_task_execution_role_arn = ""
}

# Network Module
module "network" {
  source = "./modules/network"

  vpc_cidr     = local.current_env_config.vpc_cidr
  environment  = local.environment
  project_name = var.project_name
  pr_number    = var.pr_number
  azs          = data.aws_availability_zones.available.names
  tags         = local.common_tags
}

# Storage Module
module "storage" {
  source = "./modules/storage"

  environment    = local.environment
  project_name   = var.project_name
  pr_number      = var.pr_number
  lifecycle_days = local.current_env_config.s3_lifecycle_days
  kms_key_arn    = module.kms.kms_key_arn
  tags           = local.common_tags
}

# Compute Module - Create security groups first
module "compute" {
  source = "./modules/compute"

  environment        = local.environment
  project_name       = var.project_name
  pr_number          = var.pr_number
  vpc_id             = module.network.vpc_id
  public_subnet_ids  = module.network.public_subnet_ids
  private_subnet_ids = module.network.private_subnet_ids
  task_count         = local.current_env_config.task_count
  task_cpu           = local.current_env_config.task_cpu
  task_memory        = local.current_env_config.task_memory
  container_image    = var.container_image
  s3_bucket_arn      = module.storage.bucket_arn
  s3_bucket_name     = module.storage.bucket_name
  db_endpoint        = module.database.db_endpoint
  db_name            = module.database.db_name
  db_username        = var.db_username
  db_password        = var.db_password
  db_secret_arn      = module.database.db_secret_arn
  db_secret_name     = module.database.db_secret_name
  log_retention      = local.current_env_config.log_retention
  certificate_arn    = var.alb_certificate_arn
  min_capacity       = local.current_env_config.min_capacity
  max_capacity       = local.current_env_config.max_capacity
  tags               = local.common_tags
}

# Database Module
module "database" {
  source = "./modules/database"

  environment           = local.environment
  project_name          = var.project_name
  pr_number             = var.pr_number
  subnet_ids            = module.network.private_subnet_ids
  vpc_id                = module.network.vpc_id
  instance_class        = local.current_env_config.instance_class
  multi_az              = local.current_env_config.multi_az
  db_username           = var.db_username
  db_password           = var.db_password
  app_security_group_id = module.compute.ecs_security_group_id
  kms_key_arn           = module.kms.kms_key_arn
  tags                  = local.common_tags
}

# WAF Module
module "waf" {
  source = "./modules/waf"

  project_name  = var.project_name
  pr_number     = var.pr_number
  alb_arn       = module.compute.alb_arn
  rate_limit    = local.environment == "prod" ? 5000 : 2000
  log_retention = local.current_env_config.log_retention
  tags          = local.common_tags

  # Optional: Add blocked countries for production
  blocked_countries = local.environment == "prod" ? [] : []
}
```

## `outputs.tf`

```hcl
# outputs.tf

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.db_endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for transaction logs"
  value       = module.storage.bucket_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.compute.ecs_cluster_name
}

output "kms_key_id" {
  description = "ID of the shared KMS key"
  value       = module.kms.kms_key_id
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = module.waf.web_acl_id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = module.waf.web_acl_arn
}

output "db_secret_name" {
  description = "Name of the Secrets Manager secret containing DB credentials"
  value       = module.database.db_secret_name
}

output "db_secret_arn" {
  description = "ARN of the Secrets Manager secret containing DB credentials"
  value       = module.database.db_secret_arn
  sensitive   = true
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.compute.alb_arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = module.compute.ecs_service_name
}

output "target_group_arn" {
  description = "ARN of the ALB target group"
  value       = module.compute.target_group_arn
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = module.network.private_subnet_ids
}

output "alb_security_group_id" {
  description = "Security group ID of the ALB"
  value       = module.compute.alb_security_group_id
}

output "ecs_security_group_id" {
  description = "Security group ID of ECS tasks"
  value       = module.compute.ecs_security_group_id
}
```

## `providers.tf`

```hcl
# providers.tf 

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}
```

## `variables.tf`

```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "payment-processing"
}

variable "pr_number" {
  description = "PR number for resource identification and naming"
  type        = string

  validation {
    condition     = can(regex("^pr[0-9]+", var.pr_number))
    error_message = "pr_number must start with 'pr' followed by numbers (e.g., pr6969dev, pr6969staging)."
  }
}

variable "vpc_cidr_base" {
  description = "Base CIDR for VPC (first two octets)"
  type        = string
  default     = "10.0"
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for RDS (leave empty to auto-generate)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "container_image" {
  description = "Docker image for payment processing application"
  type        = string
  default     = "nginx:latest" # Replace with actual payment app image
}

variable "alb_certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional)"
  type        = string
  default     = ""
}
```

## `dev.tfvars`

```hcl
aws_region      = "us-east-1"
project_name    = "payment"
pr_number       = "pr7072dev"
vpc_cidr_base   = "10.0"
container_image = "nginx:latest" # Replace with actual payment app image

# Database credentials
db_username = "dbadmin"
# db_password is auto-generated and stored in AWS Secrets Manager

# Optional: ACM certificate for HTTPS
alb_certificate_arn = ""
```

## `prod.tfvars`

```hcl
aws_region      = "us-east-1"
project_name    = "payment"
pr_number       = "pr7072prod"
vpc_cidr_base   = "10.0"
container_image = "nginx:latest" # Replace with actual payment app image

# Database credentials
db_username = "dbadmin"
# db_password is auto-generated and stored in AWS Secrets Manager

# Optional: ACM certificate for HTTPS
alb_certificate_arn = "" # Add your production certificate ARN
```

## `staging.tfvars`

```hcl
aws_region      = "us-east-1"
project_name    = "payment"
pr_number       = "pr7072stag"
vpc_cidr_base   = "10.0"
container_image = "nginx:latest" # Replace with actual payment app image

# Database credentials
db_username = "dbadmin"
# db_password is auto-generated and stored in AWS Secrets Manager

# Optional: ACM certificate for HTTPS
alb_certificate_arn = ""
```

## `modules/compute/main.tf`

```hcl
# modules/compute/main.tf

locals {
  name_prefix    = "${var.project_name}-${var.pr_number}"
  container_name = "payment-processor"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${local.name_prefix}"
  retention_in_days = var.log_retention

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-ecs-logs"
  })
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.name_prefix}-ecs-task-execution-role"

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

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "${local.name_prefix}-ecs-task-role"

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

  tags = var.tags
}

# IAM Policy for Task Role
resource "aws_iam_role_policy" "ecs_task" {
  name = "${local.name_prefix}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.s3_bucket_arn,
          "${var.s3_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.ecs.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = var.db_secret_arn
      }
    ]
  })
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

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
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs" {
  name        = "${local.name_prefix}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Traffic from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-ecs-sg"
  })
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.environment == "prod"
  enable_http2               = true

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-alb"
  })
}

# ALB Target Group
resource "aws_lb_target_group" "main" {
  name        = "${local.name_prefix}-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
    matcher             = "200"
  }

  deregistration_delay = var.environment == "prod" ? 300 : 30

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-tg"
  })
}

# ALB Listener - HTTP
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = var.certificate_arn != "" ? "redirect" : "forward"
    target_group_arn = var.certificate_arn == "" ? aws_lb_target_group.main.arn : null

    dynamic "redirect" {
      for_each = var.certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }
}

# ALB Listener - HTTPS (if certificate provided)
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

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = var.environment == "prod" ? "enabled" : "disabled"
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-cluster"
  })
}

# ECS Task Definition
resource "aws_ecs_task_definition" "main" {
  family                   = "${local.name_prefix}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = local.container_name
    image = var.container_image != "nginx:latest" ? var.container_image : "python:3.11-slim"

    portMappings = [{
      containerPort = 80
      protocol      = "tcp"
    }]

    entryPoint = ["/bin/sh", "-c"]
    command = [
      <<-SCRIPT
pip3 install --no-cache-dir boto3 psycopg2-binary && python3 <<'PYEOF'
import os
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse
import boto3
import psycopg2
from datetime import datetime

class AppHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = urlparse(self.path).path
        
        if path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'healthy',
                'service': 'payment-app',
                'timestamp': datetime.now().isoformat()
            }).encode())
        elif path == '/db-test':
            try:
                secret_name = os.environ.get('DB_SECRET_NAME', '')
                region = os.environ.get('AWS_REGION', 'us-east-1')
                db_host = os.environ.get('DB_HOST', '')
                db_name = os.environ.get('DB_NAME', '')
                db_user = os.environ.get('DB_USER', '')
                db_password = os.environ.get('DB_PASSWORD', '')
                
                if secret_name and not db_password:
                    secrets_client = boto3.client('secretsmanager', region_name=region)
                    secret_value = secrets_client.get_secret_value(SecretId=secret_name)
                    credentials = json.loads(secret_value['SecretString'])
                    db_password = credentials.get('password', '')
                
                conn = psycopg2.connect(
                    host=db_host,
                    database=db_name,
                    user=db_user,
                    password=db_password,
                    connect_timeout=5
                )
                cur = conn.cursor()
                cur.execute("SELECT 1 as test_result;")
                result = cur.fetchone()[0]
                cur.close()
                conn.close()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'status': 'success',
                    'message': 'RDS connection successful',
                    'test_result': result,
                    'query_time': datetime.now().isoformat(),
                    'endpoint': db_host
                }).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'status': 'error',
                    'message': f'Database connection failed: {str(e)}',
                    'endpoint': os.environ.get('DB_HOST', 'unknown')
                }).encode())
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<h1>Payment Processing App</h1><p>Environment: ' + 
                           os.environ.get('ENVIRONMENT', 'unknown').encode() + b'</p>')
    
    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 80), AppHandler)
    server.serve_forever()
PYEOF
      SCRIPT
    ]

    environment = [
      {
        name  = "ENVIRONMENT"
        value = var.environment
      },
      {
        name  = "DB_HOST"
        value = split(":", var.db_endpoint)[0]
      },
      {
        name  = "DB_NAME"
        value = var.db_name
      },
      {
        name  = "DB_USER"
        value = var.db_username
      },
      {
        name  = "DB_SECRET_NAME"
        value = var.db_secret_name
      },
      {
        name  = "S3_BUCKET"
        value = var.s3_bucket_name
      },
      {
        name  = "AWS_REGION"
        value = data.aws_region.current.name
      },
      {
        name  = "APP_NAME"
        value = "payment-processing"
      },
      {
        name  = "APP_VERSION"
        value = "1.0.0"
      }
    ]

    secrets = [
      {
        name      = "DB_PASSWORD"
        valueFrom = "${var.db_secret_arn}:password::"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = data.aws_region.current.name
        "awslogs-stream-prefix" = "ecs"
      }
    }

    essential = true
  }])

  tags = var.tags
}

# Grant ECS Task Execution Role access to Secrets Manager
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${local.name_prefix}-ecs-task-execution-secrets"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      Resource = var.db_secret_arn
    }]
  })
}

# ECS Service
resource "aws_ecs_service" "main" {
  name            = "${local.name_prefix}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.task_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = local.container_name
    container_port   = 80
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = var.environment == "prod" ? 100 : 50

  depends_on = [aws_lb_listener.http]

  tags = var.tags
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - CPU
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
    target_value = 70
  }
}

# Auto Scaling Policy - Memory
resource "aws_appautoscaling_policy" "memory" {
  name               = "${local.name_prefix}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = 70
  }
}

data "aws_region" "current" {}
```

## `modules/compute/outputs.tf`

```hcl
# modules/compute/outputs.tf

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

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "ecs_security_group_id" {
  description = "Security group ID of ECS tasks"
  value       = aws_security_group.ecs.id
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "target_group_arn" {
  description = "ARN of the ALB target group"
  value       = aws_lb_target_group.main.arn
}

output "alb_security_group_id" {
  description = "Security group ID of the ALB"
  value       = aws_security_group.alb.id
}
```

## `modules/compute/variables.tf`

```hcl
# modules/compute/variables.tf

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "pr_number" {
  description = "PR number for resource identification"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "task_count" {
  description = "Number of ECS tasks to run"
  type        = number
}

variable "task_cpu" {
  description = "CPU units for the task"
  type        = number
}

variable "task_memory" {
  description = "Memory for the task in MB"
  type        = number
}

variable "container_image" {
  description = "Docker image for the container"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  type        = string
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "db_endpoint" {
  description = "RDS endpoint"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password (deprecated - using Secrets Manager)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "db_secret_arn" {
  description = "ARN of the Secrets Manager secret containing DB credentials"
  type        = string
}

variable "db_secret_name" {
  description = "Name of the Secrets Manager secret containing DB credentials"
  type        = string
}

variable "log_retention" {
  description = "CloudWatch log retention in days"
  type        = number
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

variable "min_capacity" {
  description = "Minimum number of tasks for auto-scaling"
  type        = number
}

variable "max_capacity" {
  description = "Maximum number of tasks for auto-scaling"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## `modules/database/main.tf`

```hcl
# modules/database/main.tf

locals {
  name_prefix = "${var.project_name}-${var.pr_number}"
  db_name     = "paymentdb"
}

# Generate random password for RDS if not provided
resource "random_password" "db_password" {
  count            = var.db_password == "" ? 1 : 0
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store DB password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${local.name_prefix}-db-password"
  recovery_window_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-db-password"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password != "" ? var.db_password : random_password.db_password[0].result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = local.db_name
  })

  depends_on = [aws_db_instance.main]
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from app"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-rds-sg"
  })
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier     = "${local.name_prefix}-postgres"
  engine         = "postgres"
  engine_version = "15.14"

  instance_class    = var.instance_class
  allocated_storage = var.environment == "prod" ? 100 : 20
  storage_type      = var.environment == "prod" ? "gp3" : "gp2"
  storage_encrypted = true
  kms_key_id        = var.kms_key_arn

  db_name  = local.db_name
  username = var.db_username
  password = var.db_password != "" ? var.db_password : random_password.db_password[0].result

  multi_az               = var.multi_az
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = var.environment == "prod" ? 30 : 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  deletion_protection       = var.environment == "prod" ? true : false
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${local.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmmss", timestamp())}" : null

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-postgres"
  })
}
```

## `modules/database/outputs.tf`

```hcl
# modules/database/outputs.tf

output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_port" {
  description = "Database port"
  value       = aws_db_instance.main.port
}

output "db_secret_arn" {
  description = "ARN of the Secrets Manager secret containing DB credentials"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "db_secret_name" {
  description = "Name of the Secrets Manager secret containing DB credentials"
  value       = aws_secretsmanager_secret.db_password.name
}
```

## `modules/database/variables.tf`

```hcl
# modules/database/variables.tf

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "pr_number" {
  description = "PR number for resource identification"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for DB subnet group"
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password (leave empty to auto-generate)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "app_security_group_id" {
  description = "Security group ID of the application"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## `modules/kms/main.tf`

```hcl
# modules/kms/main.tf

locals {
  name_prefix = "${var.project_name}-${var.pr_number}"
}

# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}

# KMS key for EBS, RDS, and S3 encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix} EBS, RDS, and S3 encryption"
  deletion_window_in_days = var.environment == "prod" ? 30 : 7
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-key"
  })
}

# KMS key alias
resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}"
  target_key_id = aws_kms_key.main.key_id
}

# KMS key policy
resource "aws_kms_key_policy" "main" {
  key_id = aws_kms_key.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow ECS task execution role to use the key"
        Effect = "Allow"
        Principal = {
          AWS = var.ecs_task_execution_role_arn != "" ? var.ecs_task_execution_role_arn : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      },
      {
        Sid    = "Allow AWS services to create grants"
        Effect = "Allow"
        Principal = {
          Service = [
            "rds.amazonaws.com",
            "s3.amazonaws.com"
          ]
        }
        Action = [
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = "true"
          }
        }
      }
    ]
  })
}
```

## `modules/kms/outputs.tf`

```hcl
# modules/kms/outputs.tf

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "kms_key_alias" {
  description = "Alias of the KMS key"
  value       = aws_kms_alias.main.name
}
```

## `modules/kms/variables.tf`

```hcl
# modules/kms/variables.tf

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "pr_number" {
  description = "PR number for resource identification"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## `modules/network/main.tf`

```hcl
# modules/network/main.tf

locals {
  name_prefix = "${var.project_name}-${var.pr_number}"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.azs[count.index]

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.environment == "prod" ? 2 : 1
  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.environment == "prod" ? 2 : 1

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables - Public
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

# Route Tables - Private
resource "aws_route_table" "private" {
  count  = var.environment == "prod" ? 2 : 1
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = var.environment == "prod" ? aws_route_table.private[count.index].id : aws_route_table.private[0].id
}

# Network ACL for Database Subnets
resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Allow inbound PostgreSQL traffic only from VPC CIDR
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 5432
    to_port    = 5432
  }

  # Allow inbound HTTPS for Secrets Manager and other AWS services
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow inbound HTTP for ALB health checks
  ingress {
    protocol   = "tcp"
    rule_no    = 115
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 80
    to_port    = 80
  }

  # Allow inbound ephemeral ports for return traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow all outbound traffic
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-database-nacl"
  })
}
```

## `modules/network/outputs.tf`

```hcl
# modules/network/outputs.tf

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}
```

## `modules/network/variables.tf`

```hcl
# modules/network/variables.tf

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "pr_number" {
  description = "PR number for resource identification"
  type        = string
}

variable "azs" {
  description = "Availability zones"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## `modules/storage/main.tf`

```hcl
# modules/storage/main.tf

locals {
  bucket_name = "${var.project_name}-${var.pr_number}-transaction-logs-${data.aws_caller_identity.current.account_id}"
}

data "aws_caller_identity" "current" {}

# S3 Bucket for Transaction Logs
resource "aws_s3_bucket" "transaction_logs" {
  bucket = local.bucket_name

  tags = merge(var.tags, {
    Name = local.bucket_name
  })
}

# Bucket Versioning
resource "aws_s3_bucket_versioning" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Bucket Lifecycle Policy
resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  rule {
    id     = "transition-and-expire"
    status = "Enabled"

    filter {}

    transition {
      days          = var.lifecycle_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = var.lifecycle_days * 2
      storage_class = "GLACIER"
    }

    expiration {
      days = var.lifecycle_days * 4
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# Block Public Access
resource "aws_s3_bucket_public_access_block" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

## `modules/storage/outputs.tf`

```hcl
# modules/storage/outputs.tf

output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.transaction_logs.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.transaction_logs.arn
}
```

## `modules/storage/variables.tf`

```hcl
# modules/storage/variables.tf

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "pr_number" {
  description = "PR number for resource identification"
  type        = string
}

variable "lifecycle_days" {
  description = "Days before transitioning to IA and expiring objects"
  type        = number
}

variable "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## `modules/waf/main.tf`

```hcl
# modules/waf/main.tf

locals {
  name_prefix = "${var.project_name}-${var.pr_number}"
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "${local.name_prefix}-web-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rule 1: Rate limiting
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: SQL Injection protection (WAF built-in statement)
  rule {
    name     = "SQLiProtection"
    priority = 2

    action {
      block {}
    }

    statement {
      sqli_match_statement {
        field_to_match {
          all_query_arguments {}
        }
        text_transformation {
          priority = 0
          type     = "URL_DECODE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-sqli"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3: Cross-Site Scripting protection
  rule {
    name     = "XSSProtection"
    priority = 3

    action {
      block {}
    }

    statement {
      xss_match_statement {
        field_to_match {
          body {}
        }
        text_transformation {
          priority = 0
          type     = "HTML_ENTITY_DECODE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-xss"
      sampled_requests_enabled   = true
    }
  }

  # Rule 5: Geo-blocking (optional, block specific countries if needed)
  dynamic "rule" {
    for_each = length(var.blocked_countries) > 0 ? [1] : []
    content {
      name     = "GeoBlockingRule"
      priority = 5

      action {
        block {}
      }

      statement {
        geo_match_statement {
          country_codes = var.blocked_countries
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${local.name_prefix}-geo-block"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-web-acl"
    sampled_requests_enabled   = true
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-web-acl"
  })
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = var.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# CloudWatch Log Group for WAF logs
resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-${local.name_prefix}"
  retention_in_days = var.log_retention

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-waf-logs"
  })
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  resource_arn            = aws_wafv2_web_acl.main.arn
  log_destination_configs = ["${aws_cloudwatch_log_group.waf.arn}:*"]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}
```

## `modules/waf/outputs.tf`

```hcl
# modules/waf/outputs.tf

output "web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "web_acl_capacity" {
  description = "Web ACL capacity units (WCUs) used"
  value       = aws_wafv2_web_acl.main.capacity
}
```

## `modules/waf/variables.tf`

```hcl
# modules/waf/variables.tf

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "pr_number" {
  description = "PR number for resource identification"
  type        = string
}

variable "alb_arn" {
  description = "ARN of the Application Load Balancer"
  type        = string
}

variable "rate_limit" {
  description = "Rate limit for requests per 5 minutes from a single IP"
  type        = number
  default     = 2000
}

variable "blocked_countries" {
  description = "List of country codes to block (ISO 3166-1 alpha-2)"
  type        = list(string)
  default     = []
}

variable "log_retention" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```
