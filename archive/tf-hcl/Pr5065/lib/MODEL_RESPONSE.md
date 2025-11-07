### Reasoning Trace
---

The user wants me to generate a single Terraform file `tap_stack.tf` that creates identical infrastructure across dev, staging, and prod environments. The key requirements are:

1. Single file containing everything (variables, locals, resources, outputs)
2. Must declare `aws_region` variable (but not configure provider)
3. No external modules
4. Best practices (least privilege, encrypted RDS, private EC2, public ALB)
5. Per-environment configuration via tfvars

The infrastructure should include:
- VPC with public/private subnets across 2+ AZs
- Internet Gateway and NAT Gateway(s)
- Security Groups (ALB, App, RDS)
- ALB (public, with optional HTTPS)
- Auto Scaling Group with Launch Template (private)
- RDS PostgreSQL (private, encrypted)

I need to:
1. Declare all necessary variables with sensible defaults
2. Create locals for tags and computed values
3. Use data sources for AZs and AMI
4. Create all resources with proper dependencies
5. Output relevant information (no secrets)

Let me structure this properly:
- Variables section
- Locals section  
- Data sources
- VPC and networking
- Security groups
- ALB and target group
- Launch template and ASG
- RDS
- Outputs

For subnetting, I'll use cidrsubnet to divide the VPC CIDR evenly.
### Answer 
---

```hcl
# Variables
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "az_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2
}

variable "allowed_ingress_cidrs" {
  description = "List of CIDRs allowed to access ALB on ports 80/443"
  type        = list(string)
}

variable "app_port" {
  description = "Application port"
  type        = number
  default     = 80
}

# EC2/ASG variables
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "asg_min" {
  description = "Minimum ASG size"
  type        = number
}

variable "asg_max" {
  description = "Maximum ASG size"
  type        = number
}

variable "asg_desired" {
  description = "Desired ASG size"
  type        = number
}

variable "target_group_protocol" {
  description = "Target group protocol"
  type        = string
  default     = "HTTP"
}

# RDS variables
variable "db_engine" {
  description = "Database engine"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "Database engine version"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage in GB for autoscaling"
  type        = number
  default     = null
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "db_backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "db_kms_key_id" {
  description = "KMS key ID for DB encryption (empty for AWS managed key)"
  type        = string
  default     = ""
}

# TLS variables
variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS listener (empty to disable HTTPS)"
  type        = string
  default     = ""
}

# Misc variables
variable "extra_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Locals
locals {
  tags = merge(
    {
      Environment = title(var.environment)
    },
    var.extra_tags
  )
  
  # Subnet calculations
  public_subnet_cidrs  = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 4, i)]
  private_subnet_cidrs = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 4, i + var.az_count)]
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

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

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.tags, {
    Name = "vpc-${var.environment}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.tags, {
    Name = "igw-${var.environment}"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = var.az_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.tags, {
    Name = "subnet-public-${var.environment}-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = var.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = merge(local.tags, {
    Name = "subnet-private-${var.environment}-${count.index + 1}"
    Type = "Private"
  })
}

# NAT Gateway EIPs
resource "aws_eip" "nat" {
  count  = var.az_count
  domain = "vpc"
  
  tags = merge(local.tags, {
    Name = "eip-nat-${var.environment}-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = var.az_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(local.tags, {
    Name = "nat-${var.environment}-${count.index + 1}"
  })
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(local.tags, {
    Name = "rt-public-${var.environment}"
  })
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = var.az_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = var.az_count
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(local.tags, {
    Name = "rt-private-${var.environment}-${count.index + 1}"
  })
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = var.az_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "sg-alb-${var.environment}-"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
    description = "Allow HTTP from allowed CIDRs"
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
    description = "Allow HTTPS from allowed CIDRs"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.tags, {
    Name = "sg-alb-${var.environment}"
  })
}

# Security Group for App/EC2
resource "aws_security_group" "app" {
  name_prefix = "sg-app-${var.environment}-"
  description = "Security group for application instances"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow traffic from ALB"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.tags, {
    Name = "sg-app-${var.environment}"
  })
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "sg-rds-${var.environment}-"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = var.db_port
    to_port         = var.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "Allow database traffic from app instances"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.tags, {
    Name = "sg-rds-${var.environment}"
  })
}

# ALB
resource "aws_lb" "main" {
  name               = "alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection = false
  enable_http2              = true
  
  tags = merge(local.tags, {
    Name = "alb-${var.environment}"
  })
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "tg-${var.environment}"
  port     = var.app_port
  protocol = var.target_group_protocol
  vpc_id   = aws_vpc.main.id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = var.target_group_protocol
    timeout             = 5
    unhealthy_threshold = 2
  }
  
  tags = merge(local.tags, {
    Name = "tg-${var.environment}"
  })
}

# ALB Listener - HTTP
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# ALB Listener - HTTPS (conditional)
resource "aws_lb_listener" "https" {
  count             = var.acm_certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.acm_certificate_arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "lt-${var.environment}-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type
  
  vpc_security_group_ids = [aws_security_group.app.id]
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(local.tags, {
      Name = "instance-${var.environment}"
    })
  }
  
  tags = merge(local.tags, {
    Name = "lt-${var.environment}"
  })
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name_prefix         = "asg-${var.environment}-"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  min_size           = var.asg_min
  max_size           = var.asg_max
  desired_capacity   = var.asg_desired
  
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "asg-${var.environment}"
    propagate_at_launch = false
  }
  
  dynamic "tag" {
    for_each = local.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "db-subnet-group-${var.environment}"
  subnet_ids = aws_subnet.private[*].id
  
  tags = merge(local.tags, {
    Name = "db-subnet-group-${var.environment}"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "rds-${var.environment}"
  engine         = var.db_engine
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true
  kms_key_id           = var.db_kms_key_id != "" ? var.db_kms_key_id : null
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = var.db_port
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = var.db_backup_retention_days
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  multi_az               = var.db_multi_az
  publicly_accessible    = false
  deletion_protection    = false
  skip_final_snapshot    = true
  
  tags = merge(local.tags, {
    Name = "rds-${var.environment}"
  })
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
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
  value       = aws_security_group.alb.id
}

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.main.name
}

output "launch_template_id" {
  description = "Launch template ID"
  value       = aws_launch_template.main.id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}
```

```hcl
# dev.tfvars
environment = "dev"
aws_region  = "us-east-1"

# Networking
vpc_cidr              = "10.0.0.0/16"
allowed_ingress_cidrs = ["0.0.0.0/0"]

# EC2/ASG
instance_type = "t3.micro"
asg_min       = 1
asg_max       = 2
asg_desired   = 1

# RDS
db_engine_version        = "15"
db_instance_class        = "db.t3.micro"
db_allocated_storage     = 20
db_max_allocated_storage = 40
db_name                  = "appdb"
db_username              = "dbadmin"
db_password              = "DevPassword123!"
db_multi_az              = false
db_backup_retention_days = 7

# TLS
acm_certificate_arn = ""

# Tags
extra_tags = {
  Project = "tap-stack"
  Owner   = "devops-team"
}
```

```hcl
# staging.tfvars
environment = "staging"
aws_region  = "us-east-1"

# Networking
vpc_cidr              = "10.1.0.0/16"
allowed_ingress_cidrs = ["10.0.0.0/8", "172.16.0.0/12"]

# EC2/ASG
instance_type = "t3.small"
asg_min       = 2
asg_max       = 4
asg_desired   = 2

# RDS
db_engine_version        = "15"
db_instance_class        = "db.t3.small"
db_allocated_storage     = 50
db_max_allocated_storage = 100
db_name                  = "appdb"
db_username              = "dbadmin"
db_password              = "StagingPassword456!"
db_multi_az              = true
db_backup_retention_days = 14

# TLS
acm_certificate_arn = ""

# Tags
extra_tags = {
  Project = "tap-stack"
  Owner   = "devops-team"
}
```

```hcl
# prod.tfvars
environment = "prod"
aws_region  = "us-east-1"

# Networking
vpc_cidr              = "10.2.0.0/16"
allowed_ingress_cidrs = ["52.84.0.0/14", "52.88.0.0/13", "54.192.0.0/12"]

# EC2/ASG
instance_type = "t3.large"
asg_min       = 3
asg_max       = 10
asg_desired   = 4

# RDS
db_engine_version        = "15"
db_instance_class        = "db.r6g.xlarge"
db_allocated_storage     = 100
db_max_allocated_storage = 500
db_name                  = "appdb"
db_username              = "dbadmin"
db_password              = "ProdPassword789!Secure"
db_multi_az              = true
db_backup_retention_days = 30

# TLS
acm_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"

# Tags
extra_tags = {
  Project    = "tap-stack"
  Owner      = "devops-team"
  CostCenter = "engineering"
}
```