## lib/provider.tf

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

  # Backend configuration - workspace-based state separation
  backend "s3" {}
}

# Single AWS provider - region determined by workspace's tfvars
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}
```

## lib/variables.tf

```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for this workspace"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix (prod, staging, etc.)"
  type        = string
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

# Removed assume_role_arn - not needed for single account setup

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones for the current region"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS task"
  type        = string
}

variable "ecs_task_memory" {
  description = "Memory for ECS task"
  type        = string
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "aurora_instance_class" {
  description = "Instance class for Aurora DB"
  type        = string
}

variable "aurora_engine_version" {
  description = "Aurora engine version"
  type        = string
  default     = "8.0.mysql_aurora.3.04.0"
}

variable "aurora_cluster_size" {
  description = "Number of instances in Aurora cluster"
  type        = number
  default     = 2
}

variable "s3_enable_replication" {
  description = "Enable S3 cross-region replication"
  type        = bool
  default     = false
}

variable "s3_replication_destinations" {
  description = "S3 replication destination regions"
  type        = list(string)
  default     = []
}

# Aurora Global Database variables
variable "aurora_global_cluster_id" {
  description = "Global cluster ID for Aurora Global Database (only for secondary regions)"
  type        = string
  default     = ""
}

variable "is_primary_region" {
  description = "Whether this is the primary region for Aurora Global Database"
  type        = bool
  default     = false
}

locals {
  project_name = "tap"
  environment  = var.environment_suffix
  region       = var.aws_region
  workspace    = terraform.workspace

  # Derive region code from region name
  region_code = {
    "us-east-1"      = "use1"
    "eu-west-1"      = "euw1"
    "ap-southeast-1" = "apse1"
  }[var.aws_region]

  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    Region      = local.region
    Workspace   = local.workspace
    Repository  = var.repository
    Author      = var.commit_author
    PRNumber    = var.pr_number
    Team        = var.team
    ManagedBy   = "terraform"
  }
}
```

## lib/tap_stack.tf

```hcl
# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name         = local.project_name
  environment          = local.environment
  region               = local.region
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  enable_nat_gateway   = var.enable_nat_gateway
  common_tags          = local.common_tags
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  project_name       = local.project_name
  environment        = local.environment
  region             = local.region
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  task_cpu           = var.ecs_task_cpu
  task_memory        = var.ecs_task_memory
  desired_count      = var.ecs_desired_count
  common_tags        = local.common_tags
}

# RDS Aurora Global Database Module
module "rds_aurora_global" {
  source = "./modules/rds_aurora_global"

  project_name       = local.project_name
  environment        = local.environment
  region             = local.region
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  instance_class     = var.aurora_instance_class
  engine_version     = var.aurora_engine_version
  cluster_size       = var.aurora_cluster_size
  is_primary_region  = var.is_primary_region
  global_cluster_id  = var.aurora_global_cluster_id != "" ? var.aurora_global_cluster_id : null
  common_tags        = local.common_tags
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  project_name             = local.project_name
  environment              = local.environment
  region                   = local.region
  enable_replication       = var.s3_enable_replication
  replication_destinations = var.s3_replication_destinations
  common_tags              = local.common_tags
}

# Validation Module
module "validation" {
  source = "./modules/validation"

  workspace          = local.workspace
  aws_region         = var.aws_region
  environment_suffix = var.environment_suffix
  vpc_cidr           = var.vpc_cidr
  ecs_task_cpu       = var.ecs_task_cpu
  ecs_task_memory    = var.ecs_task_memory
}

# Removed complex remote state and drift detection logic
# Each workspace is independent and manages its own region/environment

# Comprehensive Outputs for Testing and Monitoring

# VPC Infrastructure Outputs
output "vpc_details" {
  description = "Complete VPC configuration details for testing"
  value = {
    vpc_id             = module.vpc.vpc_id
    vpc_arn            = "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:vpc/${module.vpc.vpc_id}"
    vpc_cidr           = module.vpc.vpc_cidr
    availability_zones = var.availability_zones
    public_subnet_ids  = module.vpc.public_subnet_ids
    private_subnet_ids = module.vpc.private_subnet_ids
    nat_gateway_ids    = module.vpc.nat_gateway_ids
    region             = var.aws_region
    environment        = var.environment_suffix
  }
}

output "networking_details" {
  description = "Network configuration for connectivity testing"
  value = {
    vpc_id               = module.vpc.vpc_id
    public_subnet_cidrs  = var.public_subnet_cidrs
    private_subnet_cidrs = var.private_subnet_cidrs
    availability_zones   = var.availability_zones
    nat_gateway_count    = length(module.vpc.nat_gateway_ids)
    subnet_distribution = {
      public_subnets  = length(module.vpc.public_subnet_ids)
      private_subnets = length(module.vpc.private_subnet_ids)
    }
  }
}

# ECS Infrastructure Outputs
output "ecs_details" {
  description = "ECS configuration details for application testing"
  value = {
    cluster_name        = module.ecs.cluster_name
    cluster_id          = module.ecs.cluster_id
    service_name        = module.ecs.service_name
    alb_dns_name        = module.ecs.alb_dns_name
    alb_url             = "http://${module.ecs.alb_dns_name}"
    task_definition_arn = module.ecs.task_definition_arn
    task_cpu            = module.ecs.task_cpu
    task_memory         = module.ecs.task_memory
    desired_count       = var.ecs_desired_count
  }
}

output "ecs_endpoints" {
  description = "ECS service endpoints for testing"
  value = {
    load_balancer_dns = module.ecs.alb_dns_name
    health_check_url  = "http://${module.ecs.alb_dns_name}/health"
    application_url   = "http://${module.ecs.alb_dns_name}"
    cluster_arn       = module.ecs.cluster_id
  }
}

# Aurora Database Outputs
output "aurora_details" {
  description = "Aurora database configuration details"
  value = {
    cluster_endpoint  = module.rds_aurora_global.cluster_endpoint
    reader_endpoint   = module.rds_aurora_global.reader_endpoint
    cluster_id        = module.rds_aurora_global.cluster_id
    global_cluster_id = module.rds_aurora_global.global_cluster_id
    instance_class    = module.rds_aurora_global.instance_class
    engine_version    = var.aurora_engine_version
    cluster_size      = var.aurora_cluster_size
    is_primary_region = var.is_primary_region
    port              = 3306
  }
  sensitive = true
}

output "database_connection_info" {
  description = "Database connection information for testing"
  value = {
    cluster_endpoint    = module.rds_aurora_global.cluster_endpoint
    reader_endpoint     = module.rds_aurora_global.reader_endpoint
    port                = 3306
    database_name       = "tapproddb"
    username            = "admin"
    password_secret_arn = var.is_primary_region ? "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${local.project_name}-${var.aws_region}-aurora-passwords-${var.environment_suffix}" : null
    connection_string   = "mysql://admin:<password>@${module.rds_aurora_global.cluster_endpoint}:3306/tapproddb"
  }
  sensitive = true
}

# S3 Storage Outputs
output "s3_details" {
  description = "S3 bucket configuration details"
  value = {
    bucket_name              = module.s3.bucket_name
    bucket_arn               = module.s3.bucket_arn
    bucket_region            = module.s3.bucket_region
    bucket_url               = "s3://${module.s3.bucket_name}"
    console_url              = "https://s3.console.aws.amazon.com/s3/buckets/${module.s3.bucket_name}"
    replication_enabled      = module.s3.replication_enabled
    replication_destinations = module.s3.replication_destinations
  }
}

output "storage_endpoints" {
  description = "Storage service endpoints for testing"
  value = {
    s3_bucket_name = module.s3.bucket_name
    s3_bucket_url  = "s3://${module.s3.bucket_name}"
    s3_console_url = "https://s3.console.aws.amazon.com/s3/buckets/${module.s3.bucket_name}"
    s3_region      = module.s3.bucket_region
  }
}

# Security and Access Outputs
output "security_details" {
  description = "Security configuration details for testing"
  value = {
    region              = var.aws_region
    account_id          = data.aws_caller_identity.current.account_id
    environment         = var.environment_suffix
    workspace           = local.workspace
    kms_key_arn         = var.is_primary_region ? "arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:alias/${local.project_name}-${var.aws_region}-aurora-${var.environment_suffix}" : null
    secrets_manager_arn = var.is_primary_region ? "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${local.project_name}-${var.aws_region}-aurora-passwords-${var.environment_suffix}" : null
  }
}

# Monitoring and Logging Outputs
output "monitoring_details" {
  description = "Monitoring and logging configuration for testing"
  value = {
    cloudwatch_log_group = "/ecs/${local.project_name}-${var.aws_region}-${var.environment_suffix}"
    log_group_arn        = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${local.project_name}-${var.aws_region}-${var.environment_suffix}"
    performance_insights = var.is_primary_region ? true : false
    enhanced_monitoring  = var.is_primary_region ? true : false
  }
}

# Testing and Validation Outputs
output "validation_status" {
  description = "Configuration validation status"
  value       = module.validation.validation_passed
}

output "testing_endpoints" {
  description = "All endpoints for comprehensive testing"
  value = {
    application = {
      alb_url          = "http://${module.ecs.alb_dns_name}"
      health_check_url = "http://${module.ecs.alb_dns_name}/health"
      cluster_name     = module.ecs.cluster_name
    }
    database = {
      write_endpoint = module.rds_aurora_global.cluster_endpoint
      read_endpoint  = module.rds_aurora_global.reader_endpoint
      port           = 3306
    }
    storage = {
      bucket_url  = "s3://${module.s3.bucket_name}"
      console_url = "https://s3.console.aws.amazon.com/s3/buckets/${module.s3.bucket_name}"
    }
    monitoring = {
      cloudwatch_logs = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#logsV2:log-groups/log-group/$252Fecs$252F${local.project_name}-${var.aws_region}-${var.environment_suffix}"
    }
  }
}

# Resource Summary for Cost and Usage Tracking
output "resource_summary" {
  description = "Summary of deployed resources for cost tracking"
  value = {
    region             = var.aws_region
    environment        = var.environment_suffix
    workspace          = local.workspace
    vpc_count          = 1
    subnet_count       = length(var.public_subnet_cidrs) + length(var.private_subnet_cidrs)
    nat_gateway_count  = var.enable_nat_gateway ? length(var.availability_zones) : 0
    ecs_service_count  = 1
    ecs_task_count     = var.ecs_desired_count
    rds_cluster_count  = 1
    rds_instance_count = var.aurora_cluster_size
    s3_bucket_count    = 1
    deployment_time    = timestamp()
  }
}

# Data source for account ID
data "aws_caller_identity" "current" {}
```

## lib/prod.tfvars

```hcl
# prod-use1.tfvars
# Production environment in US East 1
# Workspace: prod-use1

# Region Configuration
aws_region         = "us-east-1"
environment_suffix = "prod"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# VPC Configuration
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]
enable_nat_gateway   = true

# ECS Configuration
ecs_task_cpu      = "1024"
ecs_task_memory   = "2048"
ecs_desired_count = 3

# Aurora Configuration (Primary Region)
aurora_instance_class    = "db.r5.large"
aurora_engine_version    = "8.0.mysql_aurora.3.04.0"
aurora_cluster_size      = 2
is_primary_region        = true
aurora_global_cluster_id = ""

# S3 Configuration - Disable replication initially until destination buckets exist
s3_enable_replication       = false
s3_replication_destinations = []

# Tagging
repository    = "iac-test-automations"
commit_author = "automation"
pr_number     = "main"
team          = "platform"
```

## lib/eu-west-1-prod.tfvars

```hcl
# Region Configuration
aws_region         = "eu-west-1"
environment_suffix = "prod"
availability_zones = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]

# VPC Configuration
vpc_cidr             = "10.1.0.0/16"
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]
enable_nat_gateway   = true

# ECS Configuration
ecs_task_cpu      = "1024"
ecs_task_memory   = "2048"
ecs_desired_count = 3

# Aurora Configuration (Secondary Region)
aurora_instance_class    = "db.r5.large"
aurora_engine_version    = "8.0.mysql_aurora.3.04.0"
aurora_cluster_size      = 2
is_primary_region        = false
aurora_global_cluster_id = "global-cluster-tap-prod" # Set this after primary region is created

# S3 Configuration
s3_enable_replication       = false
s3_replication_destinations = []

# Tagging
repository    = "iac-test-automations"
commit_author = "automation"
pr_number     = "main"
team          = "platform"
```

## lib/staging.tfvars

```hcl
# Region Configuration
aws_region         = "ap-southeast-1"
environment_suffix = "staging"
availability_zones = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]

# VPC Configuration
vpc_cidr             = "10.2.0.0/16"
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
private_subnet_cidrs = ["10.2.10.0/24", "10.2.20.0/24", "10.2.30.0/24"]
enable_nat_gateway   = true

# ECS Configuration
ecs_task_cpu      = "512"
ecs_task_memory   = "1024"
ecs_desired_count = 1

# Aurora Configuration (Independent staging cluster - not part of global)
aurora_instance_class    = "db.t3.medium"
aurora_engine_version    = "8.0.mysql_aurora.3.04.0"
aurora_cluster_size      = 1
is_primary_region        = true # Independent staging cluster
aurora_global_cluster_id = ""

# S3 Configuration
s3_enable_replication       = false
s3_replication_destinations = []

# Tagging
repository    = "iac-test-automations"
commit_author = "automation"
pr_number     = "main"
team          = "platform"
```

## lib/modules/vpc/main.tf

```hcl
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway"
  type        = bool
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-vpc-${var.environment}"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-igw-${var.environment}"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-public-subnet-${count.index + 1}-${var.environment}"
      Type = "Public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-private-subnet-${count.index + 1}-${var.environment}"
      Type = "Private"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? length(var.availability_zones) : 0

  domain = "vpc"

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-nat-eip-${count.index + 1}-${var.environment}"
    }
  )
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? length(var.availability_zones) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-nat-${count.index + 1}-${var.environment}"
    }
  )
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-public-rt-${var.environment}"
    }
  )
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-private-rt-${count.index + 1}-${var.environment}"
    }
  )
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_arn" {
  description = "The ARN of the VPC"
  value       = aws_vpc.main.arn
}

output "vpc_cidr" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_cidrs" {
  description = "List of CIDR blocks of public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "List of CIDR blocks of private subnets"
  value       = aws_subnet.private[*].cidr_block
}

output "public_subnet_arns" {
  description = "List of ARNs of public subnets"
  value       = aws_subnet.public[*].arn
}

output "private_subnet_arns" {
  description = "List of ARNs of private subnets"
  value       = aws_subnet.private[*].arn
}

output "availability_zones" {
  description = "List of availability zones of subnets"
  value       = aws_subnet.public[*].availability_zone
}

output "nat_gateway_ids" {
  description = "List of IDs of NAT gateways"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "List of public IPs of NAT gateways"
  value       = aws_nat_gateway.main[*].public_ip
}

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "internet_gateway_arn" {
  description = "The ARN of the Internet Gateway"
  value       = aws_internet_gateway.main.arn
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of IDs of private route tables"
  value       = aws_route_table.private[*].id
}
```

## lib/modules/vpc/versions.tf

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "= 5.0.0"
    }
  }
}
```

## lib/modules/ecs/main.tf

```hcl
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "task_cpu" {
  description = "Task CPU units"
  type        = string
}

variable "task_memory" {
  description = "Task memory"
  type        = string
}

variable "desired_count" {
  description = "Desired task count"
  type        = number
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.region}-cluster-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = var.common_tags
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${var.region}-alb-sg-${var.environment}-"
  vpc_id      = var.vpc_id

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

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-alb-sg-${var.environment}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${var.project_name}-${var.region}-ecs-tasks-sg-${var.environment}-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-ecs-tasks-sg-${var.environment}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.region}-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false
  enable_http2               = true

  tags = var.common_tags
}

# ALB Target Group
resource "aws_lb_target_group" "main" {
  name_prefix = substr("${var.project_name}-${var.environment}-", 0, 6)
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-tg-${var.environment}"
    }
  )
}

# ALB Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-${var.region}-ecs-task-exec-role-${var.environment}"

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

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for ECS Task
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-${var.region}-ecs-task-role-${var.environment}"

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

  tags = var.common_tags
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}-${var.region}-${var.environment}"
  retention_in_days = 30

  tags = var.common_tags
}

# ECS Task Definition
resource "aws_ecs_task_definition" "main" {
  family                   = "${var.project_name}-${var.region}-task-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "${var.project_name}-container"
      image = "nginx:latest"

      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        },
        {
          name  = "REGION"
          value = var.region
        }
      ]
    }
  ])

  tags = var.common_tags
}

# ECS Service
resource "aws_ecs_service" "main" {
  name            = "${var.project_name}-${var.region}-service-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "${var.project_name}-container"
    container_port   = 80
  }

  depends_on = [
    aws_lb_listener.main,
    aws_iam_role_policy_attachment.ecs_task_execution_role_policy
  ]

  tags = var.common_tags
}

# Outputs
output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "cluster_id" {
  description = "ID/ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "service_id" {
  description = "ID/ARN of the ECS service"
  value       = aws_ecs_service.main.id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Hosted zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "ID of the ECS tasks security group"
  value       = aws_security_group.ecs_tasks.id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "target_group_name" {
  description = "Name of the target group"
  value       = aws_lb_target_group.main.name
}

output "listener_arn" {
  description = "ARN of the ALB listener"
  value       = aws_lb_listener.main.arn
}

output "task_definition_arn" {
  description = "ARN of the task definition"
  value       = aws_ecs_task_definition.main.arn
}

output "task_definition_family" {
  description = "Family of the task definition"
  value       = aws_ecs_task_definition.main.family
}

output "task_definition_revision" {
  description = "Revision of the task definition"
  value       = aws_ecs_task_definition.main.revision
}

output "task_cpu" {
  description = "CPU units for the task"
  value       = var.task_cpu
}

output "task_memory" {
  description = "Memory for the task"
  value       = var.task_memory
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.arn
}

output "task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}
```

## lib/modules/ecs/versions.tf

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "= 5.0.0"
    }
  }
}
```

## lib/modules/rds_aurora_global/main.tf

```hcl
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "instance_class" {
  description = "DB instance class"
  type        = string
}

variable "engine_version" {
  description = "Aurora engine version"
  type        = string
}

variable "cluster_size" {
  description = "Number of instances"
  type        = number
}

variable "is_primary_region" {
  description = "Is this the primary region"
  type        = bool
}

variable "global_cluster_id" {
  description = "Global cluster ID for secondary regions"
  type        = string
  default     = null
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
}

# Security Group for Aurora
resource "aws_security_group" "aurora" {
  name_prefix = "${var.project_name}-${var.region}-aurora-sg-${var.environment}-"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.current.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-aurora-sg-${var.environment}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Get VPC data
data "aws_vpc" "current" {
  id = var.vpc_id
}

# DB Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name       = "${var.project_name}-${var.region}-aurora-subnet-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-aurora-subnet-${var.environment}"
    }
  )
}

# Aurora Global Cluster (only in primary region)
resource "aws_rds_global_cluster" "main" {
  count = var.is_primary_region ? 1 : 0

  global_cluster_identifier = "${var.project_name}-global-cluster-${var.environment}"
  engine                    = "aurora-mysql"
  engine_version            = var.engine_version
  database_name             = replace("${var.project_name}${var.environment}db", "-", "")
  storage_encrypted         = true
}

# KMS Key for encryption
resource "aws_kms_key" "aurora" {
  description = "${var.project_name}-${var.region}-aurora-kms-${var.environment}"

  tags = var.common_tags
}

resource "aws_kms_alias" "aurora" {
  name          = "alias/${var.project_name}-${var.region}-aurora-${var.environment}"
  target_key_id = aws_kms_key.aurora.key_id
}

# Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier = "${var.project_name}-${var.region}-aurora-cluster-${var.environment}"

  engine         = "aurora-mysql"
  engine_version = var.engine_version
  engine_mode    = "provisioned"

  database_name   = var.is_primary_region ? replace("${var.project_name}${var.environment}db", "-", "") : null
  master_username = var.is_primary_region ? "admin" : null
  master_password = var.is_primary_region ? random_password.master[0].result : null

  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  global_cluster_identifier = var.is_primary_region ? aws_rds_global_cluster.main[0].id : var.global_cluster_id

  storage_encrypted = true
  kms_key_id        = aws_kms_key.aurora.arn

  backup_retention_period = var.is_primary_region ? 7 : 1
  preferred_backup_window = "03:00-04:00"

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  skip_final_snapshot       = true
  final_snapshot_identifier = "${var.project_name}-${var.region}-final-snapshot-${var.environment}-${replace(timestamp(), ":", "-")}"

  tags = var.common_tags

  depends_on = [
    aws_rds_global_cluster.main
  ]
}

# Random password for master user
resource "random_password" "master" {
  count = var.is_primary_region ? 1 : 0

  length           = 32
  special          = true
  override_special = "!#$%&*+-=?^_`{|}~" # Exclude '/', '@', '"', ' ' which are not allowed by RDS
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  count = var.is_primary_region ? 1 : 0

  name = "${var.project_name}-${var.region}-aurora-passwords-${var.environment}"

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  count = var.is_primary_region ? 1 : 0

  secret_id     = aws_secretsmanager_secret.db_password[0].id
  secret_string = random_password.master[0].result
}

# Aurora Instances
resource "aws_rds_cluster_instance" "cluster_instances" {
  count = var.cluster_size

  identifier         = "${var.project_name}-${var.region}-aurora-instance-${count.index + 1}-${var.environment}"
  cluster_identifier = aws_rds_cluster.main.id
  engine             = "aurora-mysql"
  engine_version     = var.engine_version
  instance_class     = var.instance_class

  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.aurora_monitoring.arn

  performance_insights_enabled = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-aurora-instance-${count.index + 1}-${var.environment}"
    }
  )
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "aurora_monitoring" {
  name = "${var.project_name}-${var.region}-aurora-monitoring-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "aurora_monitoring" {
  role       = aws_iam_role.aurora_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Outputs
output "cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_id" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "cluster_arn" {
  description = "Aurora cluster ARN"
  value       = aws_rds_cluster.main.arn
}

output "cluster_resource_id" {
  description = "Aurora cluster resource ID"
  value       = aws_rds_cluster.main.cluster_resource_id
}

output "global_cluster_id" {
  description = "Aurora global cluster identifier"
  value       = var.is_primary_region ? aws_rds_global_cluster.main[0].id : var.global_cluster_id
}

output "global_cluster_arn" {
  description = "Aurora global cluster ARN"
  value       = var.is_primary_region ? aws_rds_global_cluster.main[0].arn : null
}

output "cluster_port" {
  description = "Aurora cluster port"
  value       = aws_rds_cluster.main.port
}

output "cluster_database_name" {
  description = "Aurora cluster database name"
  value       = aws_rds_cluster.main.database_name
}

output "cluster_master_username" {
  description = "Aurora cluster master username"
  value       = aws_rds_cluster.main.master_username
}

output "instance_class" {
  description = "Aurora instance class"
  value       = var.instance_class
}

output "instance_identifiers" {
  description = "List of Aurora instance identifiers"
  value       = aws_rds_cluster_instance.cluster_instances[*].identifier
}

output "instance_endpoints" {
  description = "List of Aurora instance endpoints"
  value       = aws_rds_cluster_instance.cluster_instances[*].endpoint
}

output "instance_arns" {
  description = "List of Aurora instance ARNs"
  value       = aws_rds_cluster_instance.cluster_instances[*].arn
}

output "security_group_id" {
  description = "ID of the Aurora security group"
  value       = aws_security_group.aurora.id
}

output "subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.aurora.name
}

output "kms_key_id" {
  description = "KMS key ID used for encryption"
  value       = aws_kms_key.aurora.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = aws_kms_key.aurora.arn
}

output "secrets_manager_secret_arn" {
  description = "Secrets Manager secret ARN for the database password"
  value       = var.is_primary_region ? aws_secretsmanager_secret.db_password[0].arn : null
}

output "monitoring_role_arn" {
  description = "IAM role ARN for enhanced monitoring"
  value       = aws_iam_role.aurora_monitoring.arn
}

output "engine_version" {
  description = "Aurora engine version"
  value       = var.engine_version
}

output "cluster_size" {
  description = "Number of instances in the cluster"
  value       = var.cluster_size
}
```

## lib/modules/rds_aurora_global/versions.tf

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "= 5.0.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "= 3.5.0"
    }
  }
}
```

## lib/modules/s3/main.tf

```hcl
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "enable_replication" {
  description = "Enable S3 replication"
  type        = bool
}

variable "replication_destinations" {
  description = "Replication destination regions"
  type        = list(string)
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
}

# S3 Bucket
resource "aws_s3_bucket" "main" {
  bucket = "${var.project_name}-${var.region}-data-log-${var.environment}"

  tags = var.common_tags
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "archive-old-objects"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# IAM Role for Replication
resource "aws_iam_role" "replication" {
  count = var.enable_replication ? 1 : 0

  name = "${var.project_name}-${var.region}-s3-replication-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

# IAM Policy for Replication
resource "aws_iam_role_policy" "replication" {
  count = var.enable_replication ? 1 : 0

  role = aws_iam_role.replication[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.main.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = [
          for region in var.replication_destinations :
          "arn:aws:s3:::${var.project_name}-${region}-data-*/*"
        ]
      }
    ]
  })
}

# S3 Bucket Replication Configuration
resource "aws_s3_bucket_replication_configuration" "main" {
  count = var.enable_replication && length(var.replication_destinations) > 0 ? 1 : 0

  role   = aws_iam_role.replication[0].arn
  bucket = aws_s3_bucket.main.id

  dynamic "rule" {
    for_each = var.replication_destinations
    content {
      id     = "replicate-to-${rule.value}"
      status = "Enabled"

      filter {}

      destination {
        bucket        = "arn:aws:s3:::${var.project_name}-${rule.value}-data-staging"
        storage_class = "STANDARD_IA"
      }

      delete_marker_replication {
        status = "Enabled"
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.main]
}

# Outputs
output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "S3 bucket regional domain name"
  value       = aws_s3_bucket.main.bucket_regional_domain_name
}

output "bucket_region" {
  description = "S3 bucket region"
  value       = aws_s3_bucket.main.region
}

output "bucket_hosted_zone_id" {
  description = "S3 bucket hosted zone ID"
  value       = aws_s3_bucket.main.hosted_zone_id
}

output "bucket_tags" {
  description = "S3 bucket tags"
  value       = aws_s3_bucket.main.tags_all
}

output "versioning_configuration" {
  description = "S3 bucket versioning configuration"
  value = {
    status = aws_s3_bucket_versioning.main.versioning_configuration[0].status
  }
}

output "encryption_configuration" {
  description = "S3 bucket server-side encryption configuration"
  value = {
    sse_algorithm = tolist(aws_s3_bucket_server_side_encryption_configuration.main.rule)[0].apply_server_side_encryption_by_default[0].sse_algorithm
  }
}

output "replication_enabled" {
  description = "Whether S3 bucket replication is enabled"
  value       = var.enable_replication
}

output "replication_destinations" {
  description = "S3 bucket replication destinations"
  value       = var.replication_destinations
}

output "replication_role_arn" {
  description = "ARN of the IAM role used for S3 replication"
  value       = var.enable_replication ? aws_iam_role.replication[0].arn : null
}

output "replication_role_name" {
  description = "Name of the IAM role used for S3 replication"
  value       = var.enable_replication ? aws_iam_role.replication[0].name : null
}

output "replication_configuration_status" {
  description = "S3 bucket replication configuration status"
  value = var.enable_replication && length(var.replication_destinations) > 0 ? {
    enabled           = true
    destination_count = length(var.replication_destinations)
    destinations      = var.replication_destinations
    } : {
    enabled           = false
    destination_count = 0
    destinations      = []
  }
}

output "lifecycle_configuration" {
  description = "S3 bucket lifecycle configuration"
  value = {
    lifecycle_rules = aws_s3_bucket_lifecycle_configuration.main.rule[*]
  }
}

output "public_access_block" {
  description = "S3 bucket public access block configuration"
  value = {
    block_public_acls       = aws_s3_bucket_public_access_block.main.block_public_acls
    block_public_policy     = aws_s3_bucket_public_access_block.main.block_public_policy
    ignore_public_acls      = aws_s3_bucket_public_access_block.main.ignore_public_acls
    restrict_public_buckets = aws_s3_bucket_public_access_block.main.restrict_public_buckets
  }
}
```

## lib/modules/s3/versions.tf

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "= 5.0.0"
    }
  }
}
```

## lib/modules/validation/main.tf

```hcl
variable "workspace" {
  description = "Current workspace"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
}

variable "ecs_task_cpu" {
  description = "ECS task CPU"
  type        = string
}

variable "ecs_task_memory" {
  description = "ECS task memory"
  type        = string
}

locals {
  # Define validation rules based on region and environment
  region_rules = {
    "us-east-1" = {
      expected_vpc_cidr_prefix = "10.0"
      min_ecs_cpu              = 256
      max_ecs_cpu              = 4096
      min_ecs_memory           = 512
      max_ecs_memory           = 8192
    }
    "eu-west-1" = {
      expected_vpc_cidr_prefix = "10.1"
      min_ecs_cpu              = 256
      max_ecs_cpu              = 4096
      min_ecs_memory           = 512
      max_ecs_memory           = 8192
    }
    "ap-southeast-1" = {
      expected_vpc_cidr_prefix = "10.2"
      min_ecs_cpu              = 256
      max_ecs_cpu              = 4096
      min_ecs_memory           = 512
      max_ecs_memory           = 8192
    }
  }

  environment_rules = {
    "prod" = {
      min_ecs_cpu    = 512
      min_ecs_memory = 1024
    }
    "staging" = {
      min_ecs_cpu    = 256
      min_ecs_memory = 512
    }
  }

  current_region_rules = lookup(local.region_rules, var.aws_region, {})
  current_env_rules    = lookup(local.environment_rules, var.environment_suffix, {})

  # Validation checks
  validation_errors = compact([
    # Region validation
    contains(keys(local.region_rules), var.aws_region) ? "" : "Unsupported region: ${var.aws_region}",

    # Environment validation  
    contains(keys(local.environment_rules), var.environment_suffix) ? "" : "Unsupported environment: ${var.environment_suffix}",

    # VPC CIDR validation (should match region pattern)
    length(local.current_region_rules) > 0 && startswith(var.vpc_cidr, local.current_region_rules.expected_vpc_cidr_prefix) ? "" : "VPC CIDR should start with ${lookup(local.current_region_rules, "expected_vpc_cidr_prefix", "10.x")} for region ${var.aws_region}",

    # ECS CPU validation
    tonumber(var.ecs_task_cpu) >= lookup(local.current_env_rules, "min_ecs_cpu", 256) ? "" : "ECS CPU ${var.ecs_task_cpu} is below minimum ${lookup(local.current_env_rules, "min_ecs_cpu", 256)} for environment ${var.environment_suffix}",

    # ECS Memory validation
    tonumber(var.ecs_task_memory) >= lookup(local.current_env_rules, "min_ecs_memory", 512) ? "" : "ECS Memory ${var.ecs_task_memory} is below minimum ${lookup(local.current_env_rules, "min_ecs_memory", 512)} for environment ${var.environment_suffix}",

    # ECS CPU/Memory ratio validation (Memory should be at least 2x CPU for Fargate)
    tonumber(var.ecs_task_memory) >= (tonumber(var.ecs_task_cpu) * 2) ? "" : "ECS Memory ${var.ecs_task_memory} should be at least 2x CPU ${var.ecs_task_cpu} for Fargate"
  ])

  validation_passed = length(local.validation_errors) == 0
}

# Null resource to force validation
resource "null_resource" "validate" {
  triggers = {
    validation_hash = md5(jsonencode({
      workspace   = var.workspace
      region      = var.aws_region
      environment = var.environment_suffix
      vpc_cidr    = var.vpc_cidr
      ecs_cpu     = var.ecs_task_cpu
      ecs_memory  = var.ecs_task_memory
    }))
  }

  provisioner "local-exec" {
    command = local.validation_passed ? "echo 'Validation passed'" : "echo 'Validation failed: ${join(", ", local.validation_errors)}' && exit 1"
  }
}

# Outputs
output "validation_passed" {
  description = "Whether all validation checks passed"
  value       = local.validation_passed
}

output "validation_errors" {
  description = "List of validation error messages"
  value       = local.validation_errors
}

output "validation_error_count" {
  description = "Number of validation errors"
  value       = length(local.validation_errors)
}

output "validation_summary" {
  description = "Summary of validation results"
  value = {
    status         = local.validation_passed ? "PASS" : "FAIL"
    total_checks   = 6
    failed_checks  = length(local.validation_errors)
    error_messages = local.validation_errors
    validation_hash = md5(jsonencode({
      workspace   = var.workspace
      region      = var.aws_region
      environment = var.environment_suffix
      vpc_cidr    = var.vpc_cidr
      ecs_cpu     = var.ecs_task_cpu
      ecs_memory  = var.ecs_task_memory
    }))
  }
}

output "expected_config" {
  description = "Expected configuration for current region and environment"
  value = {
    region_rules = local.current_region_rules
    env_rules    = local.current_env_rules
    workspace    = var.workspace
    region       = var.aws_region
    environment  = var.environment_suffix
  }
}

output "current_config" {
  description = "Current configuration values being validated"
  value = {
    workspace       = var.workspace
    aws_region      = var.aws_region
    environment     = var.environment_suffix
    vpc_cidr        = var.vpc_cidr
    ecs_task_cpu    = var.ecs_task_cpu
    ecs_task_memory = var.ecs_task_memory
  }
}

output "supported_regions" {
  description = "List of supported AWS regions"
  value       = keys(local.region_rules)
}

output "supported_environments" {
  description = "List of supported environment types"
  value       = keys(local.environment_rules)
}

output "region_specific_rules" {
  description = "Region-specific validation rules"
  value       = local.region_rules
}

output "environment_specific_rules" {
  description = "Environment-specific validation rules"
  value       = local.environment_rules
}

output "validation_checks_performed" {
  description = "Details of all validation checks performed"
  value = {
    region_supported = {
      check    = "Region is supported"
      input    = var.aws_region
      expected = keys(local.region_rules)
      passed   = contains(keys(local.region_rules), var.aws_region)
    }
    environment_supported = {
      check    = "Environment is supported"
      input    = var.environment_suffix
      expected = keys(local.environment_rules)
      passed   = contains(keys(local.environment_rules), var.environment_suffix)
    }
    vpc_cidr_pattern = {
      check           = "VPC CIDR matches region pattern"
      input           = var.vpc_cidr
      expected_prefix = lookup(local.current_region_rules, "expected_vpc_cidr_prefix", "unknown")
      passed          = length(local.current_region_rules) > 0 && startswith(var.vpc_cidr, local.current_region_rules.expected_vpc_cidr_prefix)
    }
    ecs_cpu_minimum = {
      check        = "ECS CPU meets environment minimum"
      input        = tonumber(var.ecs_task_cpu)
      expected_min = lookup(local.current_env_rules, "min_ecs_cpu", 256)
      passed       = tonumber(var.ecs_task_cpu) >= lookup(local.current_env_rules, "min_ecs_cpu", 256)
    }
    ecs_memory_minimum = {
      check        = "ECS Memory meets environment minimum"
      input        = tonumber(var.ecs_task_memory)
      expected_min = lookup(local.current_env_rules, "min_ecs_memory", 512)
      passed       = tonumber(var.ecs_task_memory) >= lookup(local.current_env_rules, "min_ecs_memory", 512)
    }
    ecs_memory_cpu_ratio = {
      check               = "ECS Memory is at least 2x CPU for Fargate"
      cpu_input           = tonumber(var.ecs_task_cpu)
      memory_input        = tonumber(var.ecs_task_memory)
      expected_min_memory = tonumber(var.ecs_task_cpu) * 2
      passed              = tonumber(var.ecs_task_memory) >= (tonumber(var.ecs_task_cpu) * 2)
    }
  }
}
```

## lib/modules/validation/versions.tf

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "= 3.2.0"
    }
  }
}
```

## lib/modules/drift_detection/main.tf

```hcl
variable "current_workspace" {
  description = "Current workspace name"
  type        = string
}

variable "workspaces_state" {
  description = "Remote state data for all workspaces"
  type        = any
}

variable "current_config" {
  description = "Current workspace configuration"
  type = object({
    vpc_cidr        = string
    subnet_cidrs    = list(string)
    ecs_cpu         = string
    ecs_memory      = string
    aurora_instance = string
    s3_replication  = bool
    tags            = map(string)
  })
}

locals {
  # Extract configurations from remote states
  workspace_configs = {
    for workspace, state in var.workspaces_state : workspace => {
      vpc_cidr        = try(state.outputs.vpc_details.value.vpc_cidr, "N/A")
      ecs_cpu         = try(state.outputs.ecs_details.value.task_cpu, "N/A")
      ecs_memory      = try(state.outputs.ecs_details.value.task_memory, "N/A")
      aurora_instance = try(state.outputs.aurora_details.value.instance_class, "N/A")
      s3_replication  = try(state.outputs.s3_details.value.replication_enabled, false)
    }
  }

  # Compare configurations
  drift_analysis = {
    for workspace, config in local.workspace_configs : workspace => {
      vpc_cidr_drift = workspace != var.current_workspace ? (
        config.vpc_cidr != var.current_config.vpc_cidr ? "Different" : "Same"
      ) : "Current"

      ecs_config_drift = workspace != var.current_workspace ? (
        config.ecs_cpu != var.current_config.ecs_cpu || config.ecs_memory != var.current_config.ecs_memory ? "Different" : "Same"
      ) : "Current"

      aurora_drift = workspace != var.current_workspace ? (
        config.aurora_instance != var.current_config.aurora_instance ? "Different" : "Same"
      ) : "Current"

      s3_drift = workspace != var.current_workspace ? (
        config.s3_replication != var.current_config.s3_replication ? "Different" : "Same"
      ) : "Current"
    }
  }

  # Summary of differences
  drift_summary = {
    total_workspaces  = length(var.workspaces_state)
    current_workspace = var.current_workspace
    differences = {
      for workspace, analysis in local.drift_analysis : workspace => {
        vpc_cidr       = analysis.vpc_cidr_drift == "Different" ? true : false
        ecs_config     = analysis.ecs_config_drift == "Different" ? true : false
        aurora         = analysis.aurora_drift == "Different" ? true : false
        s3_replication = analysis.s3_drift == "Different" ? true : false
      }
    }
    detailed_configs = local.workspace_configs
  }
}

# Outputs
output "drift_summary" {
  description = "Summary of configuration drift across workspaces"
  value       = local.drift_summary
}

output "workspace_configs" {
  description = "Extracted configurations from all workspaces"
  value       = local.workspace_configs
}

output "drift_analysis" {
  description = "Detailed drift analysis"
  value       = local.drift_analysis
}
```


## lib/modules/drift_detection/versions.tf

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    terraform = {
      source = "terraform.io/builtin/terraform"
    }
  }
}
```


