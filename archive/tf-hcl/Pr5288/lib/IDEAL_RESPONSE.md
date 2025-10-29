### 1. Provider Configuration (`provider.tf`)

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

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

### 2. Variables Configuration (`variables.tf`)

```hcl
# variables.tf - Input Variables

# ================================
# GENERAL CONFIGURATION
# ================================

variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the project for resource naming and tagging"
  type        = string
  default     = "healthcare-app"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "owner" {
  description = "Owner/Team responsible for the infrastructure"
  type        = string
  default     = "healthcare-team"
}

# ================================
# NETWORK CONFIGURATION
# ================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.1.1.0/24", "10.1.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.1.10.0/24", "10.1.20.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.1.100.0/24", "10.1.200.0/24"]
}

# ================================
# COMPUTE CONFIGURATION
# ================================

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "Minimum number of EC2 instances"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum number of EC2 instances"
  type        = number
  default     = 3
}

variable "desired_capacity" {
  description = "Desired number of EC2 instances"
  type        = number
  default     = 2
}

# ================================
# DATABASE CONFIGURATION
# ================================

variable "db_engine" {
  description = "RDS engine type"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "15.3"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS instance (GB)"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS auto-scaling (GB)"
  type        = number
  default     = 100
}

variable "db_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 1
}

variable "db_backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS instance"
  type        = bool
  default     = false
}

# ================================
# SECURITY CONFIGURATION
# ================================

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the load balancer"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC flow logs"
  type        = bool
  default     = true
}

# ================================
# MONITORING CONFIGURATION
# ================================

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 7
}
```

### 3. Main Infrastructure (`tap_stack.tf`)

```hcl
# tap_stack.tf - Healthcare Infrastructure Stack

# ================================
# DATA SOURCES
# ================================

# Get available AZs in the current region
data "aws_availability_zones" "available" {
  state = "available"
}

# Get the latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ================================
# LOCALS - Environment-specific configurations
# ================================

locals {
  # Environment-specific CIDR blocks (non-overlapping)
  environment_config = {
    dev = {
      vpc_cidr               = "10.1.0.0/16"
      public_subnet_cidrs    = ["10.1.1.0/24", "10.1.2.0/24"]
      private_subnet_cidrs   = ["10.1.10.0/24", "10.1.20.0/24"]
      database_subnet_cidrs  = ["10.1.100.0/24", "10.1.200.0/24"]
      instance_type          = "t3.micro"
      backup_retention       = 1
      deletion_protection    = false
    }
    staging = {
      vpc_cidr               = "10.2.0.0/16"
      public_subnet_cidrs    = ["10.2.1.0/24", "10.2.2.0/24"]
      private_subnet_cidrs   = ["10.2.10.0/24", "10.2.20.0/24"]
      database_subnet_cidrs  = ["10.2.100.0/24", "10.2.200.0/24"]
      instance_type          = "t3.small"
      backup_retention       = 3
      deletion_protection    = false
    }
    prod = {
      vpc_cidr               = "10.3.0.0/16"
      public_subnet_cidrs    = ["10.3.1.0/24", "10.3.2.0/24"]
      private_subnet_cidrs   = ["10.3.10.0/24", "10.3.20.0/24"]
      database_subnet_cidrs  = ["10.3.100.0/24", "10.3.200.0/24"]
      instance_type          = "t3.medium"
      backup_retention       = 7
      deletion_protection    = true
    }
  }

  # Current environment configuration
  current_config = local.environment_config[var.environment]
  
  # Common tags
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Owner       = var.owner
    ManagedBy   = "Terraform"
    Workspace   = terraform.workspace
  }

  # Resource naming
  name_prefix = "${var.project_name}-${var.environment}"
}

# ================================
# KMS KEY FOR RDS ENCRYPTION
# ================================

resource "aws_kms_key" "rds_encryption" {
  description             = "KMS key for RDS encryption in ${var.environment} environment"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-kms-key"
  })
}

resource "aws_kms_alias" "rds_encryption" {
  name          = "alias/${local.name_prefix}-rds-encryption"
  target_key_id = aws_kms_key.rds_encryption.key_id
}

# ================================
# VPC AND NETWORKING
# ================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.current_config.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(local.current_config.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.current_config.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets for EC2 instances
resource "aws_subnet" "private" {
  count = length(local.current_config.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.current_config.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(local.current_config.database_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.current_config.database_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-subnet-${count.index + 1}"
    Type = "Database"
  })
}

# NAT Gateways (one per public subnet for HA)
resource "aws_eip" "nat" {
  count = length(aws_subnet.public)

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count = length(aws_subnet.public)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  depends_on    = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
  })
}

# Route Tables
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
  count = length(aws_subnet.private)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
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

# ================================
# SECURITY GROUPS
# ================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
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

# EC2 Security Group - only allows traffic from ALB
resource "aws_security_group" "ec2" {
  name        = "${local.name_prefix}-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
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
    Name = "${local.name_prefix}-ec2-sg"
  })
}

# RDS Security Group - only allows traffic from EC2
resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
  })
}

# ================================
# APPLICATION LOAD BALANCER
# ================================

resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.environment == "prod" ? true : false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })
}

resource "aws_lb_target_group" "main" {
  name     = "${local.name_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tg"
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

# ================================
# IAM ROLE FOR EC2 INSTANCES
# ================================

data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2" {
  name               = "${local.name_prefix}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-role"
  })
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# ================================
# LAUNCH TEMPLATE AND AUTO SCALING
# ================================

resource "aws_launch_template" "main" {
  name_prefix   = "${local.name_prefix}-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = local.current_config.instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Healthcare App - ${var.environment} Environment</h1>" > /var/www/html/index.html
    echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-instance"
    })
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-launch-template"
  })
}

resource "aws_autoscaling_group" "main" {
  name                = "${local.name_prefix}-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# ================================
# RDS SUBNET GROUP AND DATABASE
# ================================

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-database"

  # Engine configuration
  engine         = var.db_engine
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  # Storage configuration
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds_encryption.arn

  # Database configuration
  db_name  = "healthcareapp"
  username = "dbadmin"
  password = random_password.db_password.result

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Backup configuration (environment-specific)
  backup_retention_period = local.current_config.backup_retention
  backup_window          = var.db_backup_window
  maintenance_window     = var.db_maintenance_window

  # High availability and monitoring
  multi_az               = var.environment == "prod" ? true : false
  monitoring_interval    = 60
  monitoring_role_arn    = aws_iam_role.rds_enhanced_monitoring.arn
  performance_insights_enabled = true

  # Deletion protection (production only)
  deletion_protection = local.current_config.deletion_protection
  skip_final_snapshot = var.environment != "prod"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database"
  })
}

# ================================
# RDS ENHANCED MONITORING IAM ROLE
# ================================

resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${local.name_prefix}-rds-monitoring-role"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ================================
# CLOUDWATCH LOG GROUP
# ================================

resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/ec2/${local.name_prefix}/application"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-logs"
  })
}

# ================================
# VPC FLOW LOGS (Optional)
# ================================

resource "aws_flow_log" "vpc_flow_log" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  iam_role_arn    = aws_iam_role.flow_log[0].arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name              = "/aws/vpc/${local.name_prefix}/flowlogs"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs"
  })
}

data "aws_iam_policy_document" "flow_log_assume_role" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "flow_log" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name               = "${local.name_prefix}-flow-log-role"
  assume_role_policy = data.aws_iam_policy_document.flow_log_assume_role[0].json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-flow-log-role"
  })
}

data "aws_iam_policy_document" "flow_log" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
    ]

    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "flow_log" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name   = "${local.name_prefix}-flow-log-policy"
  role   = aws_iam_role.flow_log[0].id
  policy = data.aws_iam_policy_document.flow_log[0].json
}
```

### 4. Outputs Configuration (`outputs.tf`)

```hcl
# outputs.tf - Output Values (Environment Context via Workspaces)

# ================================
# VPC OUTPUTS
# ================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

# ================================
# SUBNET OUTPUTS
# ================================

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

# ================================
# LOAD BALANCER OUTPUTS
# ================================

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

# ================================
# APPLICATION URL
# ================================

output "application_url" {
  description = "URL to access the healthcare application"
  value       = "http://${aws_lb.main.dns_name}"
}

# ================================
# DATABASE OUTPUTS
# ================================

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "Name of the database"
  value       = aws_db_instance.main.db_name
}

output "database_username" {
  description = "Database username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

# ================================
# SECURITY GROUP OUTPUTS
# ================================

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# ================================
# AUTO SCALING OUTPUTS
# ================================

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.main.id
}

# ================================
# KMS OUTPUTS
# ================================

output "kms_key_id" {
  description = "ID of the KMS key for RDS encryption"
  value       = aws_kms_key.rds_encryption.key_id
  sensitive   = true
}

output "kms_key_arn" {
  description = "ARN of the KMS key for RDS encryption"
  value       = aws_kms_key.rds_encryption.arn
  sensitive   = true
}

# ================================
# MONITORING OUTPUTS
# ================================

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "rds_monitoring_role_arn" {
  description = "ARN of the RDS enhanced monitoring IAM role"
  value       = aws_iam_role.rds_enhanced_monitoring.arn
}

# ================================
# ENVIRONMENT CONFIGURATION SUMMARY
# ================================

output "environment_config" {
  description = "Configuration summary for current environment"
  value = {
    environment         = var.environment
    vpc_cidr           = local.current_config.vpc_cidr
    instance_type      = local.current_config.instance_type
    backup_retention   = local.current_config.backup_retention
    deletion_protection = local.current_config.deletion_protection
    workspace          = terraform.workspace
  }
}
```