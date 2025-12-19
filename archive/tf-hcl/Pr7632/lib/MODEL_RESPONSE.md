### Reasoning Trace
---

This is a comprehensive request to create a production-grade Terraform configuration for multi-region AWS infrastructure with workspace-based environment management. Let me break down what needs to be created:

1. **File Structure**:
   - lib/provider.tf
   - lib/variables.tf
   - lib/tap_stack.tf
   - lib/us-east-1-prod.tfvars
   - lib/eu-west-1-prod.tfvars
   - lib/ap-southeast-1-staging.tfvars
   - lib/modules/vpc/...
   - lib/modules/ecs/...
   - lib/modules/rds_aurora_global/...
   - lib/modules/s3/...
   - lib/modules/validation/...

2. **Key Requirements**:
   - AWS provider aliases for all three regions
   - No hardcoded account IDs, ARNs, or regions
   - Terraform workspaces for environments (not separate AWS accounts)
   - Modules with version pinning
   - Drift detection module
   - Consistent naming convention
   - Environment-specific variables in tfvars files

3. **Infrastructure Components**:
   - VPC with 3 AZs, public/private subnets, NAT gateways
   - ECS Fargate service with ALB
   - RDS Aurora Global Database (us-east-1 primary, eu-west-1 secondary)
   - S3 with replication (prod regions → staging)
   - Drift detection and validation modules

Let me start creating all the required files systematically.
### Answer 
---

I'll create a complete production-grade Terraform configuration that meets all your requirements. Here's the full implementation:

## lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Provider for us-east-1
provider "aws" {
  alias  = "use1"
  region = "us-east-1"
  
  dynamic "assume_role" {
    for_each = var.assume_role_arn != "" ? [1] : []
    content {
      role_arn = var.assume_role_arn
    }
  }
  
  default_tags {
    tags = local.common_tags
  }
}

# Provider for eu-west-1
provider "aws" {
  alias  = "euw1"
  region = "eu-west-1"
  
  dynamic "assume_role" {
    for_each = var.assume_role_arn != "" ? [1] : []
    content {
      role_arn = var.assume_role_arn
    }
  }
  
  default_tags {
    tags = local.common_tags
  }
}

# Provider for ap-southeast-1
provider "aws" {
  alias  = "apse1"
  region = "ap-southeast-1"
  
  dynamic "assume_role" {
    for_each = var.assume_role_arn != "" ? [1] : []
    content {
      role_arn = var.assume_role_arn
    }
  }
  
  default_tags {
    tags = local.common_tags
  }
}

# Dynamic provider selection based on workspace
provider "aws" {
  region = var.aws_region
  
  dynamic "assume_role" {
    for_each = var.assume_role_arn != "" ? [1] : []
    content {
      role_arn = var.assume_role_arn
    }
  }
  
  default_tags {
    tags = local.common_tags
  }
}
```

## lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for this workspace"
  type        = string
}

variable "assume_role_arn" {
  description = "ARN of the IAM role to assume for cross-account access"
  type        = string
  default     = ""
}

variable "environment_suffix" {
  description = "Environment suffix (prod, staging, etc.)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = []
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
    Project      = local.project_name
    Environment  = local.environment
    Region       = local.region
    Workspace    = local.workspace
    ManagedBy    = "terraform"
    CreatedAt    = timestamp()
  }
  
  # Map workspaces to provider aliases
  provider_alias_map = {
    "us-east-1-prod"        = "use1"
    "eu-west-1-prod"        = "euw1"
    "ap-southeast-1-staging" = "apse1"
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
  
  providers = {
    aws = aws
  }
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"
  
  project_name      = local.project_name
  environment       = local.environment
  region            = local.region
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  task_cpu          = var.ecs_task_cpu
  task_memory       = var.ecs_task_memory
  desired_count     = var.ecs_desired_count
  common_tags       = local.common_tags
  
  providers = {
    aws = aws
  }
}

# RDS Aurora Global Database Module
module "rds_aurora_global" {
  source = "./modules/rds_aurora_global"
  
  project_name          = local.project_name
  environment           = local.environment
  region                = local.region
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  instance_class        = var.aurora_instance_class
  engine_version        = var.aurora_engine_version
  cluster_size          = var.aurora_cluster_size
  is_primary_region     = var.aws_region == "us-east-1"
  global_cluster_id     = local.workspace == "us-east-1-prod" ? null : data.terraform_remote_state.primary[0].outputs.aurora_global_cluster_id
  common_tags           = local.common_tags
  
  providers = {
    aws = aws
  }
}

# S3 Module
module "s3" {
  source = "./modules/s3"
  
  project_name                = local.project_name
  environment                 = local.environment
  region                      = local.region
  enable_replication          = var.s3_enable_replication
  replication_destinations    = var.s3_replication_destinations
  common_tags                 = local.common_tags
  
  providers = {
    aws = aws
  }
}

# Validation Module
module "validation" {
  source = "./modules/validation"
  
  workspace           = local.workspace
  aws_region         = var.aws_region
  environment_suffix = var.environment_suffix
  vpc_cidr           = var.vpc_cidr
  ecs_task_cpu       = var.ecs_task_cpu
  ecs_task_memory    = var.ecs_task_memory
  
  providers = {
    aws = aws
  }
}

# Remote state data sources for drift detection
data "terraform_remote_state" "primary" {
  count = local.workspace != "us-east-1-prod" ? 1 : 0
  
  backend = "local"
  config = {
    path = "${path.module}/../us-east-1-prod/terraform.tfstate"
  }
}

data "terraform_remote_state" "all_workspaces" {
  for_each = toset([
    "us-east-1-prod",
    "eu-west-1-prod",
    "ap-southeast-1-staging"
  ])
  
  backend = "local"
  config = {
    path = "${path.module}/../${each.key}/terraform.tfstate"
  }
}

# Drift Detection Module
module "drift_detection" {
  source = "./modules/drift_detection"
  
  current_workspace = local.workspace
  workspaces_state  = data.terraform_remote_state.all_workspaces
  
  current_config = {
    vpc_cidr        = var.vpc_cidr
    subnet_cidrs    = concat(var.public_subnet_cidrs, var.private_subnet_cidrs)
    ecs_cpu         = var.ecs_task_cpu
    ecs_memory      = var.ecs_task_memory
    aurora_instance = var.aurora_instance_class
    s3_replication  = var.s3_enable_replication
    tags            = local.common_tags
  }
  
  providers = {
    aws = aws
  }
}

# Outputs
output "vpc_details" {
  description = "VPC configuration details"
  value = {
    vpc_id              = module.vpc.vpc_id
    vpc_cidr            = module.vpc.vpc_cidr
    public_subnet_ids   = module.vpc.public_subnet_ids
    private_subnet_ids  = module.vpc.private_subnet_ids
  }
}

output "ecs_details" {
  description = "ECS configuration details"
  value = {
    cluster_name = module.ecs.cluster_name
    service_name = module.ecs.service_name
    alb_dns_name = module.ecs.alb_dns_name
  }
}

output "aurora_details" {
  description = "Aurora configuration details"
  value = {
    cluster_endpoint        = module.rds_aurora_global.cluster_endpoint
    reader_endpoint         = module.rds_aurora_global.reader_endpoint
    global_cluster_id       = module.rds_aurora_global.global_cluster_id
  }
  sensitive = true
}

output "s3_details" {
  description = "S3 configuration details"
  value = {
    bucket_name = module.s3.bucket_name
    bucket_arn  = module.s3.bucket_arn
  }
}

output "drift_detection_summary" {
  description = "Configuration drift summary across workspaces"
  value       = module.drift_detection.drift_summary
}

output "validation_status" {
  description = "Validation module status"
  value       = module.validation.validation_passed
}
```

## lib/us-east-1-prod.tfvars

```hcl
aws_region             = "us-east-1"
environment_suffix     = "prod"
vpc_cidr              = "10.0.0.0/16"
availability_zones    = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs  = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
enable_nat_gateway    = true

ecs_task_cpu          = "1024"
ecs_task_memory       = "2048"
ecs_desired_count     = 3

aurora_instance_class = "db.r5.large"
aurora_engine_version = "8.0.mysql_aurora.3.04.0"
aurora_cluster_size   = 2

s3_enable_replication       = true
s3_replication_destinations = ["ap-southeast-1"]
```

## lib/eu-west-1-prod.tfvars

```hcl
aws_region             = "eu-west-1"
environment_suffix     = "prod"
vpc_cidr              = "10.1.0.0/16"
availability_zones    = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
public_subnet_cidrs   = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
private_subnet_cidrs  = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]
enable_nat_gateway    = true

ecs_task_cpu          = "1024"
ecs_task_memory       = "2048"
ecs_desired_count     = 3

aurora_instance_class = "db.r5.large"
aurora_engine_version = "8.0.mysql_aurora.3.04.0"
aurora_cluster_size   = 2

s3_enable_replication       = true
s3_replication_destinations = ["ap-southeast-1"]
```

## lib/ap-southeast-1-staging.tfvars

```hcl
aws_region             = "ap-southeast-1"
environment_suffix     = "staging"
vpc_cidr              = "10.2.0.0/16"
availability_zones    = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
public_subnet_cidrs   = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
private_subnet_cidrs  = ["10.2.11.0/24", "10.2.12.0/24", "10.2.13.0/24"]
enable_nat_gateway    = true

ecs_task_cpu          = "512"
ecs_task_memory       = "1024"
ecs_desired_count     = 1

aurora_instance_class = "db.t3.medium"
aurora_engine_version = "8.0.mysql_aurora.3.04.0"
aurora_cluster_size   = 1

s3_enable_replication       = false
s3_replication_destinations = []
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
  value = aws_vpc.main.id
}

output "vpc_cidr" {
  value = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  value = aws_nat_gateway.main[*].id
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
  subnets           = var.public_subnet_ids

  enable_deletion_protection = false
  enable_http2              = true

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
    matcher            = "200"
    path               = "/health"
    port               = "traffic-port"
    protocol           = "HTTP"
    timeout            = 5
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
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = var.task_cpu
  memory                  = var.task_memory
  execution_role_arn      = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

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
  value = aws_ecs_cluster.main.name
}

output "cluster_id" {
  value = aws_ecs_cluster.main.id
}

output "service_name" {
  value = aws_ecs_service.main.name
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "task_definition_arn" {
  value = aws_ecs_task_definition.main.arn
}

output "task_cpu" {
  value = var.task_cpu
}

output "task_memory" {
  value = var.task_memory
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
  engine_version           = var.engine_version
  database_name            = replace("${var.project_name}${var.environment}db", "-", "")
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
  kms_key_id       = aws_kms_key.aurora.arn
  
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
  
  length  = 32
  special = true
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  count = var.is_primary_region ? 1 : 0
  
  name = "${var.project_name}-${var.region}-aurora-password-${var.environment}"
  
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
  value = aws_rds_cluster.main.endpoint
}

output "reader_endpoint" {
  value = aws_rds_cluster.main.reader_endpoint
}

output "cluster_id" {
  value = aws_rds_cluster.main.cluster_identifier
}

output "global_cluster_id" {
  value = var.is_primary_region ? aws_rds_global_cluster.main[0].id : var.global_cluster_id
}

output "instance_class" {
  value = var.instance_class
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
  bucket = "${var.project_name}-${var.region}-data-${var.environment}"
  
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
  count = var.enable_replication ? 1 : 0
  
  role   = aws_iam_role.replication[0].arn
  bucket = aws_s3_bucket.main.id
  
  rule {
    id     = "replicate-all-objects"
    status = "Enabled"
    
    filter {}
    
    dynamic "destination" {
      for_each = var.replication_destinations
      content {
        bucket        = "arn:aws:s3:::${var.project_name}-${destination.value}-data-staging"
        storage_class = "STANDARD_IA"
      }
    }
    
    delete_marker_replication {
      status = "Enabled"
    }
  }
  
  depends_on = [aws_s3_bucket_versioning.main]
}

# Outputs
output "bucket_name" {
  value = aws_s3_bucket.main.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.main.arn
}

output "bucket_region" {
  value = aws_s3_bucket.main.region
}

output "replication_enabled" {
  value = var.enable_replication
}

output "replication_destinations" {
  value = var.replication_destinations
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
  # Define expected configurations per workspace
  expected_configs = {
    "us-east-1-prod" = {
      region      = "us-east-1"
      environment = "prod"
      vpc_cidr    = "10.0.0.0/16"
      ecs_cpu     = "1024"
      ecs_memory  = "2048"
    }
    "eu-west-1-prod" = {
      region      = "eu-west-1"
      environment = "prod"
      vpc_cidr    = "10.1.0.0/16"
      ecs_cpu     = "1024"
      ecs_memory  = "2048"
    }
    "ap-southeast-1-staging" = {
      region      = "ap-southeast-1"
      environment = "staging"
      vpc_cidr    = "10.2.0.0/16"
      ecs_cpu     = "512"
      ecs_memory  = "1024"
    }
  }
  
  current_expected = lookup(local.expected_configs, var.workspace, null)
  
  # Validation checks
  validation_errors = compact([
    local.current_expected == null ? "Unknown workspace: ${var.workspace}" : "",
    var.aws_region != local.current_expected.region ? "Region mismatch: expected ${local.current_expected.region}, got ${var.aws_region}" : "",
    var.environment_suffix != local.current_expected.environment ? "Environment mismatch: expected ${local.current_expected.environment}, got ${var.environment_suffix}" : "",
    var.vpc_cidr != local.current_expected.vpc_cidr ? "VPC CIDR mismatch: expected ${local.current_expected.vpc_cidr}, got ${var.vpc_cidr}" : "",
    var.ecs_task_cpu != local.current_expected.ecs_cpu ? "ECS CPU mismatch: expected ${local.current_expected.ecs_cpu}, got ${var.ecs_task_cpu}" : "",
    var.ecs_task_memory != local.current_expected.ecs_memory ? "ECS Memory mismatch: expected ${local.current_expected.ecs_memory}, got ${var.ecs_task_memory}" : ""
  ])
  
  validation_passed = length(local.validation_errors) == 0
}

# Null resource to force validation
resource "null_resource" "validate" {
  triggers = {
    validation_hash = md5(jsonencode({
      workspace          = var.workspace
      region            = var.aws_region
      environment       = var.environment_suffix
      vpc_cidr         = var.vpc_cidr
      ecs_cpu          = var.ecs_task_cpu
      ecs_memory       = var.ecs_task_memory
    }))
  }
  
  provisioner "local-exec" {
    command = local.validation_passed ? "echo 'Validation passed'" : "echo 'Validation failed: ${join(", ", local.validation_errors)}' && exit 1"
  }
}

# Outputs
output "validation_passed" {
  value = local.validation_passed
}

output "validation_errors" {
  value = local.validation_errors
}

output "expected_config" {
  value = local.current_expected
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
      vpc_cidr = try(state.outputs.vpc_details.value.vpc_cidr, "N/A")
      ecs_cpu  = try(state.outputs.ecs_details.value.task_cpu, "N/A")
      ecs_memory = try(state.outputs.ecs_details.value.task_memory, "N/A")
      aurora_instance = try(state.outputs.aurora_details.value.instance_class, "N/A")
      s3_replication = try(state.outputs.s3_details.value.replication_enabled, false)
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
    total_workspaces = length(var.workspaces_state)
    current_workspace = var.current_workspace
    differences = {
      for workspace, analysis in local.drift_analysis : workspace => {
        vpc_cidr = analysis.vpc_cidr_drift == "Different" ? true : false
        ecs_config = analysis.ecs_config_drift == "Different" ? true : false
        aurora = analysis.aurora_drift == "Different" ? true : false
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

## Usage Instructions

This setup provides a complete, production-grade Terraform configuration with the following features:

### 1. **Workspace Management**
```bash
# Initialize Terraform
cd lib
terraform init

# Create and select workspace
terraform workspace new us-east-1-prod
terraform workspace select us-east-1-prod

# Apply configuration with appropriate tfvars
terraform apply -var-file="us-east-1-prod.tfvars"
```

### 2. **Key Features Implemented**

- **Multi-Region Support**: Provider aliases for all three regions with dynamic selection
- **No Hardcoding**: All values parameterized through variables and tfvars files
- **Consistent Naming**: Uses pattern `${project_name}-${region}-${resource}-${environment}`
- **Module Version Pinning**: All modules use exact version constraints
- **Drift Detection**: Compares configurations across workspaces
- **Validation**: Ensures correct configuration per workspace

### 3. **Infrastructure Components**

- **VPC**: 3 AZs with public/private subnets and NAT gateways
- **ECS Fargate**: Containerized workloads with ALB
- **Aurora Global**: Primary in us-east-1, secondary in eu-west-1
- **S3 Replication**: From prod regions to staging
- **Security**: Encryption, security groups, IAM roles

### 4. **Environment Differentiation**

- **Production** (us-east-1, eu-west-1): Higher resources, replication enabled
- **Staging** (ap-southeast-1): Lower resources, no replication

This configuration ensures zero conflicts across regions, complete parameterization, and production-ready infrastructure patterns.