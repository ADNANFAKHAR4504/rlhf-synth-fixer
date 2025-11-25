### Reasoning Trace
---

The user is asking me to generate a Terraform configuration for a multi-region infrastructure deployment for a financial services company. Based on the requirements:

1. Three AWS regions: us-east-1, eu-west-1, and ap-southeast-1
2. Identical infrastructure in each region
3. Data residency requirements (no cross-region replication)
4. Components needed:
   - VPC with 3 AZs and specific CIDR blocks
   - Auto Scaling Groups with EC2 instances (Amazon Linux 2)
   - Application Load Balancers
   - RDS Aurora PostgreSQL clusters with read replicas
   - S3 buckets
   - Security groups
   - AWS Secrets Manager integration
5. Use of Terraform workspaces for environment separation
6. Proper tagging strategy
7. Modular design

I need to create a comprehensive Terraform configuration that includes:
- Provider configuration for multi-region
- Module definitions for reusable components
- Main configuration that deploys to all regions
- Proper outputs
- Variable definitions
- Security groups configuration
- State management setup

Let me create a complete tap_stack.tf file that encompasses all these requirements.
### Answer 
---

Based on your requirements for a multi-region financial services infrastructure with strict data residency requirements, here's a comprehensive Terraform configuration:

```hcl
# tap_stack.tf - Multi-Region Infrastructure Deployment

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Backend configuration for state management
  backend "s3" {
    # These values should be configured via backend config files or CLI
    # bucket         = "terraform-state-${terraform.workspace}"
    # key            = "infrastructure/terraform.tfstate"
    # region         = var.primary_region
    # dynamodb_table = "terraform-state-lock-${terraform.workspace}"
    encrypt        = true
  }
}

# ==================== VARIABLES ====================

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap-trading-platform"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "regions" {
  description = "Map of regions with their configurations"
  type = map(object({
    cidr_block = string
    azs        = list(string)
  }))
  default = {
    "us-east-1" = {
      cidr_block = "10.0.0.0/16"
      azs        = ["us-east-1a", "us-east-1b", "us-east-1c"]
    }
    "eu-west-1" = {
      cidr_block = "10.1.0.0/16"
      azs        = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
    }
    "ap-southeast-1" = {
      cidr_block = "10.2.0.0/16"
      azs        = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
    }
  }
}

variable "db_master_username" {
  description = "Master username for RDS Aurora"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "instance_type" {
  description = "EC2 instance type for compute resources"
  type        = string
  default     = "t3.medium"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 4
}

# ==================== LOCALS ====================

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Workspace   = terraform.workspace
  }
}

# ==================== PROVIDERS ====================

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "eu-west-1"
  region = "eu-west-1"
}

provider "aws" {
  alias  = "ap-southeast-1"
  region = "ap-southeast-1"
}

# ==================== DATA SOURCES ====================

data "aws_ami" "amazon_linux_2" {
  for_each = var.regions
  
  provider    = aws
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ==================== MODULES ====================

# US-EAST-1 Infrastructure
module "us_east_1" {
  source = "./modules/regional-infrastructure"
  
  providers = {
    aws = aws.us-east-1
  }
  
  region           = "us-east-1"
  project_name     = var.project_name
  environment      = var.environment
  vpc_cidr         = var.regions["us-east-1"].cidr_block
  availability_zones = var.regions["us-east-1"].azs
  
  # Compute configuration
  ami_id           = data.aws_ami.amazon_linux_2["us-east-1"].id
  instance_type    = var.instance_type
  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity
  
  # Database configuration
  db_master_username = var.db_master_username
  
  tags = merge(local.common_tags, {
    Region = "us-east-1"
  })
}

# EU-WEST-1 Infrastructure
module "eu_west_1" {
  source = "./modules/regional-infrastructure"
  
  providers = {
    aws = aws.eu-west-1
  }
  
  region           = "eu-west-1"
  project_name     = var.project_name
  environment      = var.environment
  vpc_cidr         = var.regions["eu-west-1"].cidr_block
  availability_zones = var.regions["eu-west-1"].azs
  
  # Compute configuration
  ami_id           = data.aws_ami.amazon_linux_2["eu-west-1"].id
  instance_type    = var.instance_type
  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity
  
  # Database configuration
  db_master_username = var.db_master_username
  
  tags = merge(local.common_tags, {
    Region = "eu-west-1"
  })
}

# AP-SOUTHEAST-1 Infrastructure
module "ap_southeast_1" {
  source = "./modules/regional-infrastructure"
  
  providers = {
    aws = aws.ap-southeast-1
  }
  
  region           = "ap-southeast-1"
  project_name     = var.project_name
  environment      = var.environment
  vpc_cidr         = var.regions["ap-southeast-1"].cidr_block
  availability_zones = var.regions["ap-southeast-1"].azs
  
  # Compute configuration
  ami_id           = data.aws_ami.amazon_linux_2["ap-southeast-1"].id
  instance_type    = var.instance_type
  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity
  
  # Database configuration
  db_master_username = var.db_master_username
  
  tags = merge(local.common_tags, {
    Region = "ap-southeast-1"
  })
}

# ==================== OUTPUTS ====================

output "us_east_1_infrastructure" {
  description = "US East 1 infrastructure details"
  value = {
    alb_dns_name = module.us_east_1.alb_dns_name
    rds_endpoint = module.us_east_1.rds_endpoint
    vpc_id       = module.us_east_1.vpc_id
    s3_bucket    = module.us_east_1.s3_bucket_name
  }
}

output "eu_west_1_infrastructure" {
  description = "EU West 1 infrastructure details"
  value = {
    alb_dns_name = module.eu_west_1.alb_dns_name
    rds_endpoint = module.eu_west_1.rds_endpoint
    vpc_id       = module.eu_west_1.vpc_id
    s3_bucket    = module.eu_west_1.s3_bucket_name
  }
}

output "ap_southeast_1_infrastructure" {
  description = "AP Southeast 1 infrastructure details"
  value = {
    alb_dns_name = module.ap_southeast_1.alb_dns_name
    rds_endpoint = module.ap_southeast_1.rds_endpoint
    vpc_id       = module.ap_southeast_1.vpc_id
    s3_bucket    = module.ap_southeast_1.s3_bucket_name
  }
}

# ==================== MODULE DEFINITION ====================
# This would typically be in ./modules/regional-infrastructure/main.tf

/*
module "regional-infrastructure" {
  # VPC Module
  module "vpc" {
    source = "../vpc"
    
    cidr_block         = var.vpc_cidr
    availability_zones = var.availability_zones
    project_name       = var.project_name
    environment        = var.environment
    tags              = var.tags
  }
  
  # Security Groups
  resource "aws_security_group" "alb" {
    name_prefix = "${var.project_name}-alb-"
    vpc_id      = module.vpc.vpc_id
    
    ingress {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "HTTPS from Internet"
    }
    
    ingress {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "HTTP from Internet"
    }
    
    egress {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
      description = "All outbound traffic"
    }
    
    tags = merge(var.tags, {
      Name = "${var.project_name}-alb-sg"
    })
  }
  
  resource "aws_security_group" "app" {
    name_prefix = "${var.project_name}-app-"
    vpc_id      = module.vpc.vpc_id
    
    ingress {
      from_port       = 80
      to_port         = 80
      protocol        = "tcp"
      security_groups = [aws_security_group.alb.id]
      description     = "HTTP from ALB"
    }
    
    egress {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
      description = "All outbound traffic"
    }
    
    tags = merge(var.tags, {
      Name = "${var.project_name}-app-sg"
    })
  }
  
  resource "aws_security_group" "database" {
    name_prefix = "${var.project_name}-db-"
    vpc_id      = module.vpc.vpc_id
    
    ingress {
      from_port       = 5432
      to_port         = 5432
      protocol        = "tcp"
      security_groups = [aws_security_group.app.id]
      description     = "PostgreSQL from app tier"
    }
    
    tags = merge(var.tags, {
      Name = "${var.project_name}-db-sg"
    })
  }
  
  # Secrets Manager for DB Password
  resource "random_password" "db_password" {
    length  = 32
    special = true
  }
  
  resource "aws_secretsmanager_secret" "db_password" {
    name_prefix = "${var.project_name}-${var.environment}-db-password-"
    description = "RDS Aurora master password"
    
    tags = var.tags
  }
  
  resource "aws_secretsmanager_secret_version" "db_password" {
    secret_id     = aws_secretsmanager_secret.db_password.id
    secret_string = random_password.db_password.result
  }
  
  # Application Load Balancer
  resource "aws_lb" "main" {
    name_prefix        = "tap-"
    internal           = false
    load_balancer_type = "application"
    security_groups    = [aws_security_group.alb.id]
    subnets           = module.vpc.public_subnet_ids
    
    enable_deletion_protection = true
    enable_http2              = true
    
    tags = merge(var.tags, {
      Name = "${var.project_name}-alb"
    })
  }
  
  resource "aws_lb_target_group" "main" {
    name_prefix = "tap-"
    port        = 80
    protocol    = "HTTP"
    vpc_id      = module.vpc.vpc_id
    
    health_check {
      enabled             = true
      healthy_threshold   = 2
      unhealthy_threshold = 2
      timeout             = 5
      interval            = 30
      path                = "/health"
      matcher             = "200"
    }
    
    tags = var.tags
  }
  
  resource "aws_lb_listener" "main" {
    load_balancer_arn = aws_lb.main.arn
    port              = "80"
    protocol          = "HTTP"
    
    default_action {
      type             = "forward"
      target_group_arn = aws_lb_target_group.main.arn
    }
  }
  
  # Launch Template for ASG
  resource "aws_launch_template" "main" {
    name_prefix   = "${var.project_name}-"
    image_id      = var.ami_id
    instance_type = var.instance_type
    
    vpc_security_group_ids = [aws_security_group.app.id]
    
    user_data = base64encode(templatefile("${path.module}/user-data.sh", {
      region       = var.region
      project_name = var.project_name
    }))
    
    tag_specifications {
      resource_type = "instance"
      tags = merge(var.tags, {
        Name = "${var.project_name}-instance"
      })
    }
    
    metadata_options {
      http_endpoint               = "enabled"
      http_tokens                 = "required"
      http_put_response_hop_limit = 1
    }
  }
  
  # Auto Scaling Group
  resource "aws_autoscaling_group" "main" {
    name_prefix         = "${var.project_name}-"
    vpc_zone_identifier = module.vpc.private_subnet_ids
    target_group_arns   = [aws_lb_target_group.main.arn]
    health_check_type   = "ELB"
    health_check_grace_period = 300
    
    min_size         = var.min_size
    max_size         = var.max_size
    desired_capacity = var.desired_capacity
    
    launch_template {
      id      = aws_launch_template.main.id
      version = "$Latest"
    }
    
    tag {
      key                 = "Name"
      value               = "${var.project_name}-asg"
      propagate_at_launch = true
    }
    
    dynamic "tag" {
      for_each = var.tags
      content {
        key                 = tag.key
        value               = tag.value
        propagate_at_launch = true
      }
    }
  }
  
  # RDS Aurora PostgreSQL Cluster
  resource "aws_db_subnet_group" "main" {
    name_prefix = "${var.project_name}-"
    subnet_ids  = module.vpc.database_subnet_ids
    
    tags = merge(var.tags, {
      Name = "${var.project_name}-db-subnet-group"
    })
  }
  
  resource "aws_rds_cluster" "main" {
    cluster_identifier     = "${var.project_name}-${var.environment}-cluster"
    engine                 = "aurora-postgresql"
    engine_version         = "15.3"
    database_name          = "tradingdb"
    master_username        = var.db_master_username
    master_password        = random_password.db_password.result
    
    db_subnet_group_name   = aws_db_subnet_group.main.name
    vpc_security_group_ids = [aws_security_group.database.id]
    
    backup_retention_period = 7
    preferred_backup_window = "03:00-04:00"
    preferred_maintenance_window = "sun:04:00-sun:05:00"
    
    enabled_cloudwatch_logs_exports = ["postgresql"]
    
    skip_final_snapshot = false
    final_snapshot_identifier = "${var.project_name}-${var.environment}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
    
    tags = var.tags
  }
  
  resource "aws_rds_cluster_instance" "main" {
    count = 2
    
    identifier         = "${var.project_name}-${var.environment}-instance-${count.index + 1}"
    cluster_identifier = aws_rds_cluster.main.id
    instance_class     = "db.r5.large"
    engine             = aws_rds_cluster.main.engine
    engine_version     = aws_rds_cluster.main.engine_version
    
    performance_insights_enabled = true
    monitoring_interval         = 60
    
    tags = merge(var.tags, {
      Name = "${var.project_name}-db-instance-${count.index + 1}"
    })
  }
  
  # S3 Bucket for regional data storage
  resource "aws_s3_bucket" "main" {
    bucket_prefix = "${var.project_name}-${var.environment}-${var.region}-"
    
    tags = merge(var.tags, {
      Name = "${var.project_name}-${var.environment}-bucket"
    })
  }
  
  resource "aws_s3_bucket_versioning" "main" {
    bucket = aws_s3_bucket.main.id
    
    versioning_configuration {
      status = "Enabled"
    }
  }
  
  resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
    bucket = aws_s3_bucket.main.id
    
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
  
  resource "aws_s3_bucket_public_access_block" "main" {
    bucket = aws_s3_bucket.main.id
    
    block_public_acls       = true
    block_public_policy     = true
    ignore_public_acls      = true
    restrict_public_buckets = true
  }
  
  # Outputs
  output "alb_dns_name" {
    value = aws_lb.main.dns_name
  }
  
  output "rds_endpoint" {
    value = aws_rds_cluster.main.endpoint
  }
  
  output "vpc_id" {
    value = module.vpc.vpc_id
  }
  
  output "s3_bucket_name" {
    value = aws_s3_bucket.main.id
  }
}
*/
```

## Key Features Explained

### 1. **Multi-Region Architecture**
The configuration deploys identical infrastructure across three regions using provider aliases. Each region gets its own:
- Non-overlapping CIDR blocks (10.0.0.0/16, 10.1.0.0/16, 10.2.0.0/16)
- Isolated resources with no cross-region dependencies

### 2. **Compliance & Data Residency**
- S3 buckets have no cross-region replication
- Each region stores its own secrets in Secrets Manager
- Database backups remain within their respective regions

### 3. **High Availability**
- Auto Scaling Groups span multiple availability zones
- RDS Aurora clusters include read replicas
- Application Load Balancers distribute traffic

### 4. **Security Implementation**
- Security groups follow the principle of least privilege
- Database access restricted to application tier only
- Secrets Manager handles sensitive data
- S3 buckets are encrypted and block public access

### 5. **State Management**
The backend configuration supports workspace-based separation:
```bash
# Initialize and select workspace
terraform workspace new us-east-1
terraform workspace new eu-west-1
terraform workspace new ap-southeast-1
```

### 6. **Deployment Commands**
```bash
# Deploy to specific region/workspace
terraform workspace select us-east-1
terraform plan
terraform apply

# Deploy all regions
for region in us-east-1 eu-west-1 ap-southeast-1; do
  terraform workspace select $region
  terraform apply -auto-approve
done
```

### 7. **Module Structure**
Create the following directory structure:
```
.
├── tap_stack.tf
├── modules/
│   ├── regional-infrastructure/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── vpc/### Reasoning Trace
---

The user wants me to generate a Terraform configuration file (`tap_stack.tf`) that implements the multi-region infrastructure deployment described in their requirements. Let me break down what needs to be included:

1. **Multi-region setup** - us-east-1, eu-west-1, ap-southeast-1
2. **Networking** - VPCs with 3 AZs each, specific CIDR blocks
3. **Compute** - Auto Scaling Groups, EC2 instances with Amazon Linux 2, Application Load Balancers
4. **Database** - RDS Aurora PostgreSQL with read replicas and 7-day backups
5. **Storage** - S3 buckets (no cross-region replication)
6. **State Management** - Using workspaces with S3 backend and DynamoDB locking
7. **Security** - Security groups, Secrets Manager
8. **Tagging** - Consistent tags (Environment, Region, ManagedBy)
9. **Outputs** - ALB DNS names, RDS endpoints, VPC IDs

I'll create a comprehensive Terraform configuration that uses workspaces to manage the different regions and includes all the required components.
### Answer 
---

I'll generate a comprehensive Terraform stack that implements your multi-region financial services infrastructure with strict regional isolation. This configuration uses workspaces to manage the three regions while maintaining identical infrastructure patterns.

```hcl
# tap_stack.tf - Multi-Region Infrastructure Deployment for Financial Services

# ============================================================================
# TERRAFORM CONFIGURATION
# ============================================================================

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
  
  # Backend configuration for state management
  backend "s3" {
    # These values should be provided via backend config file or CLI
    # bucket         = "terraform-state-${var.region_config[terraform.workspace].region}"
    # key            = "tap-stack/${terraform.workspace}/terraform.tfstate"
    # region         = var.region_config[terraform.workspace].region
    # dynamodb_table = "terraform-state-lock-${var.region_config[terraform.workspace].region}"
    encrypt        = true
  }
}

# ============================================================================
# LOCALS AND WORKSPACE CONFIGURATION
# ============================================================================

locals {
  # Workspace to region mapping
  region_config = {
    "us-east-1" = {
      region      = "us-east-1"
      vpc_cidr    = "10.0.0.0/16"
      azs         = ["us-east-1a", "us-east-1b", "us-east-1c"]
      environment = "production-us"
    }
    "eu-west-1" = {
      region      = "eu-west-1"
      vpc_cidr    = "10.1.0.0/16"
      azs         = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
      environment = "production-eu"
    }
    "ap-southeast-1" = {
      region      = "ap-southeast-1"
      vpc_cidr    = "10.2.0.0/16"
      azs         = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
      environment = "production-ap"
    }
  }
  
  # Current workspace configuration
  current_config = local.region_config[terraform.workspace]
  
  # Common tags applied to all resources
  common_tags = {
    Environment = local.current_config.environment
    Region      = local.current_config.region
    ManagedBy   = "terraform"
    Project     = "tap-trading-platform"
    Workspace   = terraform.workspace
  }
  
  # Database configuration
  db_name     = "taptrading"
  db_username = "tapadmin"
  
  # Application configuration
  app_name = "tap-trading-app"
  app_port = 8080
}

# ============================================================================
# PROVIDER CONFIGURATION
# ============================================================================

provider "aws" {
  region = local.current_config.region
  
  default_tags {
    tags = local.common_tags
  }
}

# ============================================================================
# DATA SOURCES
# ============================================================================

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Get current caller identity
data "aws_caller_identity" "current" {}

# ============================================================================
# NETWORKING RESOURCES
# ============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.current_config.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${local.app_name}-vpc-${terraform.workspace}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "${local.app_name}-igw-${terraform.workspace}"
  }
}

# Public Subnets (for ALB)
resource "aws_subnet" "public" {
  count = 3
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(local.current_config.vpc_cidr, 8, count.index)
  availability_zone       = local.current_config.azs[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${local.app_name}-public-subnet-${count.index + 1}-${terraform.workspace}"
    Type = "public"
  }
}

# Private Subnets (for EC2 instances)
resource "aws_subnet" "private" {
  count = 3
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.current_config.vpc_cidr, 8, count.index + 10)
  availability_zone = local.current_config.azs[count.index]
  
  tags = {
    Name = "${local.app_name}-private-subnet-${count.index + 1}-${terraform.workspace}"
    Type = "private"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count = 3
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.current_config.vpc_cidr, 8, count.index + 20)
  availability_zone = local.current_config.azs[count.index]
  
  tags = {
    Name = "${local.app_name}-db-subnet-${count.index + 1}-${terraform.workspace}"
    Type = "database"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"
  
  tags = {
    Name = "${local.app_name}-nat-eip-${count.index + 1}-${terraform.workspace}"
  }
  
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = 3
  
  subnet_id     = aws_subnet.public[count.index].id
  allocation_id = aws_eip.nat[count.index].id
  
  tags = {
    Name = "${local.app_name}-nat-${count.index + 1}-${terraform.workspace}"
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
    Name = "${local.app_name}-public-rt-${terraform.workspace}"
  }
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = {
    Name = "${local.app_name}-private-rt-${count.index + 1}-${terraform.workspace}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = 3
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 3
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count = 3
  
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${local.app_name}-alb-sg-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    description = "HTTP from Internet (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${local.app_name}-alb-sg-${terraform.workspace}"
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

# EC2 Security Group
resource "aws_security_group" "ec2" {
  name_prefix = "${local.app_name}-ec2-sg-"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    description     = "HTTP from ALB"
    from_port       = local.app_port
    to_port         = local.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${local.app_name}-ec2-sg-${terraform.workspace}"
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${local.app_name}-rds-sg-"
  description = "Security group for RDS Aurora cluster"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }
  
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${local.app_name}-rds-sg-${terraform.workspace}"
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# SECRETS MANAGER
# ============================================================================

# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store database credentials in Secrets Manager
resource "aws_secretsmanager_secret" "db_credentials" {
  name_prefix             = "${local.app_name}-db-credentials-${terraform.workspace}-"
  description             = "RDS Aurora PostgreSQL credentials for ${terraform.workspace}"
  recovery_window_in_days = 7
  
  tags = {
    Name = "${local.app_name}-db-secret-${terraform.workspace}"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = local.db_username
    password = random_password.db_password.result
    engine   = "aurora-postgresql"
    host     = aws_rds_cluster.main.endpoint
    port     = 5432
    dbname   = local.db_name
  })
}

# ============================================================================
# DATABASE (RDS AURORA POSTGRESQL)
# ============================================================================

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name_prefix = "${local.app_name}-db-subnet-group-"
  description = "Database subnet group for ${terraform.workspace}"
  subnet_ids  = aws_subnet.database[*].id
  
  tags = {
    Name = "${local.app_name}-db-subnet-group-${terraform.workspace}"
  }
}

# RDS Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "${local.app_name}-aurora-cluster-${terraform.workspace}"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "15.3"
  database_name           = local.db_name
  master_username         = local.db_username
  master_password         = random_password.db_password.result
  
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  skip_final_snapshot     = false
  final_snapshot_identifier = "${local.app_name}-aurora-final-snapshot-${terraform.workspace}-${formatdate("YYYY-MM-DD-hhmmss", timestamp())}"
  
  tags = {
    Name = "${local.app_name}-aurora-cluster-${terraform.workspace}"
  }
  
  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}

# RDS Aurora Instances (Writer + Read Replica)
resource "aws_rds_cluster_instance" "main" {
  count = 2
  
  identifier             = "${local.app_name}-aurora-instance-${count.index + 1}-${terraform.workspace}"
  cluster_identifier     = aws_rds_cluster.main.id
  instance_class         = "db.r6g.large"
  engine                 = aws_rds_cluster.main.engine
  engine_version         = aws_rds_cluster.main.engine_version
  
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring.arn
  
  tags = {
    Name = "${local.app_name}-aurora-instance-${count.index + 1}-${terraform.workspace}"
    Type = count.index == 0 ? "writer" : "reader"
  }
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# IAM Role for RDS Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "${local.app_name}-rds-monitoring-"
  
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
  
  tags = {
    Name = "${local.app_name}-rds-monitoring-role-${terraform.workspace}"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2" {
  name_prefix = "${local.app_name}-ec2-role-"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name = "${local.app_name}-ec2-role-${terraform.workspace}"
  }
}

# IAM Policy for EC2 to access Secrets Manager
resource "aws_iam_policy" "ec2_secrets" {
  name_prefix = "${local.app_name}-ec2-secrets-policy-"
  description = "Allow EC2 instances to retrieve database credentials"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_secrets" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ec2_secrets.arn
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "${local.app_name}-ec2-profile-"
  role        = aws_iam_role.ec2.name
  
  tags = {
    Name = "${local.app_name}-ec2-profile-${terraform.workspace}"
  }
}

# ============================================================================
# APPLICATION LOAD BALANCER
# ============================================================================

resource "aws_lb" "main" {
  name               = "${local.app_name}-alb-${terraform.workspace}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection = false
  enable_http2              = true
  enable_cross_zone_load_balancing = true
  
  tags = {
    Name = "${local.app_name}-alb-${terraform.workspace}"
  }
}

# Target Group
resource "aws_lb_target_group" "main" {
  name_prefix = "tap-tg-"
  port        = local.app_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
  
  deregistration_delay = 30
  
  tags = {
    Name = "${local.app_name}-tg-${terraform.workspace}"
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

# ALB Listener (HTTP - redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# ALB Listener (HTTPS)
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate_validation.main.certificate_arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# ============================================================================
# ACM CERTIFICATE (Self-signed for demo)
# ============================================================================

resource "aws_acm_certificate" "main" {
  domain_name       = "${terraform.workspace}.tap-trading.local"
  validation_method = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name = "${local.app_name}-cert-${terraform.workspace}"
  }
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn = aws_acm_certificate.main.arn
}

# ============================================================================
# LAUNCH TEMPLATE
# ============================================================================

resource "aws_launch_template" "main" {
  name_prefix   = "${local.app_name}-lt-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.medium"
  
  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }
  
  vpc_security_group_ids = [aws_security_group.ec2.id]
  
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region          = local.current_config.region
    app_port        = local.app_port
    secret_arn      = aws_secretsmanager_secret.db_credentials.arn
    workspace       = terraform.workspace
  }))
  
  block_device_mappings {
    device_name = "/dev/xvda"
    
    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
  
  monitoring {
    enabled = true
  }
  
  tag_specifications {
    resource_type = "instance"
    
    tags = merge(
      local.common_tags,
      {
        Name = "${local.app_name}-instance-${terraform.workspace}"
      }
    )
  }
  
  tag_specifications {
    resource_type = "volume"
    
    tags = merge(
      local.common_tags,
      {
        Name = "${local.app_name}-volume-${terraform.workspace}"
      }
    )
  }
}

# ============================================================================
# AUTO SCALING GROUP
# ============================================================================

resource "aws_autoscaling_group" "main" {
  name_prefix         = "${local.app_name}-asg-"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  
  min_size         = 3
  max_size         = 9
  desired_capacity = 3
  
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }
  
  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]
  
  tag {
    key                 = "Name"
    value               = "${local.app_name}-asg-instance-${terraform.workspace}"
    propagate_at_launch = true
  }
  
  dynamic "tag" {
    for_each = local.common_tags
    
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${local.app_name}-scale-up-${terraform.workspace}"
  autoscaling_group_name = aws_autoscaling_group.main.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 1
  cooldown              = 300
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${local.app_name}-scale-down-${terraform.workspace}"
  autoscaling_group_name = aws_autoscaling_group.main.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = -1
  cooldown              = 300
}

# CloudWatch Alarms for Auto Scaling
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${local.app_name}-high-cpu-${terraform.workspace}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors EC2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}

resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "${local.app_name}-low-cpu-${terraform.workspace}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors EC2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}

# ============================================================================
# S3 BUCKETS
# ============================================================================

# Application Data Bucket
resource "aws_s3_bucket" "app_data" {
  bucket_prefix = "${local.app_name}-data-${terraform.workspace}-"
  
  tags = {
    Name = "${local.app_name}-data-${terraform.workspace}"
  }
}

resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Logs Bucket
resource "aws_s3_bucket" "logs" {
  bucket_prefix = "${local.app_name}-logs-${terraform.workspace}-"
  
  tags = {
    Name = "${local.app_name}-logs-${terraform.workspace}"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  rule {
    id     = "delete-old-logs"
    status = "Enabled"
    
    expiration {
      days = 90
    }
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "rds_cluster_endpoint" {
  description = "Writer endpoint for the RDS Aurora cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint for the RDS Aurora cluster"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "app_data_bucket" {
  description = "Name of the application data S3 bucket"
  value       = aws_s3_bucket.app_data.id
}

output "logs_bucket" {
  description = "Name of the logs S3 bucket"
  value       = aws_s3_bucket.logs.id
}

output "secret_arn" {
  description = "ARN of the database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "workspace" {
  description = "Current Terraform workspace (region)"
  value       = terraform.workspace
}

output "region" {
  description = "AWS region for this deployment"
  value       = local.current_config.region
}

output "environment" {
  description = "Environment name"
  value       = local.current_config.environment
}
```

## Key Implementation Details

### **Architecture Highlights**

1. **Multi-Region Support**: The configuration uses Terraform workspaces to manage three separate regional deployments with region-specific configurations
2. **Network Isolation**: Each region has its own VPC with non-overlapping CIDR blocks and 3 availability zones for high availability
3. **Security Layers**: Multiple security groups control traffic flow between ALB → EC2 → RDS with strict ingress/egress rules
4. **State Management**: Configured for S3 backend with DynamoDB locking (backend config should be provided separately)

### **Resource Components**

- **Networking**: Complete VPC setup with public/private/database subnets, NAT gateways, and route tables
- **Compute**: Auto Scaling Group with launch template, scaling policies based on CPU metrics
- **Load Balancing**: Application Load Balancer with HTTPS listeners and health checks
- **Database**: Aurora PostgreSQL cluster with writer and reader instances, 7-day backup retention
- **Storage**: S3 buckets for application data and logs with encryption and versioning
- **Security**: Secrets Manager for database credentials, IAM roles with least privilege

### **Deployment Instructions**

1. **Initialize workspaces**:
```bash
terraform workspace new us-east-1
terraform workspace new eu-west-1
terraform workspace new ap-southeast-1
```

2. **Deploy to each region**:
```bash
terraform workspace select us-east-1
terraform apply

terraform workspace select eu-west-1
terraform apply

terraform workspace select ap-southeast-1
terraform apply
```

### **Additional Files Needed**

You'll also need a `user_data.sh` script for EC2 initialization:

```bash
#!/bin/bash
# user_data.sh

# Update system
yum update -y

# Install required packages
yum install -y amazon-cloudwatch-agent postgresql jq

# Configure application
cat > /etc/app_config.json <<EOF
{
  "region": "${region}",
  "port": ${app_port},
  "secret_arn": "${secret_arn}",
  "workspace": "${workspace}"
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a query -m ec2 -n default -c default
```

This configuration provides a production-ready, multi-region infrastructure that meets your financial services requirements for data residency and regional isolation.
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── compute/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
```

This configuration provides a robust, compliant, and maintainable multi-region infrastructure for your trading platform while ensuring data sovereignty and operational consistency.