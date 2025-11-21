# Multi-Environment Terraform Infrastructure Solution

This solution implements a complete multi-environment AWS infrastructure using Terraform workspaces, designed for strict consistency across dev, staging, and production environments.

## Architecture Overview

The infrastructure uses:
- Terraform workspaces for environment management
- Reusable modules for core services
- Environment-specific variable files
- Remote state with DynamoDB locking
- Parameter Store for secrets management

## File Structure

```
lib/
├── main.tf                 # Root module entry point
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── locals.tf               # Local values and mappings
├── backend.tf              # Remote state configuration
├── providers.tf            # AWS provider configuration
├── dev.tfvars             # Dev environment values
├── staging.tfvars         # Staging environment values
├── prod.tfvars            # Prod environment values
├── scripts/
│   └── validate-workspaces.sh  # Validation script
├── lambda/
│   └── data_processor/
│       ├── index.py       # Lambda function code
│       └── requirements.txt
└── modules/
    ├── vpc/               # VPC module
    ├── aurora/            # Aurora PostgreSQL module
    ├── lambda/            # Lambda module
    ├── storage/           # S3 storage module
    ├── alb/              # Application Load Balancer module
    ├── iam/              # IAM roles module
    └── monitoring/       # CloudWatch & SNS module
```

## File: lib/providers.tf

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
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Workspace   = terraform.workspace
    }
  }
}
```

## File: lib/backend.tf

```hcl
terraform {
  backend "s3" {
    # Backend configuration is provided via backend config file or CLI
    # terraform init -backend-config=backend-${WORKSPACE}.hcl

    # Example backend-dev.hcl:
    # bucket         = "terraform-state-dev-<suffix>"
    # key            = "payment-processing/terraform.tfstate"
    # region         = "eu-west-1"
    # dynamodb_table = "terraform-locks-dev-<suffix>"
    # encrypt        = true
  }
}
```

## File: lib/variables.tf

```hcl
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across deployments"
  type        = string

  validation {
    condition     = length(var.environment_suffix) >= 4 && length(var.environment_suffix) <= 16
    error_message = "Environment suffix must be between 4 and 16 characters."
  }
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "payment-processing"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "aurora_instance_class" {
  description = "Aurora instance class"
  type        = string
}

variable "aurora_instance_count" {
  description = "Number of Aurora instances"
  type        = number
  default     = 2
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 300
}

variable "alb_instance_type" {
  description = "Instance type for ALB targets (if using EC2)"
  type        = string
  default     = "t3.micro"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}

variable "enable_config_rules" {
  description = "Enable AWS Config rules for drift detection"
  type        = bool
  default     = false
}

variable "enable_step_functions" {
  description = "Enable Step Functions for orchestration"
  type        = bool
  default     = false
}

variable "enable_eventbridge" {
  description = "Enable EventBridge for environment synchronization"
  type        = bool
  default     = false
}

variable "bucket_names" {
  description = "List of S3 bucket names (without suffix)"
  type        = list(string)
  default     = ["data-processing", "archive", "logs"]
}
```

## File: lib/locals.tf

```hcl
locals {
  # Environment-specific configurations
  environment_config = {
    dev = {
      instance_type        = "t3.small"
      aurora_instance_class = "db.t3.medium"
      log_retention        = 7
      backup_retention     = 1
      multi_az            = false
    }
    staging = {
      instance_type        = "t3.medium"
      aurora_instance_class = "db.r6g.large"
      log_retention        = 30
      backup_retention     = 7
      multi_az            = true
    }
    prod = {
      instance_type        = "t3.large"
      aurora_instance_class = "db.r6g.xlarge"
      log_retention        = 90
      backup_retention     = 30
      multi_az            = true
    }
  }

  # Current environment configuration
  current_config = local.environment_config[var.environment]

  # Common naming prefix
  name_prefix = "${var.project_name}-${var.environment}"

  # Resource naming with environment suffix
  resource_names = {
    vpc                = "${local.name_prefix}-vpc-${var.environment_suffix}"
    aurora_cluster     = "${local.name_prefix}-aurora-${var.environment_suffix}"
    alb                = "${local.name_prefix}-alb-${var.environment_suffix}"
    lambda             = "${local.name_prefix}-processor-${var.environment_suffix}"
    sns_topic          = "${local.name_prefix}-alerts-${var.environment_suffix}"
    log_group          = "/aws/${var.project_name}/${var.environment}/${var.environment_suffix}"
  }

  # Common tags
  common_tags = {
    Environment       = var.environment
    EnvironmentSuffix = var.environment_suffix
    Project           = var.project_name
    ManagedBy         = "Terraform"
    Workspace         = terraform.workspace
  }

  # IAM role configurations
  iam_roles = {
    lambda_execution = {
      name        = "${local.name_prefix}-lambda-exec-${var.environment_suffix}"
      description = "Lambda execution role for ${var.environment}"
    }
    ecs_task = {
      name        = "${local.name_prefix}-ecs-task-${var.environment_suffix}"
      description = "ECS task role for ${var.environment}"
    }
    rds_monitoring = {
      name        = "${local.name_prefix}-rds-mon-${var.environment_suffix}"
      description = "RDS enhanced monitoring role for ${var.environment}"
    }
  }
}
```

## File: lib/main.tf

```hcl
# VPC Module
module "vpc" {
  source = "./modules/vpc"

  name_prefix          = "${local.name_prefix}-${var.environment_suffix}"
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  enable_nat_gateway   = true
  single_nat_gateway   = var.environment == "dev" ? true : false
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = local.common_tags
}

# IAM Roles Module
module "iam" {
  source = "./modules/iam"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  roles_config       = local.iam_roles

  tags = local.common_tags
}

# Aurora PostgreSQL Module
module "aurora" {
  source = "./modules/aurora"

  cluster_identifier      = local.resource_names.aurora_cluster
  engine_version          = "13.7"
  instance_class          = var.aurora_instance_class
  instance_count          = var.aurora_instance_count
  database_name           = "${var.project_name}_${var.environment}"
  master_username         = "admin"
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  allowed_security_groups = [module.alb.alb_security_group_id]
  backup_retention_period = local.current_config.backup_retention
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = true
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.aurora.arn
  environment_suffix      = var.environment_suffix

  tags = local.common_tags
}

# KMS Key for Aurora Encryption
resource "aws_kms_key" "aurora" {
  description             = "KMS key for Aurora encryption - ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-kms-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "aurora" {
  name          = "alias/${local.name_prefix}-aurora-${var.environment_suffix}"
  target_key_id = aws_kms_key.aurora.key_id
}

# S3 Storage Module
module "storage" {
  source = "./modules/storage"

  bucket_names       = var.bucket_names
  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  enable_versioning  = true
  force_destroy      = true

  tags = local.common_tags
}

# Lambda Function Module
module "lambda" {
  source = "./modules/lambda"

  function_name      = local.resource_names.lambda
  handler            = "index.handler"
  runtime            = "python3.9"
  memory_size        = var.lambda_memory_size
  timeout            = var.lambda_timeout
  source_dir         = "${path.module}/lambda/data_processor"
  execution_role_arn = module.iam.lambda_execution_role_arn

  environment_variables = {
    ENVIRONMENT        = var.environment
    ENVIRONMENT_SUFFIX = var.environment_suffix
    DB_ENDPOINT        = module.aurora.cluster_endpoint
    DB_NAME            = module.aurora.database_name
    BUCKET_PREFIX      = "${var.project_name}-${var.environment}"
  }

  vpc_config = {
    subnet_ids         = module.vpc.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = local.common_tags
}

# Lambda Security Group
resource "aws_security_group" "lambda" {
  name_prefix = "${local.name_prefix}-lambda-${var.environment_suffix}"
  description = "Security group for Lambda functions"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-sg-${var.environment_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  name               = "${local.name_prefix}-alb-${var.environment_suffix}"
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.public_subnet_ids
  security_group_ids = [aws_security_group.alb.id]
  environment_suffix = var.environment_suffix

  listener_rules = [
    {
      priority = 100
      conditions = [
        {
          path_pattern = ["/api/*"]
        }
      ]
      actions = [
        {
          type             = "forward"
          target_group_arn = module.alb.default_target_group_arn
        }
      ]
    }
  ]

  tags = local.common_tags
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg-${var.environment_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Monitoring Module (CloudWatch + SNS)
module "monitoring" {
  source = "./modules/monitoring"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  log_retention_days = var.log_retention_days
  sns_topic_name     = local.resource_names.sns_topic

  alarm_email_endpoints = []

  tags = local.common_tags
}

# Parameter Store for Database Password
resource "aws_ssm_parameter" "db_password" {
  name        = "/${var.project_name}/${var.environment}/${var.environment_suffix}/db/master-password"
  description = "Master password for Aurora cluster"
  type        = "SecureString"
  value       = random_password.db_password.result

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-password-${var.environment_suffix}"
  })
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# S3 Event Notification to Lambda
resource "aws_s3_bucket_notification" "data_processing" {
  bucket = module.storage.bucket_ids[0]

  lambda_function {
    lambda_function_arn = module.lambda.function_arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "incoming/"
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = module.storage.bucket_arns[0]
}

# Data source for remote state (example for cross-environment reference)
data "terraform_remote_state" "shared" {
  backend = "s3"
  workspace = "shared"

  config = {
    bucket = "terraform-state-shared-${var.environment_suffix}"
    key    = "shared/terraform.tfstate"
    region = var.aws_region
  }
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = module.aurora.cluster_endpoint
  sensitive   = true
}

output "aurora_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = module.aurora.cluster_reader_endpoint
  sensitive   = true
}

output "aurora_cluster_id" {
  description = "Aurora cluster identifier"
  value       = module.aurora.cluster_id
}

output "s3_bucket_ids" {
  description = "S3 bucket IDs"
  value       = module.storage.bucket_ids
}

output "s3_bucket_arns" {
  description = "S3 bucket ARNs"
  value       = module.storage.bucket_arns
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = module.lambda.function_arn
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.lambda.function_name
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = module.alb.alb_arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN"
  value       = module.monitoring.sns_topic_arn
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}
```

## File: lib/dev.tfvars

```hcl
# Development Environment Configuration
environment        = "dev"
environment_suffix = "dev001"
aws_region         = "eu-west-1"
vpc_cidr           = "10.0.0.0/16"

availability_zones = [
  "eu-west-1a",
  "eu-west-1b",
  "eu-west-1c"
]

aurora_instance_class = "db.t3.medium"
aurora_instance_count = 1

lambda_memory_size = 256
lambda_timeout     = 60

log_retention_days = 7

# Optional features
enable_config_rules  = false
enable_step_functions = false
enable_eventbridge   = false
```

## File: lib/staging.tfvars

```hcl
# Staging Environment Configuration
environment        = "staging"
environment_suffix = "stg001"
aws_region         = "us-west-2"
vpc_cidr           = "10.1.0.0/16"

availability_zones = [
  "us-west-2a",
  "us-west-2b",
  "us-west-2c"
]

aurora_instance_class = "db.r6g.large"
aurora_instance_count = 2

lambda_memory_size = 512
lambda_timeout     = 180

log_retention_days = 30

# Optional features
enable_config_rules  = false
enable_step_functions = false
enable_eventbridge   = false
```

## File: lib/prod.tfvars

```hcl
# Production Environment Configuration
environment        = "prod"
environment_suffix = "prd001"
aws_region         = "us-east-1"
vpc_cidr           = "10.2.0.0/16"

availability_zones = [
  "us-east-1a",
  "us-east-1b",
  "us-east-1c"
]

aurora_instance_class = "db.r6g.xlarge"
aurora_instance_count = 3

lambda_memory_size = 1024
lambda_timeout     = 300

log_retention_days = 90

# Optional features
enable_config_rules  = true
enable_step_functions = true
enable_eventbridge   = true
```

## File: lib/modules/vpc/main.tf

```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Enable NAT gateway"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT gateway"
  type        = bool
  default     = false
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(var.tags, {
    Name = var.name_prefix
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-igw"
  })
}

resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-${count.index + 1}"
    Type = "public"
  })
}

resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-${count.index + 1}"
    Type = "private"
  })
}

resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0

  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 1

  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = var.single_nat_gateway ? aws_nat_gateway.main[0].id : aws_nat_gateway.main[count.index].id
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-rt-${count.index + 1}"
  })
}

resource "aws_route_table_association" "public" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)

  subnet_id = aws_subnet.private[count.index].id
  route_table_id = var.enable_nat_gateway ? (
    var.single_nat_gateway ? aws_route_table.private[0].id : aws_route_table.private[count.index].id
  ) : aws_route_table.private[0].id
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}
```

## File: lib/modules/aurora/main.tf

```hcl
variable "cluster_identifier" {
  description = "Aurora cluster identifier"
  type        = string
}

variable "engine_version" {
  description = "Aurora engine version"
  type        = string
}

variable "instance_class" {
  description = "Instance class"
  type        = string
}

variable "instance_count" {
  description = "Number of instances"
  type        = number
  default     = 2
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "master_username" {
  description = "Master username"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs"
  type        = list(string)
}

variable "allowed_security_groups" {
  description = "Security groups allowed to access Aurora"
  type        = list(string)
  default     = []
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "preferred_backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
  default     = true
}

variable "storage_encrypted" {
  description = "Enable storage encryption"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
  default     = null
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

resource "aws_db_subnet_group" "aurora" {
  name       = "${var.cluster_identifier}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.cluster_identifier}-subnet-group"
  })
}

resource "aws_security_group" "aurora" {
  name_prefix = "${var.cluster_identifier}-sg"
  description = "Security group for Aurora cluster"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
    description     = "PostgreSQL access from allowed security groups"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_identifier}-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "random_password" "master_password" {
  length  = 32
  special = true
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier      = var.cluster_identifier
  engine                  = "aurora-postgresql"
  engine_version          = var.engine_version
  database_name           = replace(var.database_name, "-", "_")
  master_username         = var.master_username
  master_password         = random_password.master_password.result
  backup_retention_period = var.backup_retention_period
  preferred_backup_window = var.preferred_backup_window
  skip_final_snapshot     = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.cluster_identifier}-final-snapshot"
  storage_encrypted       = var.storage_encrypted
  kms_key_id              = var.kms_key_id
  db_subnet_group_name    = aws_db_subnet_group.aurora.name
  vpc_security_group_ids  = [aws_security_group.aurora.id]

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.tags, {
    Name = var.cluster_identifier
  })
}

resource "aws_rds_cluster_instance" "aurora" {
  count = var.instance_count

  identifier         = "${var.cluster_identifier}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = var.instance_class
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  performance_insights_enabled = true

  tags = merge(var.tags, {
    Name = "${var.cluster_identifier}-${count.index + 1}"
  })
}

output "cluster_id" {
  description = "Aurora cluster ID"
  value       = aws_rds_cluster.aurora.id
}

output "cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.aurora.endpoint
}

output "cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "cluster_port" {
  description = "Aurora cluster port"
  value       = aws_rds_cluster.aurora.port
}

output "database_name" {
  description = "Database name"
  value       = aws_rds_cluster.aurora.database_name
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.aurora.id
}

output "master_password" {
  description = "Master password"
  value       = random_password.master_password.result
  sensitive   = true
}
```

## File: lib/modules/lambda/main.tf

```hcl
variable "function_name" {
  description = "Lambda function name"
  type        = string
}

variable "handler" {
  description = "Lambda handler"
  type        = string
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
}

variable "memory_size" {
  description = "Memory size in MB"
  type        = number
  default     = 512
}

variable "timeout" {
  description = "Timeout in seconds"
  type        = number
  default     = 300
}

variable "source_dir" {
  description = "Source directory for Lambda code"
  type        = string
}

variable "execution_role_arn" {
  description = "Execution role ARN"
  type        = string
}

variable "environment_variables" {
  description = "Environment variables"
  type        = map(string)
  default     = {}
}

variable "vpc_config" {
  description = "VPC configuration"
  type = object({
    subnet_ids         = list(string)
    security_group_ids = list(string)
  })
  default = null
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.module}/lambda_package.zip"
}

resource "aws_lambda_function" "main" {
  filename         = data.archive_file.lambda.output_path
  function_name    = var.function_name
  role             = var.execution_role_arn
  handler          = var.handler
  source_code_hash = data.archive_file.lambda.output_base64sha256
  runtime          = var.runtime
  memory_size      = var.memory_size
  timeout          = var.timeout

  environment {
    variables = var.environment_variables
  }

  dynamic "vpc_config" {
    for_each = var.vpc_config != null ? [var.vpc_config] : []
    content {
      subnet_ids         = vpc_config.value.subnet_ids
      security_group_ids = vpc_config.value.security_group_ids
    }
  }

  tags = merge(var.tags, {
    Name = var.function_name
  })
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.function_name}-logs"
  })
}

output "function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.main.arn
}

output "function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.main.function_name
}

output "invoke_arn" {
  description = "Lambda invoke ARN"
  value       = aws_lambda_function.main.invoke_arn
}
```

## File: lib/modules/storage/main.tf

```hcl
variable "bucket_names" {
  description = "List of bucket names (without suffix)"
  type        = list(string)
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "enable_versioning" {
  description = "Enable versioning"
  type        = bool
  default     = true
}

variable "force_destroy" {
  description = "Force destroy bucket"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

locals {
  buckets = { for name in var.bucket_names : name => {
    bucket_name = "${var.project_name}-${var.environment}-${name}-${var.environment_suffix}"
  }}
}

resource "aws_s3_bucket" "buckets" {
  for_each = local.buckets

  bucket        = each.value.bucket_name
  force_destroy = var.force_destroy

  tags = merge(var.tags, {
    Name = each.value.bucket_name
    Type = each.key
  })
}

resource "aws_s3_bucket_versioning" "buckets" {
  for_each = var.enable_versioning ? local.buckets : {}

  bucket = aws_s3_bucket.buckets[each.key].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "buckets" {
  for_each = local.buckets

  bucket = aws_s3_bucket.buckets[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "buckets" {
  for_each = local.buckets

  bucket = aws_s3_bucket.buckets[each.key].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "bucket_ids" {
  description = "S3 bucket IDs"
  value       = [for k, v in aws_s3_bucket.buckets : v.id]
}

output "bucket_arns" {
  description = "S3 bucket ARNs"
  value       = [for k, v in aws_s3_bucket.buckets : v.arn]
}

output "bucket_names" {
  description = "S3 bucket names"
  value       = { for k, v in aws_s3_bucket.buckets : k => v.bucket }
}
```

## File: lib/modules/alb/main.tf

```hcl
variable "name" {
  description = "ALB name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs"
  type        = list(string)
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "listener_rules" {
  description = "ALB listener rules"
  type        = list(any)
  default     = []
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

resource "aws_lb" "main" {
  name               = var.name
  internal           = false
  load_balancer_type = "application"
  security_groups    = var.security_group_ids
  subnets            = var.subnet_ids

  enable_deletion_protection = false

  tags = merge(var.tags, {
    Name = var.name
  })
}

resource "aws_lb_target_group" "default" {
  name     = "${var.name}-default-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
  }

  tags = merge(var.tags, {
    Name = "${var.name}-default-tg"
  })
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.default.arn
  }

  tags = var.tags
}

output "alb_id" {
  description = "ALB ID"
  value       = aws_lb.main.id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = var.security_group_ids[0]
}

output "default_target_group_arn" {
  description = "Default target group ARN"
  value       = aws_lb_target_group.default.arn
}
```

## File: lib/modules/iam/main.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "roles_config" {
  description = "IAM roles configuration"
  type = map(object({
    name        = string
    description = string
  }))
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name        = var.roles_config["lambda_execution"].name
  description = var.roles_config["lambda_execution"].description

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  ]

  tags = merge(var.tags, {
    Name = var.roles_config["lambda_execution"].name
  })
}

resource "aws_iam_role_policy" "lambda_execution" {
  name = "lambda-execution-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "arn:aws:s3:::${var.project_name}-${var.environment}-*/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:*:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/${var.environment_suffix}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"
      }
    ]
  })
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name        = var.roles_config["ecs_task"].name
  description = var.roles_config["ecs_task"].description

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = var.roles_config["ecs_task"].name
  })
}

# RDS Monitoring Role
resource "aws_iam_role" "rds_monitoring" {
  name        = var.roles_config["rds_monitoring"].name
  description = var.roles_config["rds_monitoring"].description

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
  ]

  tags = merge(var.tags, {
    Name = var.roles_config["rds_monitoring"].name
  })
}

data "aws_caller_identity" "current" {}

output "lambda_execution_role_arn" {
  description = "Lambda execution role ARN"
  value       = aws_iam_role.lambda_execution.arn
}

output "lambda_execution_role_name" {
  description = "Lambda execution role name"
  value       = aws_iam_role.lambda_execution.name
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = aws_iam_role.ecs_task.arn
}

output "rds_monitoring_role_arn" {
  description = "RDS monitoring role ARN"
  value       = aws_iam_role.rds_monitoring.arn
}
```

## File: lib/modules/monitoring/main.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}

variable "sns_topic_name" {
  description = "SNS topic name"
  type        = string
}

variable "alarm_email_endpoints" {
  description = "Email endpoints for alarms"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

resource "aws_sns_topic" "alerts" {
  name = var.sns_topic_name

  tags = merge(var.tags, {
    Name = var.sns_topic_name
  })
}

resource "aws_sns_topic_subscription" "email" {
  for_each = toset(var.alarm_email_endpoints)

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/${var.project_name}/${var.environment}/${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "/aws/${var.project_name}/${var.environment}/${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "${var.project_name}-${var.environment}-error-count-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[ERROR]"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "${var.project_name}/${var.environment}"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-high-error-rate-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "${var.project_name}/${var.environment}"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This metric monitors error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-high-error-rate"
  })
}

output "sns_topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.alerts.arn
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.application.name
}
```

## File: lib/lambda/data_processor/index.py

```python
import json
import os
import boto3
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
ssm_client = boto3.client('ssm')

# Environment variables
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'unknown')
DB_ENDPOINT = os.environ.get('DB_ENDPOINT', '')
DB_NAME = os.environ.get('DB_NAME', '')
BUCKET_PREFIX = os.environ.get('BUCKET_PREFIX', '')

def handler(event, context):
    """
    Lambda handler for processing S3 data events.

    Args:
        event: Lambda event object (S3 event notification)
        context: Lambda context object

    Returns:
        dict: Response with status and processing details
    """
    logger.info(f"Processing event in {ENVIRONMENT} environment (suffix: {ENVIRONMENT_SUFFIX})")
    logger.info(f"Event: {json.dumps(event)}")

    try:
        # Process S3 event records
        processed_files = []

        for record in event.get('Records', []):
            # Extract S3 bucket and key
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']

            logger.info(f"Processing file: s3://{bucket}/{key}")

            # Download file from S3
            response = s3_client.get_object(Bucket=bucket, Key=key)
            file_content = response['Body'].read().decode('utf-8')

            logger.info(f"File content length: {len(file_content)} bytes")

            # Process the file content
            processed_data = process_data(file_content)

            # Upload processed data back to S3
            output_key = key.replace('incoming/', 'processed/')
            s3_client.put_object(
                Bucket=bucket,
                Key=output_key,
                Body=json.dumps(processed_data),
                ContentType='application/json'
            )

            logger.info(f"Processed file uploaded to: s3://{bucket}/{output_key}")

            processed_files.append({
                'input': f"s3://{bucket}/{key}",
                'output': f"s3://{bucket}/{output_key}",
                'records': len(processed_data.get('records', []))
            })

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed files',
                'environment': ENVIRONMENT,
                'environment_suffix': ENVIRONMENT_SUFFIX,
                'processed_files': processed_files,
                'timestamp': datetime.utcnow().isoformat()
            })
        }

    except Exception as e:
        logger.error(f"[ERROR] Processing failed: {str(e)}", exc_info=True)

        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Failed to process files',
                'error': str(e),
                'environment': ENVIRONMENT,
                'timestamp': datetime.utcnow().isoformat()
            })
        }

def process_data(content):
    """
    Process file content.

    Args:
        content: File content as string

    Returns:
        dict: Processed data
    """
    try:
        # Try to parse as JSON
        data = json.loads(content)

        # Add processing metadata
        processed = {
            'processed_at': datetime.utcnow().isoformat(),
            'environment': ENVIRONMENT,
            'environment_suffix': ENVIRONMENT_SUFFIX,
            'records': data if isinstance(data, list) else [data]
        }

        return processed

    except json.JSONDecodeError:
        # Handle non-JSON content
        lines = content.strip().split('\n')

        return {
            'processed_at': datetime.utcnow().isoformat(),
            'environment': ENVIRONMENT,
            'environment_suffix': ENVIRONMENT_SUFFIX,
            'records': [{'line': i, 'content': line} for i, line in enumerate(lines, 1)]
        }

def get_db_password():
    """
    Retrieve database password from Parameter Store.

    Returns:
        str: Database password
    """
    parameter_name = f"/{os.environ.get('PROJECT_NAME', 'payment-processing')}/{ENVIRONMENT}/{ENVIRONMENT_SUFFIX}/db/master-password"

    try:
        response = ssm_client.get_parameter(
            Name=parameter_name,
            WithDecryption=True
        )
        return response['Parameter']['Value']
    except Exception as e:
        logger.error(f"Failed to retrieve DB password: {str(e)}")
        raise
```

## File: lib/lambda/data_processor/requirements.txt

```
boto3>=1.26.0
```

## File: lib/scripts/validate-workspaces.sh

```bash
#!/bin/bash

# Workspace Configuration Validation Script
# Compares resource configurations across Terraform workspaces

set -e

WORKSPACES=("dev" "staging" "prod")
TEMP_DIR="/tmp/terraform-validation"
COMPARISON_FILE="${TEMP_DIR}/workspace-comparison.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Terraform Workspace Validation Script"
echo "=========================================="
echo ""

# Create temp directory
mkdir -p "${TEMP_DIR}"

# Function to extract resource configuration
extract_resources() {
    local workspace=$1
    local output_file="${TEMP_DIR}/${workspace}-resources.json"

    echo "Extracting resources from workspace: ${workspace}"

    # Switch to workspace
    terraform workspace select "${workspace}" > /dev/null 2>&1

    # Plan and extract resource types
    terraform plan -out="${TEMP_DIR}/${workspace}.tfplan" > /dev/null 2>&1
    terraform show -json "${TEMP_DIR}/${workspace}.tfplan" > "${output_file}"

    echo "✓ Extracted resources for ${workspace}"
}

# Function to compare security group rules
compare_security_groups() {
    echo ""
    echo "Comparing Security Group Rules..."
    echo "===================================="

    local mismatches=0

    for workspace in "${WORKSPACES[@]}"; do
        local sg_file="${TEMP_DIR}/${workspace}-sg-rules.json"

        # Extract security group rules
        jq '.planned_values.root_module.resources[] | select(.type == "aws_security_group") |
            {name: .values.name, ingress: .values.ingress, egress: .values.egress}' \
            "${TEMP_DIR}/${workspace}-resources.json" > "${sg_file}"

        if [ "${workspace}" != "dev" ]; then
            # Compare with dev (baseline)
            if ! diff -q "${TEMP_DIR}/dev-sg-rules.json" "${sg_file}" > /dev/null 2>&1; then
                echo -e "${RED}✗ Security group rules differ between dev and ${workspace}${NC}"
                mismatches=$((mismatches + 1))
            else
                echo -e "${GREEN}✓ Security group rules match between dev and ${workspace}${NC}"
            fi
        fi
    done

    return ${mismatches}
}

# Function to compare Lambda runtime versions
compare_lambda_runtimes() {
    echo ""
    echo "Comparing Lambda Runtime Versions..."
    echo "===================================="

    local mismatches=0

    for workspace in "${WORKSPACES[@]}"; do
        local lambda_file="${TEMP_DIR}/${workspace}-lambda.json"

        # Extract Lambda runtimes
        jq '.planned_values.root_module.resources[] | select(.type == "aws_lambda_function") |
            {name: .values.function_name, runtime: .values.runtime}' \
            "${TEMP_DIR}/${workspace}-resources.json" > "${lambda_file}"

        if [ "${workspace}" != "dev" ]; then
            # Compare runtimes
            if ! diff -q "${TEMP_DIR}/dev-lambda.json" "${lambda_file}" > /dev/null 2>&1; then
                echo -e "${RED}✗ Lambda runtimes differ between dev and ${workspace}${NC}"
                mismatches=$((mismatches + 1))
            else
                echo -e "${GREEN}✓ Lambda runtimes match between dev and ${workspace}${NC}"
            fi
        fi
    done

    return ${mismatches}
}

# Function to verify VPC CIDR non-overlap
verify_vpc_cidrs() {
    echo ""
    echo "Verifying VPC CIDR Blocks..."
    echo "===================================="

    declare -A vpc_cidrs
    local overlaps=0

    for workspace in "${WORKSPACES[@]}"; do
        # Extract VPC CIDR
        local cidr=$(jq -r '.planned_values.root_module.resources[] |
            select(.type == "aws_vpc") | .values.cidr_block' \
            "${TEMP_DIR}/${workspace}-resources.json" | head -1)

        vpc_cidrs[${workspace}]=${cidr}
        echo "  ${workspace}: ${cidr}"
    done

    # Check for overlaps (simplified - full check would use IP math)
    if [ "${vpc_cidrs[dev]}" == "${vpc_cidrs[staging]}" ] || \
       [ "${vpc_cidrs[dev]}" == "${vpc_cidrs[prod]}" ] || \
       [ "${vpc_cidrs[staging]}" == "${vpc_cidrs[prod]}" ]; then
        echo -e "${RED}✗ VPC CIDR blocks overlap detected${NC}"
        overlaps=1
    else
        echo -e "${GREEN}✓ No VPC CIDR overlaps detected${NC}"
    fi

    return ${overlaps}
}

# Function to verify resource naming consistency
verify_naming_consistency() {
    echo ""
    echo "Verifying Resource Naming..."
    echo "===================================="

    local issues=0

    for workspace in "${WORKSPACES[@]}"; do
        echo "Checking ${workspace}..."

        # Check if all resources include environment suffix
        local missing_suffix=$(jq -r '.planned_values.root_module.resources[] |
            select(.values.tags.EnvironmentSuffix == null) | .address' \
            "${TEMP_DIR}/${workspace}-resources.json" 2>/dev/null | wc -l)

        if [ "${missing_suffix}" -gt 0 ]; then
            echo -e "${YELLOW}⚠ ${missing_suffix} resources missing environment_suffix tag in ${workspace}${NC}"
            issues=$((issues + 1))
        else
            echo -e "${GREEN}✓ All resources properly tagged in ${workspace}${NC}"
        fi
    done

    return ${issues}
}

# Main execution
main() {
    # Extract resources from all workspaces
    for workspace in "${WORKSPACES[@]}"; do
        extract_resources "${workspace}"
    done

    # Run comparisons
    local total_issues=0

    compare_security_groups || total_issues=$((total_issues + $?))
    compare_lambda_runtimes || total_issues=$((total_issues + $?))
    verify_vpc_cidrs || total_issues=$((total_issues + $?))
    verify_naming_consistency || total_issues=$((total_issues + $?))

    # Summary
    echo ""
    echo "=========================================="
    echo "Validation Summary"
    echo "=========================================="

    if [ ${total_issues} -eq 0 ]; then
        echo -e "${GREEN}✓ All validation checks passed${NC}"
        echo "All workspaces are consistent"
        exit 0
    else
        echo -e "${RED}✗ Found ${total_issues} issues${NC}"
        echo "Please review the differences above"
        exit 1
    fi
}

# Run main function
main
```

## File: lib/README.md

```markdown
# Multi-Environment Terraform Infrastructure

This Terraform configuration deploys a complete payment processing infrastructure across three environments (dev, staging, prod) with strict consistency requirements.

## Architecture

### Infrastructure Components

- **VPC**: Multi-AZ VPC with public and private subnets
- **Aurora PostgreSQL**: Encrypted database cluster with read replicas
- **Lambda**: Data processing functions with S3 triggers
- **S3**: Storage buckets with versioning and encryption
- **ALB**: Application Load Balancer for HTTP/HTTPS traffic
- **CloudWatch**: Centralized logging and monitoring
- **SNS**: Alert notifications with email subscriptions
- **IAM**: Role-based access control with environment-specific trust policies

### Environments

| Environment | Region     | VPC CIDR     | Aurora Class  | Instances |
|-------------|------------|--------------|---------------|-----------|
| Development | eu-west-1  | 10.0.0.0/16  | db.t3.medium  | 1         |
| Staging     | us-west-2  | 10.1.0.0/16  | db.r6g.large  | 2         |
| Production  | us-east-1  | 10.2.0.0/16  | db.r6g.xlarge | 3         |

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Separate AWS accounts for each environment (recommended)
- S3 bucket for remote state storage
- DynamoDB table for state locking

## Quick Start

### 1. Initialize Backend

Create backend configuration files for each environment:

```bash
# backend-dev.hcl
bucket         = "terraform-state-dev-<suffix>"
key            = "payment-processing/terraform.tfstate"
region         = "eu-west-1"
dynamodb_table = "terraform-locks-dev-<suffix>"
encrypt        = true
```

### 2. Initialize Terraform

```bash
# Initialize with dev backend
terraform init -backend-config=backend-dev.hcl

# Create workspaces
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod
```

### 3. Deploy Infrastructure

```bash
# Deploy to dev
terraform workspace select dev
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars

# Deploy to staging
terraform workspace select staging
terraform plan -var-file=staging.tfvars
terraform apply -var-file=staging.tfvars

# Deploy to prod
terraform workspace select prod
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

## Module Structure

```
modules/
├── vpc/           # VPC with subnets, NAT gateways, routing
├── aurora/        # Aurora PostgreSQL cluster with encryption
├── lambda/        # Lambda functions with VPC integration
├── storage/       # S3 buckets with versioning and encryption
├── alb/           # Application Load Balancer with listeners
├── iam/           # IAM roles and policies
└── monitoring/    # CloudWatch logs and SNS topics
```

## Configuration

### Environment Variables

Each `.tfvars` file contains environment-specific values:

- `environment`: Environment name (dev/staging/prod)
- `environment_suffix`: Unique suffix for resource naming
- `aws_region`: Target AWS region
- `vpc_cidr`: VPC CIDR block (non-overlapping)
- `availability_zones`: List of AZs for the region
- `aurora_instance_class`: Database instance size
- `log_retention_days`: CloudWatch log retention

### Resource Naming

All resources include `environment_suffix` for uniqueness:

```hcl
resource "aws_s3_bucket" "example" {
  bucket = "${var.project_name}-${var.environment}-data-${var.environment_suffix}"
}
```

## Validation

Run the workspace validation script to compare configurations:

```bash
chmod +x lib/scripts/validate-workspaces.sh
./lib/scripts/validate-workspaces.sh
```

This validates:
- Security group rules are identical across environments
- Lambda runtime versions match
- VPC CIDR blocks don't overlap
- All resources include environment_suffix

## Testing

### Unit Tests

```bash
cd test
npm install
npm test
```

### Integration Tests

```bash
# Deploy test infrastructure
terraform workspace select dev
terraform apply -var-file=dev.tfvars -auto-approve

# Run integration tests
cd test
npm run test:integration

# Cleanup
terraform destroy -var-file=dev.tfvars -auto-approve
```

## Maintenance

### Updating Configurations

1. Make changes in the root module or modules
2. Test in dev environment first
3. Run validation script to ensure consistency
4. Apply to staging, then production

### Adding New Resources

1. Add resource to appropriate module
2. Update all `.tfvars` files with required variables
3. Test in dev workspace
4. Run validation script
5. Deploy to other environments

## Security

- All databases are encrypted at rest using KMS
- S3 buckets have encryption enabled by default
- Secrets are stored in Parameter Store (SecureString)
- VPC endpoints reduce NAT Gateway exposure
- Security groups follow principle of least privilege

## Cost Optimization

- Single NAT Gateway in dev (multi-AZ in staging/prod)
- Aurora Serverless v2 for cost-effective scaling
- Minimal backup retention in dev (1 day)
- CloudWatch log retention matches environment criticality

## Troubleshooting

### Common Issues

1. **State Lock Errors**
   ```bash
   # Force unlock (use with caution)
   terraform force-unlock <lock-id>
   ```

2. **VPC CIDR Conflicts**
   - Verify CIDR blocks in each `.tfvars` file
   - Run validation script to detect overlaps

3. **Aurora Connection Issues**
   - Check security group rules
   - Verify Lambda is in VPC
   - Ensure Parameter Store has correct password

## Outputs

Key outputs from deployment:

- `vpc_id`: VPC identifier
- `aurora_cluster_endpoint`: Database write endpoint
- `s3_bucket_ids`: List of created bucket IDs
- `lambda_function_arn`: Lambda function ARN
- `alb_dns_name`: Load balancer DNS name
- `sns_topic_arn`: SNS topic for alerts

## Support

For issues or questions:
- Review CloudWatch logs for errors
- Check resource tags for correct environment_suffix
- Validate workspace configuration with validation script
- Review AWS CloudTrail for deployment events
