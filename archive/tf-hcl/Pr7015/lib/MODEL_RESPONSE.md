### Reasoning Trace
---

This is a comprehensive Terraform configuration request. I need to create:

1. A modular structure with reusable modules
2. Support for three environments (dev, staging, prod) using workspaces
3. VPC with specified CIDR blocks
4. Public and private subnets across 2 AZs
5. Application Load Balancer
6. Auto Scaling Groups with EC2 instances
7. RDS PostgreSQL Multi-AZ
8. S3 bucket with versioning
9. Conditional logic for instance sizes
10. Security groups restricting DB access
11. Consistent tagging
12. Backend configurations for each environment
13. Environment-specific tfvars files

Let me structure this as follows:
```
terraform-infrastructure/
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── alb/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── asg/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── rds/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── s3/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   ├── dev/
│   │   ├── backend.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   │   ├── backend.tf
│   │   └── terraform.tfvars
│   └── prod/
│       ├── backend.tf


│       └── terraform.tfvars
├── main.tf
├── variables.tf
├── outputs.tf
└── versions.tf
```

I'll proceed with creating the necessary configuration files for a robust, scalable infrastructure setup. The modular approach will allow for easy management and consistent deployment across different environments. Each module will handle a specific component of the infrastructure, enabling flexible and reusable configurations.
### Answer 
---

I'll create a complete Terraform configuration with a modular structure for deploying infrastructure across three environments. Here's the comprehensive solution:

## Project Structure

```
terraform-infrastructure/
├── modules/
│   ├── vpc/
│   ├── alb/
│   ├── asg/
│   ├── rds/
│   └── s3/
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
├── main.tf
├── variables.tf
├── outputs.tf
└── versions.tf
```

## Root Configuration Files

### `versions.tf`
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
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}
```

### `variables.tf`
```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones for resources"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "cost_center" {
  description = "Cost center for tagging"
  type        = string
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for RDS"
  type        = string
  sensitive   = true
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "ec2_tenancy" {
  description = "EC2 instance tenancy"
  type        = string
  default     = "default"
}

variable "asg_min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
}

variable "asg_max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
}

variable "asg_desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for ALB and RDS"
  type        = bool
  default     = false
}
```

### `main.tf`
```hcl
locals {
  common_tags = {
    Environment = var.environment
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
    Workspace   = terraform.workspace
  }
  
  is_production = var.environment == "prod"
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  environment        = var.environment
  vpc_cidr          = var.vpc_cidr
  availability_zones = var.availability_zones
  tags              = local.common_tags
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "${var.environment}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

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
    Name = "${var.environment}-alb-sg"
  })
}

resource "aws_security_group" "app" {
  name_prefix = "${var.environment}-app-sg"
  description = "Security group for application instances"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 80
    to_port         = 80
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
    Name = "${var.environment}-app-sg"
  })
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.environment}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "PostgreSQL access from application instances only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-rds-sg"
  })
}

# S3 Module
module "s3" {
  source = "./modules/s3"
  
  environment = var.environment
  tags        = local.common_tags
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"
  
  environment                = var.environment
  vpc_id                    = module.vpc.vpc_id
  public_subnet_ids         = module.vpc.public_subnet_ids
  security_group_id         = aws_security_group.alb.id
  enable_deletion_protection = var.enable_deletion_protection
  tags                      = local.common_tags
}

# Auto Scaling Group Module
module "asg" {
  source = "./modules/asg"
  
  environment          = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  security_group_id   = aws_security_group.app.id
  target_group_arn    = module.alb.target_group_arn
  instance_type       = var.ec2_instance_type
  instance_tenancy    = var.ec2_tenancy
  min_size            = var.asg_min_size
  max_size            = var.asg_max_size
  desired_capacity    = var.asg_desired_capacity
  tags                = local.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"
  
  environment                = var.environment
  private_subnet_ids        = module.vpc.private_subnet_ids
  security_group_id         = aws_security_group.rds.id
  instance_class            = var.rds_instance_class
  db_username               = var.db_username
  db_password               = var.db_password
  enable_deletion_protection = var.enable_deletion_protection
  multi_az                  = local.is_production
  tags                      = local.common_tags
}
```

### `outputs.tf`
```hcl
output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "ID of the VPC"
}

output "alb_dns_name" {
  value       = module.alb.alb_dns_name
  description = "DNS name of the Application Load Balancer"
}

output "rds_endpoint" {
  value       = module.rds.endpoint
  description = "RDS instance endpoint"
  sensitive   = true
}

output "s3_bucket_name" {
  value       = module.s3.bucket_name
  description = "Name of the S3 bucket"
}

output "environment" {
  value       = var.environment
  description = "Current environment"
}
```

## Module: VPC (`modules/vpc/`)

### `modules/vpc/variables.tf`
```hcl
variable "environment" {
  description = "Environment name"
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

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
```

### `modules/vpc/main.tf`
```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.environment}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.environment}-igw"
  })
}

resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.environment}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

resource "aws_eip" "nat" {
  count = length(var.availability_zones)
  
  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.environment}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.environment}-nat-gateway-${count.index + 1}"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)
  
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-private-rt-${count.index + 1}"
  })
}

resource "aws_route_table_association" "public" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

### `modules/vpc/outputs.tf`
```hcl
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "ID of the VPC"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "List of public subnet IDs"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "List of private subnet IDs"
}

output "vpc_cidr" {
  value       = aws_vpc.main.cidr_block
  description = "CIDR block of the VPC"
}
```

## Module: ALB (`modules/alb/`)

### `modules/alb/variables.tf`
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ALB"
  type        = string
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
```

### `modules/alb/main.tf`
```hcl
resource "aws_lb" "main" {
  name               = "${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets           = var.public_subnet_ids

  enable_deletion_protection = var.enable_deletion_protection
  enable_http2              = true
  enable_cross_zone_load_balancing = true

  tags = merge(var.tags, {
    Name = "${var.environment}-alb"
  })
}

resource "aws_lb_target_group" "main" {
  name     = "${var.environment}-tg"
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
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(var.tags, {
    Name = "${var.environment}-tg"
  })
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
```

### `modules/alb/outputs.tf`
```hcl
output "alb_arn" {
  value       = aws_lb.main.arn
  description = "ARN of the Application Load Balancer"
}

output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "DNS name of the Application Load Balancer"
}

output "target_group_arn" {
  value       = aws_lb_target_group.main.arn
  description = "ARN of the target group"
}
```

## Module: ASG (`modules/asg/`)

### `modules/asg/variables.tf`
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for EC2 instances"
  type        = string
}

variable "target_group_arn" {
  description = "Target group ARN for ALB"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "instance_tenancy" {
  description = "EC2 instance tenancy"
  type        = string
  default     = "default"
}

variable "min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
}

variable "max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
}

variable "desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
```

### `modules/asg/main.tf`
```hcl
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

resource "aws_launch_template" "main" {
  name_prefix   = "${var.environment}-lt-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type

  vpc_security_group_ids = [var.security_group_id]

  placement {
    tenancy = var.instance_tenancy
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment = var.environment
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.tags, {
      Name = "${var.environment}-app-instance"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(var.tags, {
      Name = "${var.environment}-app-volume"
    })
  }
}

resource "aws_autoscaling_group" "main" {
  name               = "${var.environment}-asg"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [var.target_group_arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  min_size            = var.min_size
  max_size            = var.max_size
  desired_capacity    = var.desired_capacity

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-asg-instance"
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

resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.environment}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.environment}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}
```

### `modules/asg/user_data.sh`
```bash
#!/bin/bash
yum update -y
yum install -y httpd

# Start Apache
systemctl start httpd
systemctl enable httpd

# Create a simple health check endpoint
cat <<EOF > /var/www/html/health
OK
EOF

# Create a simple index page
cat <<EOF > /var/www/html/index.html
<html>
<head><title>Environment: ${environment}</title></head>
<body>
<h1>Welcome to ${environment} environment</h1>
<p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
<p>Availability Zone: $(ec2-metadata --availability-zone | cut -d " " -f 2)</p>
</body>
</html>
EOF
```

### `modules/asg/outputs.tf`
```hcl
output "asg_id" {
  value       = aws_autoscaling_group.main.id
  description = "ID of the Auto Scaling Group"
}

output "asg_name" {
  value       = aws_autoscaling_group.main.name
  description = "Name of the Auto Scaling Group"
}
```

## Module: RDS (`modules/rds/`)

### `modules/rds/variables.tf`
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for RDS"
  type        = string
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Master password for RDS"
  type        = string
  sensitive   = true
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
```

### `modules/rds/main.tf`
```hcl
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.tags, {
    Name = "${var.environment}-db-subnet-group"
  })
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.environment}-db-params"
  family = "postgres15"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-db-params"
  })
}

resource "aws_db_instance" "main" {
  identifier     = "${var.environment}-db"
  engine         = "postgres"
  engine_version = "15.4"
  
  instance_class    = var.instance_class
  allocated_storage = var.multi_az ? 100 : 20
  storage_type      = "gp3"
  storage_encrypted = true
  
  db_name  = "appdb"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [var.security_group_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name
  
  multi_az               = var.multi_az
  backup_retention_period = var.multi_az ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot       = !var.enable_deletion_protection
  final_snapshot_identifier = var.enable_deletion_protection ? "${var.environment}-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmmss", timestamp())}" : null
  deletion_protection       = var.enable_deletion_protection
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = merge(var.tags, {
    Name = "${var.environment}-db"
  })
}
```

### `modules/rds/outputs.tf`
```hcl
output "endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS instance endpoint"
  sensitive   = true
}

output "database_name" {
  value       = aws_db_instance.main.db_name
  description = "Name of the database"
}

output "port" {
  value       = aws_db_instance.main.port
  description = "Database port"
}
```

## Module: S3 (`modules/s3/`)

### `modules/s3/variables.tf`
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
```

### `modules/s3/main.tf`
```hcl
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "main" {
  bucket = "${var.environment}-app-bucket-${random_id.bucket_suffix.hex}"

  tags = merge(var.tags, {
    Name = "${var.environment}-app-bucket"
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

resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = var.environment == "prod" ? 90 : 30
    }
  }

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = var.environment == "prod" ? 60 : 30
      storage_class = "STANDARD_IA"
    }
  }
}
```

### `modules/s3/outputs.tf`
```hcl
output "bucket_name" {
  value       = aws_s3_bucket.main.id
  description = "Name of the S3 bucket"
}

output "bucket_arn" {
  value       = aws_s3_bucket.main.arn
  description = "ARN of the S3 bucket"
}
```

## Environment Configurations

### `environments/dev/backend.tf`
```hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state-dev-bucket"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock-dev"
    encrypt        = true
  }
}
```

### `environments/dev/terraform.tfvars`
```hcl
environment = "dev"
aws_region  = "us-east-1"

vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

cost_center = "Development"

# Instance configurations - smaller for dev
ec2_instance_type  = "t3.micro"
rds_instance_class = "db.t3.micro"
ec2_tenancy       = "default"

# Auto Scaling configuration
asg_min_size         = 1
asg_max_size         = 3
asg_desired_capacity = 2

# Database credentials (use AWS Secrets Manager in production)
db_username = "dbadmin"
db_password = "DevPassword123!"  # Change this!

# Protection settings
enable_deletion_protection = false
```

### `environments/staging/backend.tf`
```hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state-staging-bucket"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock-staging"
    encrypt        = true
  }
}
```

### `environments/staging/terraform.tfvars`
```hcl
environment = "staging"
aws_region  = "us-east-1"

vpc_cidr           = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

cost_center = "Staging"

# Instance configurations - smaller for staging
ec2_instance_type  = "t3.micro"
rds_instance_class = "db.t3.micro"
ec2_tenancy       = "default"

# Auto Scaling configuration
asg_min_size         = 2
asg_max_size         = 4
asg_desired_capacity = 2

# Database credentials (use AWS Secrets Manager in production)
db_username = "dbadmin"
db_password = "StagingPassword123!"  # Change this!

# Protection settings
enable_deletion_protection = false
```

### `environments/prod/backend.tf`
```hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state-prod-bucket"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock-prod"
    encrypt        = true
  }
}
```

### `environments/prod/terraform.tfvars`
```hcl
environment = "prod"
aws_region  = "us-east-1"

vpc_cidr           = "10.3.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

cost_center = "Production"

# Instance configurations - larger for production
ec2_instance_type  = "m5.large"
rds_instance_class = "db.m5.large"
ec2_tenancy       = "dedicated"

# Auto Scaling configuration
asg_min_size         = 3
asg_max_size         = 10
asg_desired_capacity = 4

# Database credentials (use AWS Secrets Manager in production)
db_username = "dbadmin"
db_password = "ProdPassword123!Secure"  # Change this and use Secrets Manager!

# Protection settings
enable_deletion_protection = true
```

## Deployment Scripts

### `scripts/init-backend.sh`
```bash
#!/bin/bash
# Script to initialize S3 backend resources

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: ./init-backend.sh [dev|staging|prod]"
  exit 1
fi

AWS_REGION="us-east-1"
BUCKET_NAME="terraform-state-${ENVIRONMENT}-bucket"
DYNAMODB_TABLE="terraform-state-lock-${ENVIRONMENT}"

# Create S3 bucket
aws s3api create-bucket \
  --bucket "${BUCKET_NAME}" \
  --region "${AWS_REGION}"

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket "${BUCKET_NAME}" \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket "${BUCKET_NAME}" \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name "${DYNAMODB_TABLE}" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region "${AWS_REGION}"

echo "Backend resources created for ${ENVIRONMENT} environment"
```

### `scripts/deploy.sh`
```bash
#!/bin/bash
# Deployment script for different environments

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: ./deploy.sh [dev|staging|prod]"
  exit 1
fi

# Navigate to environment directory
cd "environments/${ENVIRONMENT}"

# Initialize Terraform with backend config
terraform init

# Select or create workspace
terraform workspace select "${ENVIRONMENT}" || terraform workspace new "${ENVIRONMENT}"

# Navigate back to root
cd ../..

# Plan with environment-specific variables
terraform plan \
  -var-file="environments/${ENVIRONMENT}/terraform.tfvars" \
  -out="${ENVIRONMENT}.tfplan"

echo "Review the plan above. Type 'yes' to apply:"
read CONFIRM

if [ "$CONFIRM" = "yes" ]; then
  terraform apply "${ENVIRONMENT}.tfplan"
else
  echo "Deployment cancelled"
  exit 0
fi
```

### `Makefile`
```makefile
.PHONY: init-dev init-staging init-prod deploy-dev deploy-staging deploy-prod destroy-dev destroy-staging destroy-prod

# Initialize backend resources
init-backend-%:
	@./scripts/init-backend.sh $*

# Deploy environments
deploy-%:
	@./scripts/deploy.sh $*

# Initialize Terraform for environments
init-%:
	cd environments/$* && terraform init
	terraform workspace select $* || terraform workspace new $*

# Plan deployments
plan-%: init-%
	terraform plan -var-file=environments/$*/terraform.tfvars -out=$*.tfplan

# Apply deployments
apply-%: plan-%
	terraform apply $*.tfplan

# Destroy environments
destroy-%: init-%
	terraform destroy -var-file=environments/$*/terraform.tfvars -auto-approve

# Format code
fmt:
	terraform fmt -recursive .

# Validate configuration
validate:
	terraform validate

# Clean up plan files
clean:
	rm -f *.tfplan
```

## Usage Instructions

1. **Initialize Backend Resources:**
```bash
# For each environment
make init-backend-dev
make init-backend-staging
make init-backend-prod
```

2. **Deploy Infrastructure:**
```bash
# Deploy to development
make deploy-dev

# Deploy to staging
make deploy-staging

# Deploy to production
make deploy-prod
```

3. **Using Workspaces:**
```bash
# List workspaces
terraform workspace list

# Switch workspace
terraform workspace select dev

# Create new workspace
terraform workspace new feature-test
```

## Key Features Implemented

1. **Modular Structure:** Clean separation of modules for VPC, ALB, ASG, RDS, and S3
2. **Environment Isolation:** Separate state files and workspaces for each environment
3. **Conditional Logic:** Different instance sizes and tenancy based on environment
4. **Security:** Restricted database access, encrypted storage, and proper security groups
5. **High Availability:** Multi-AZ deployments for production, NAT gateways in each AZ
6. **Tagging:** Consistent tagging across all resources
7. **Versioning:** S3 bucket versioning enabled with lifecycle policies
8. **Auto Scaling:** Dynamic scaling policies for EC2 instances
9. **Optional Enhancement:** Added lifecycle policies for S3 buckets to optimize storage costs

This configuration provides a production-ready, scalable infrastructure that can be easily deployed across multiple environments while maintaining consistency and best practices.