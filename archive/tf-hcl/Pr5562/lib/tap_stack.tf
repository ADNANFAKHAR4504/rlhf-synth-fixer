# ============================================================================
# VARIABLES
# ============================================================================

variable "primary_region" {
  description = "Primary AWS region (current production)"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region (migration target)"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "migration_phase" {
  description = "Current migration phase"
  type        = string
  default     = "preparation"
}

variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = "migexample.com"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "ecommerce"
}

variable "instance_type" {
  description = "EC2 instance type"
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
  default     = 6
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 3
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 100
}

variable "notification_email" {
  description = "Email for SNS notifications"
  type        = string
  default     = "ops@example.com"
}

# ============================================================================
# DATA SOURCES
# ============================================================================

# Get availability zones for both regions
data "aws_availability_zones" "us_east_1" {
  provider = aws.us_east_1
  state    = "available"
}

data "aws_availability_zones" "eu_central_1" {
  provider = aws.eu_central_1
  state    = "available"
}

# Get latest Amazon Linux 2 AMI for both regions
data "aws_ami" "amazon_linux_us" {
  provider    = aws.us_east_1
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "amazon_linux_eu" {
  provider    = aws.eu_central_1
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  suffix = "mitr"
  
  # Common tags for all resources
  common_tags = {
    Environment     = var.environment
    ManagedBy      = "Terraform"
    Application    = var.app_name
    MigrationPhase = var.migration_phase
  }
  
  # Region-specific tags
  us_tags = merge(local.common_tags, {
    Region = var.primary_region
  })
  
  eu_tags = merge(local.common_tags, {
    Region = var.secondary_region
  })
  
  # CIDR blocks
  us_vpc_cidr = "10.0.0.0/16"
  eu_vpc_cidr = "10.1.0.0/16"
  
  # Subnet calculations
  us_public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  us_private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
  eu_public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
  eu_private_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24"]
}

# ============================================================================
# RANDOM RESOURCES
# ============================================================================

# Generate random password for RDS
resource "random_password" "rds_password" {
  length  = 16
  special = false
  upper   = true
  lower   = true
  numeric = true
}

# ============================================================================
# NETWORKING - US-EAST-1
# ============================================================================

# VPC for US-EAST-1
resource "aws_vpc" "us_vpc" {
  provider             = aws.us_east_1
  cidr_block           = local.us_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-vpc-us-${local.suffix}"
  })
}

# Internet Gateway for US-EAST-1
resource "aws_internet_gateway" "us_igw" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_vpc.id
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-igw-us-${local.suffix}"
  })
}

# Public Subnets for US-EAST-1
resource "aws_subnet" "us_public" {
  provider                = aws.us_east_1
  count                   = 2
  vpc_id                  = aws_vpc.us_vpc.id
  cidr_block              = local.us_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.us_east_1.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-public-subnet-us-${count.index + 1}-${local.suffix}"
    Type = "Public"
  })
}

# Private Subnets for US-EAST-1
resource "aws_subnet" "us_private" {
  provider          = aws.us_east_1
  count             = 2
  vpc_id            = aws_vpc.us_vpc.id
  cidr_block        = local.us_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.us_east_1.names[count.index]
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-private-subnet-us-${count.index + 1}-${local.suffix}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways in US-EAST-1
resource "aws_eip" "us_nat" {
  provider = aws.us_east_1
  count    = 2
  domain   = "vpc"
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-nat-eip-us-${count.index + 1}-${local.suffix}"
  })
}

# NAT Gateways for US-EAST-1
resource "aws_nat_gateway" "us_nat" {
  provider      = aws.us_east_1
  count         = 2
  allocation_id = aws_eip.us_nat[count.index].id
  subnet_id     = aws_subnet.us_public[count.index].id
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-nat-us-${count.index + 1}-${local.suffix}"
  })
  
  depends_on = [aws_internet_gateway.us_igw]
}

# Route Table for Public Subnets in US-EAST-1
resource "aws_route_table" "us_public" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_igw.id
  }
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-public-rt-us-${local.suffix}"
  })
}

# Route Tables for Private Subnets in US-EAST-1
resource "aws_route_table" "us_private" {
  provider = aws.us_east_1
  count    = 2
  vpc_id   = aws_vpc.us_vpc.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.us_nat[count.index].id
  }
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-private-rt-us-${count.index + 1}-${local.suffix}"
  })
}

# Route Table Associations for US-EAST-1
resource "aws_route_table_association" "us_public" {
  provider       = aws.us_east_1
  count          = 2
  subnet_id      = aws_subnet.us_public[count.index].id
  route_table_id = aws_route_table.us_public.id
}

resource "aws_route_table_association" "us_private" {
  provider       = aws.us_east_1
  count          = 2
  subnet_id      = aws_subnet.us_private[count.index].id
  route_table_id = aws_route_table.us_private[count.index].id
}

# ============================================================================
# NETWORKING - EU-CENTRAL-1
# ============================================================================

# VPC for EU-CENTRAL-1
resource "aws_vpc" "eu_vpc" {
  provider             = aws.eu_central_1
  cidr_block           = local.eu_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-vpc-eu-${local.suffix}"
  })
}

# Internet Gateway for EU-CENTRAL-1
resource "aws_internet_gateway" "eu_igw" {
  provider = aws.eu_central_1
  vpc_id   = aws_vpc.eu_vpc.id
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-igw-eu-${local.suffix}"
  })
}

# Public Subnets for EU-CENTRAL-1
resource "aws_subnet" "eu_public" {
  provider                = aws.eu_central_1
  count                   = 2
  vpc_id                  = aws_vpc.eu_vpc.id
  cidr_block              = local.eu_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.eu_central_1.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-public-subnet-eu-${count.index + 1}-${local.suffix}"
    Type = "Public"
  })
}

# Private Subnets for EU-CENTRAL-1
resource "aws_subnet" "eu_private" {
  provider          = aws.eu_central_1
  count             = 2
  vpc_id            = aws_vpc.eu_vpc.id
  cidr_block        = local.eu_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.eu_central_1.names[count.index]
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-private-subnet-eu-${count.index + 1}-${local.suffix}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways in EU-CENTRAL-1
resource "aws_eip" "eu_nat" {
  provider = aws.eu_central_1
  count    = 2
  domain   = "vpc"
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-nat-eip-eu-${count.index + 1}-${local.suffix}"
  })
}

# NAT Gateways for EU-CENTRAL-1
resource "aws_nat_gateway" "eu_nat" {
  provider      = aws.eu_central_1
  count         = 2
  allocation_id = aws_eip.eu_nat[count.index].id
  subnet_id     = aws_subnet.eu_public[count.index].id
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-nat-eu-${count.index + 1}-${local.suffix}"
  })
  
  depends_on = [aws_internet_gateway.eu_igw]
}

# Route Table for Public Subnets in EU-CENTRAL-1
resource "aws_route_table" "eu_public" {
  provider = aws.eu_central_1
  vpc_id   = aws_vpc.eu_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.eu_igw.id
  }
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-public-rt-eu-${local.suffix}"
  })
}

# Route Tables for Private Subnets in EU-CENTRAL-1
resource "aws_route_table" "eu_private" {
  provider = aws.eu_central_1
  count    = 2
  vpc_id   = aws_vpc.eu_vpc.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.eu_nat[count.index].id
  }
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-private-rt-eu-${count.index + 1}-${local.suffix}"
  })
}

# Route Table Associations for EU-CENTRAL-1
resource "aws_route_table_association" "eu_public" {
  provider       = aws.eu_central_1
  count          = 2
  subnet_id      = aws_subnet.eu_public[count.index].id
  route_table_id = aws_route_table.eu_public.id
}

resource "aws_route_table_association" "eu_private" {
  provider       = aws.eu_central_1
  count          = 2
  subnet_id      = aws_subnet.eu_private[count.index].id
  route_table_id = aws_route_table.eu_private[count.index].id
}

# ============================================================================
# VPC PEERING
# ============================================================================

# VPC Peering Connection Request from US to EU
resource "aws_vpc_peering_connection" "us_to_eu" {
  provider      = aws.us_east_1
  vpc_id        = aws_vpc.us_vpc.id
  peer_vpc_id   = aws_vpc.eu_vpc.id
  peer_region   = var.secondary_region
  auto_accept   = false
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-peering-us-to-eu-${local.suffix}"
  })
}

# Accept VPC Peering Connection in EU
resource "aws_vpc_peering_connection_accepter" "eu_accept" {
  provider                  = aws.eu_central_1
  vpc_peering_connection_id = aws_vpc_peering_connection.us_to_eu.id
  auto_accept               = true
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-peering-accepter-eu-${local.suffix}"
  })
}

# Routes for VPC Peering in US-EAST-1
resource "aws_route" "us_to_eu_public" {
  provider                  = aws.us_east_1
  route_table_id            = aws_route_table.us_public.id
  destination_cidr_block    = local.eu_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.us_to_eu.id
}

resource "aws_route" "us_to_eu_private" {
  provider                  = aws.us_east_1
  count                     = 2
  route_table_id            = aws_route_table.us_private[count.index].id
  destination_cidr_block    = local.eu_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.us_to_eu.id
}

# Routes for VPC Peering in EU-CENTRAL-1
resource "aws_route" "eu_to_us_public" {
  provider                  = aws.eu_central_1
  route_table_id            = aws_route_table.eu_public.id
  destination_cidr_block    = local.us_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.us_to_eu.id
}

resource "aws_route" "eu_to_us_private" {
  provider                  = aws.eu_central_1
  count                     = 2
  route_table_id            = aws_route_table.eu_private[count.index].id
  destination_cidr_block    = local.us_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.us_to_eu.id
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# Security Group for ALB in US-EAST-1
resource "aws_security_group" "us_alb" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-alb-sg-us-${local.suffix}"
  description = "Security group for ALB in US"
  vpc_id      = aws_vpc.us_vpc.id
  
  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    description = "HTTPS from anywhere"
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
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-alb-sg-us-${local.suffix}"
  })
}

# Security Group for EC2 instances in US-EAST-1
resource "aws_security_group" "us_ec2" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-ec2-sg-us-${local.suffix}"
  description = "Security group for EC2 instances in US"
  vpc_id      = aws_vpc.us_vpc.id
  
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.us_alb.id]
  }
  
  ingress {
    description = "SSH from VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [local.us_vpc_cidr, local.eu_vpc_cidr]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-ec2-sg-us-${local.suffix}"
  })
}

# Security Group for RDS in US-EAST-1
resource "aws_security_group" "us_rds" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-rds-sg-us-${local.suffix}"
  description = "Security group for RDS in US"
  vpc_id      = aws_vpc.us_vpc.id
  
  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.us_ec2.id]
  }
  
  ingress {
    description = "PostgreSQL from EU for replication"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [local.eu_vpc_cidr]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-rds-sg-us-${local.suffix}"
  })
}

# Security Group for ALB in EU-CENTRAL-1
resource "aws_security_group" "eu_alb" {
  provider    = aws.eu_central_1
  name        = "${var.app_name}-alb-sg-eu-${local.suffix}"
  description = "Security group for ALB in EU"
  vpc_id      = aws_vpc.eu_vpc.id
  
  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    description = "HTTPS from anywhere"
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
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-alb-sg-eu-${local.suffix}"
  })
}

# Security Group for EC2 instances in EU-CENTRAL-1
resource "aws_security_group" "eu_ec2" {
  provider    = aws.eu_central_1
  name        = "${var.app_name}-ec2-sg-eu-${local.suffix}"
  description = "Security group for EC2 instances in EU"
  vpc_id      = aws_vpc.eu_vpc.id
  
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.eu_alb.id]
  }
  
  ingress {
    description = "SSH from VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [local.eu_vpc_cidr, local.us_vpc_cidr]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-ec2-sg-eu-${local.suffix}"
  })
}

# Security Group for RDS in EU-CENTRAL-1
resource "aws_security_group" "eu_rds" {
  provider    = aws.eu_central_1
  name        = "${var.app_name}-rds-sg-eu-${local.suffix}"
  description = "Security group for RDS in EU"
  vpc_id      = aws_vpc.eu_vpc.id
  
  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eu_ec2.id]
  }
  
  ingress {
    description = "PostgreSQL from US for replication"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [local.us_vpc_cidr]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-rds-sg-eu-${local.suffix}"
  })
}

# ============================================================================
# APPLICATION LOAD BALANCERS
# ============================================================================

# ALB for US-EAST-1
resource "aws_lb" "us_alb" {
  provider           = aws.us_east_1
  name               = "${var.app_name}-alb-us-${local.suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.us_alb.id]
  subnets            = aws_subnet.us_public[*].id
  
  enable_deletion_protection = false
  enable_http2              = true
  enable_cross_zone_load_balancing = true
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-alb-us-${local.suffix}"
  })
}

# ALB Target Group for US-EAST-1
resource "aws_lb_target_group" "us_tg" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-tg-us-${local.suffix}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.us_vpc.id
  target_type = "instance"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }
  
  deregistration_delay = 300
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-tg-us-${local.suffix}"
  })
}

# ALB Listener for US-EAST-1
resource "aws_lb_listener" "us_http" {
  provider          = aws.us_east_1
  load_balancer_arn = aws_lb.us_alb.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.us_tg.arn
  }
}

# ALB for EU-CENTRAL-1
resource "aws_lb" "eu_alb" {
  provider           = aws.eu_central_1
  name               = "${var.app_name}-alb-eu-${local.suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.eu_alb.id]
  subnets            = aws_subnet.eu_public[*].id
  
  enable_deletion_protection = false
  enable_http2              = true
  enable_cross_zone_load_balancing = true
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-alb-eu-${local.suffix}"
  })
}

# ALB Target Group for EU-CENTRAL-1
resource "aws_lb_target_group" "eu_tg" {
  provider    = aws.eu_central_1
  name        = "${var.app_name}-tg-eu-${local.suffix}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.eu_vpc.id
  target_type = "instance"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }
  
  deregistration_delay = 300
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-tg-eu-${local.suffix}"
  })
}

# ALB Listener for EU-CENTRAL-1
resource "aws_lb_listener" "eu_http" {
  provider          = aws.eu_central_1
  load_balancer_arn = aws_lb.eu_alb.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.eu_tg.arn
  }
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.app_name}-ec2-role-${local.suffix}"
  
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
  
  tags = local.common_tags
}

# IAM Role Policy Attachments
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.app_name}-ec2-profile-${local.suffix}"
  role = aws_iam_role.ec2_role.name
}

# ============================================================================
# LAUNCH TEMPLATES
# ============================================================================

# User data script for EC2 instances
locals {
  user_data_script = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    
    # Simple health check page
    echo "<h1>Health Check OK - $(hostname)</h1>" > /var/www/html/index.html
    
    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
  EOF
}

# Launch Template for US-EAST-1
resource "aws_launch_template" "us_lt" {
  provider              = aws.us_east_1
  name_prefix           = "${var.app_name}-lt-us-${local.suffix}-"
  image_id              = data.aws_ami.amazon_linux_us.id
  instance_type         = var.instance_type
  vpc_security_group_ids = [aws_security_group.us_ec2.id]
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }
  
  user_data = base64encode(local.user_data_script)
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(local.us_tags, {
      Name = "${var.app_name}-instance-us-${local.suffix}"
    })
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

# Launch Template for EU-CENTRAL-1
resource "aws_launch_template" "eu_lt" {
  provider              = aws.eu_central_1
  name_prefix           = "${var.app_name}-lt-eu-${local.suffix}-"
  image_id              = data.aws_ami.amazon_linux_eu.id
  instance_type         = var.instance_type
  vpc_security_group_ids = [aws_security_group.eu_ec2.id]
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }
  
  user_data = base64encode(local.user_data_script)
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(local.eu_tags, {
      Name = "${var.app_name}-instance-eu-${local.suffix}"
    })
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# AUTO SCALING GROUPS
# ============================================================================

# Auto Scaling Group for US-EAST-1
resource "aws_autoscaling_group" "us_asg" {
  provider            = aws.us_east_1
  name                = "${var.app_name}-asg-us-${local.suffix}"
  vpc_zone_identifier = aws_subnet.us_private[*].id
  target_group_arns   = [aws_lb_target_group.us_tg.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  min_size            = var.min_size
  max_size            = var.max_size
  desired_capacity    = var.desired_capacity
  
  launch_template {
    id      = aws_launch_template.us_lt.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "${var.app_name}-asg-instance-us-${local.suffix}"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
  
  tag {
    key                 = "MigrationPhase"
    value               = var.migration_phase
    propagate_at_launch = true
  }
}

# Auto Scaling Group for EU-CENTRAL-1
resource "aws_autoscaling_group" "eu_asg" {
  provider            = aws.eu_central_1
  name                = "${var.app_name}-asg-eu-${local.suffix}"
  vpc_zone_identifier = aws_subnet.eu_private[*].id
  target_group_arns   = [aws_lb_target_group.eu_tg.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  min_size            = var.min_size
  max_size            = var.max_size
  desired_capacity    = var.desired_capacity
  
  launch_template {
    id      = aws_launch_template.eu_lt.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "${var.app_name}-asg-instance-eu-${local.suffix}"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
  
  tag {
    key                 = "MigrationPhase"
    value               = var.migration_phase
    propagate_at_launch = true
  }
}

# ============================================================================
# RDS DATABASE
# ============================================================================

# DB Subnet Groups
resource "aws_db_subnet_group" "us_db_subnet" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-db-subnet-us-${local.suffix}"
  subnet_ids  = aws_subnet.us_private[*].id
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-db-subnet-us-${local.suffix}"
  })
}

resource "aws_db_subnet_group" "eu_db_subnet" {
  provider    = aws.eu_central_1
  name        = "${var.app_name}-db-subnet-eu-${local.suffix}"
  subnet_ids  = aws_subnet.eu_private[*].id
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-db-subnet-eu-${local.suffix}"
  })
}

# RDS PostgreSQL Primary in US-EAST-1
resource "aws_db_instance" "us_primary" {
  provider               = aws.us_east_1
  identifier             = "${var.app_name}-db-us-${local.suffix}"
  engine                 = "postgres"
  engine_version         = "17.6"
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  storage_encrypted      = true
  storage_type           = "gp3"
  
  db_name  = "${var.app_name}db"
  username = "dbadmin"
  password = random_password.rds_password.result
  
  vpc_security_group_ids = [aws_security_group.us_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.us_db_subnet.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  multi_az               = true
  publicly_accessible    = false
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.app_name}-db-us-final-${local.suffix}-${formatdate("YYYY-MM-DD", timestamp())}"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-db-us-${local.suffix}"
  })
}

# RDS Read Replica in EU-CENTRAL-1
#resource "aws_db_instance" "eu_replica" {
#  provider               = aws.eu_central_1
#  identifier             = "${var.app_name}-db-eu-${local.suffix}"
#  replicate_source_db    = aws_db_instance.us_primary.arn
#  
#  instance_class         = var.db_instance_class
#  
#  # These will be inherited from source but we specify for clarity
#  storage_encrypted      = true
#  
#  skip_final_snapshot    = false
#  final_snapshot_identifier = "${var.app_name}-db-eu-final-${local.suffix}-${formatdate("YYYY-MM-DD", timestamp())}"
#  db_subnet_group_name = aws_db_subnet_group.eu_db_subnet.name  
#  tags = merge(local.eu_tags, {
#    Name = "${var.app_name}-db-eu-${local.suffix}"
#    Type = "ReadReplica"
#  })
#}

# ============================================================================
# S3 BUCKETS AND REPLICATION
# ============================================================================

# S3 Bucket in US-EAST-1
resource "aws_s3_bucket" "us_bucket" {
  provider = aws.us_east_1
  bucket   = "${var.app_name}-assets-use1-${local.suffix}"
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-assets-use1-${local.suffix}"
  })
}

# S3 Bucket Versioning for US bucket
resource "aws_s3_bucket_versioning" "us_versioning" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.us_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket in EU-CENTRAL-1
resource "aws_s3_bucket" "eu_bucket" {
  provider = aws.eu_central_1
  bucket   = "${var.app_name}-assets-euc1-${local.suffix}"
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-assets-euc1-${local.suffix}"
  })
}

# S3 Bucket Versioning for EU bucket
resource "aws_s3_bucket_versioning" "eu_versioning" {
  provider = aws.eu_central_1
  bucket   = aws_s3_bucket.eu_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# IAM Role for S3 Replication
resource "aws_iam_role" "s3_replication_role" {
  name = "${var.app_name}-s3-replication-role-${local.suffix}"
  
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
  
  tags = local.common_tags
}

# IAM Policy for S3 Replication
resource "aws_iam_role_policy" "s3_replication_policy" {
  name = "${var.app_name}-s3-replication-policy-${local.suffix}"
  role = aws_iam_role.s3_replication_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.us_bucket.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.us_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.eu_bucket.arn}/*"
      }
    ]
  })
}

# S3 Bucket Replication Configuration
resource "aws_s3_bucket_replication_configuration" "us_to_eu" {
  provider = aws.us_east_1
  role     = aws_iam_role.s3_replication_role.arn
  bucket   = aws_s3_bucket.us_bucket.id
  
  rule {
    id     = "replicate-all"
    status = "Enabled"
    
    filter {}
    
    delete_marker_replication {
      status = "Enabled"
    }
    
    destination {
      bucket        = aws_s3_bucket.eu_bucket.arn
      storage_class = "STANDARD"
    }
  }
  
  depends_on = [aws_s3_bucket_versioning.eu_versioning]
}

# ============================================================================
# CLOUDFRONT DISTRIBUTION
# ============================================================================

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "${var.app_name}-oai-${local.suffix}"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.app_name}-cdn-${local.suffix}"
  default_root_object = "index.html"
  
  # Origin for US ALB
  origin {
    domain_name = aws_lb.us_alb.dns_name
    origin_id   = "alb-us-${local.suffix}"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  # Origin for EU ALB
  origin {
    domain_name = aws_lb.eu_alb.dns_name
    origin_id   = "alb-eu-${local.suffix}"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  # Origin Group for failover
  origin_group {
    origin_id = "alb-group-${local.suffix}"
    
    failover_criteria {
      status_codes = [500, 502, 503, 504]
    }
    
    member {
      origin_id = "alb-us-${local.suffix}"
    }
    
    member {
      origin_id = "alb-eu-${local.suffix}"
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "alb-group-${local.suffix}"
    
    forwarded_values {
      query_string = true
      headers      = ["Host", "Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-cdn-${local.suffix}"
  })
}

# ============================================================================
# ROUTE53
# ============================================================================

# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-zone-${local.suffix}"
  })
}

# Health Check for US ALB
resource "aws_route53_health_check" "us_alb_health" {
  fqdn              = aws_lb.us_alb.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/"
  failure_threshold = 3
  request_interval  = 30
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-health-us-alb-${local.suffix}"
  })
}

# Health Check for EU ALB
resource "aws_route53_health_check" "eu_alb_health" {
  fqdn              = aws_lb.eu_alb.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/"
  failure_threshold = 3
  request_interval  = 30
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-health-eu-alb-${local.suffix}"
  })
}

# Weighted routing record for US
resource "aws_route53_record" "us_weighted" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60
  
  weighted_routing_policy {
    weight = 50
  }
  
  set_identifier  = "us-east-1-${local.suffix}"
  records         = [aws_lb.us_alb.dns_name]
  health_check_id = aws_route53_health_check.us_alb_health.id
}

# Weighted routing record for EU
resource "aws_route53_record" "eu_weighted" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60
  
  weighted_routing_policy {
    weight = 50
  }
  
  set_identifier  = "eu-central-1-${local.suffix}"
  records         = [aws_lb.eu_alb.dns_name]
  health_check_id = aws_route53_health_check.eu_alb_health.id
}

# Main domain record pointing to CloudFront
resource "aws_route53_record" "main" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  
  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

# ============================================================================
# SNS TOPICS
# ============================================================================

# SNS Topic for US region alerts
resource "aws_sns_topic" "us_alerts" {
  provider = aws.us_east_1
  name     = "${var.app_name}-alerts-us-${local.suffix}"
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-alerts-us-${local.suffix}"
  })
}

# SNS Topic for EU region alerts
resource "aws_sns_topic" "eu_alerts" {
  provider = aws.eu_central_1
  name     = "${var.app_name}-alerts-eu-${local.suffix}"
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-alerts-eu-${local.suffix}"
  })
}

# SNS Email Subscription for US
resource "aws_sns_topic_subscription" "us_email" {
  provider  = aws.us_east_1
  topic_arn = aws_sns_topic.us_alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# SNS Email Subscription for EU
resource "aws_sns_topic_subscription" "eu_email" {
  provider  = aws.eu_central_1
  topic_arn = aws_sns_topic.eu_alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

# EC2 High CPU Alarm for US ASG
resource "aws_cloudwatch_metric_alarm" "us_ec2_cpu_high" {
  provider            = aws.us_east_1
  alarm_name          = "${var.app_name}-ec2-cpu-high-us-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 cpu utilization in US"
  alarm_actions       = [aws_sns_topic.us_alerts.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.us_asg.name
  }
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-ec2-cpu-high-us-${local.suffix}"
  })
}

# EC2 High CPU Alarm for EU ASG
resource "aws_cloudwatch_metric_alarm" "eu_ec2_cpu_high" {
  provider            = aws.eu_central_1
  alarm_name          = "${var.app_name}-ec2-cpu-high-eu-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 cpu utilization in EU"
  alarm_actions       = [aws_sns_topic.eu_alerts.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.eu_asg.name
  }
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-ec2-cpu-high-eu-${local.suffix}"
  })
}

# RDS CPU Alarm for US
resource "aws_cloudwatch_metric_alarm" "us_rds_cpu" {
  provider            = aws.us_east_1
  alarm_name          = "${var.app_name}-rds-cpu-us-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors RDS cpu utilization in US"
  alarm_actions       = [aws_sns_topic.us_alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.us_primary.identifier
  }
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-rds-cpu-us-${local.suffix}"
  })
}

# RDS Replication Lag Alarm for EU Replica
#resource "aws_cloudwatch_metric_alarm" "eu_rds_lag" {
#  provider            = aws.eu_central_1
#  alarm_name          = "${var.app_name}-rds-lag-eu-${local.suffix}"
#  comparison_operator = "GreaterThanThreshold"
#  evaluation_periods  = "2"
#  metric_name         = "ReplicaLag"
#  namespace           = "AWS/RDS"
#  period              = "60"
#  statistic           = "Average"
#  threshold           = "30"
#  alarm_description   = "This metric monitors RDS replication lag in EU"
#  alarm_actions       = [aws_sns_topic.eu_alerts.arn]
#  treat_missing_data  = "notBreaching"
#  
#  dimensions = {
#    DBInstanceIdentifier = aws_db_instance.eu_replica.identifier
#  }
#  
#  tags = merge(local.eu_tags, {
#    Name = "${var.app_name}-rds-lag-eu-${local.suffix}"
#  })
#}

# ALB Target Health Alarm for US
resource "aws_cloudwatch_metric_alarm" "us_alb_unhealthy_hosts" {
  provider            = aws.us_east_1
  alarm_name          = "${var.app_name}-alb-unhealthy-us-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when we have unhealthy targets in US"
  alarm_actions       = [aws_sns_topic.us_alerts.arn]
  
  dimensions = {
    TargetGroup  = aws_lb_target_group.us_tg.arn_suffix
    LoadBalancer = aws_lb.us_alb.arn_suffix
  }
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-alb-unhealthy-us-${local.suffix}"
  })
}

# ALB Target Health Alarm for EU
resource "aws_cloudwatch_metric_alarm" "eu_alb_unhealthy_hosts" {
  provider            = aws.eu_central_1
  alarm_name          = "${var.app_name}-alb-unhealthy-eu-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when we have unhealthy targets in EU"
  alarm_actions       = [aws_sns_topic.eu_alerts.arn]
  
  dimensions = {
    TargetGroup  = aws_lb_target_group.eu_tg.arn_suffix
    LoadBalancer = aws_lb.eu_alb.arn_suffix
  }
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-alb-unhealthy-eu-${local.suffix}"
  })
}

# ============================================================================
# OUTPUTS
# ============================================================================

# VPC Outputs
output "us_vpc_id" {
  description = "US VPC ID"
  value       = aws_vpc.us_vpc.id
}

output "eu_vpc_id" {
  description = "EU VPC ID"
  value       = aws_vpc.eu_vpc.id
}

output "us_vpc_cidr" {
  description = "US VPC CIDR block"
  value       = aws_vpc.us_vpc.cidr_block
}

output "eu_vpc_cidr" {
  description = "EU VPC CIDR block"
  value       = aws_vpc.eu_vpc.cidr_block
}

# Subnet Outputs
output "us_public_subnet_ids" {
  description = "US public subnet IDs"
  value       = aws_subnet.us_public[*].id
}

output "us_private_subnet_ids" {
  description = "US private subnet IDs"
  value       = aws_subnet.us_private[*].id
}

output "eu_public_subnet_ids" {
  description = "EU public subnet IDs"
  value       = aws_subnet.eu_public[*].id
}

output "eu_private_subnet_ids" {
  description = "EU private subnet IDs"
  value       = aws_subnet.eu_private[*].id
}

# NAT Gateway Outputs
output "us_nat_gateway_ids" {
  description = "US NAT Gateway IDs"
  value       = aws_nat_gateway.us_nat[*].id
}

output "eu_nat_gateway_ids" {
  description = "EU NAT Gateway IDs"
  value       = aws_nat_gateway.eu_nat[*].id
}

# VPC Peering Output
output "vpc_peering_connection_id" {
  description = "VPC Peering Connection ID"
  value       = aws_vpc_peering_connection.us_to_eu.id
}

# ALB Outputs
output "us_alb_dns" {
  description = "US ALB DNS name"
  value       = aws_lb.us_alb.dns_name
}

output "us_alb_arn" {
  description = "US ALB ARN"
  value       = aws_lb.us_alb.arn
}

output "eu_alb_dns" {
  description = "EU ALB DNS name"
  value       = aws_lb.eu_alb.dns_name
}

output "eu_alb_arn" {
  description = "EU ALB ARN"
  value       = aws_lb.eu_alb.arn
}

# Target Group Outputs
output "us_target_group_arn" {
  description = "US Target Group ARN"
  value       = aws_lb_target_group.us_tg.arn
}

output "eu_target_group_arn" {
  description = "EU Target Group ARN"
  value       = aws_lb_target_group.eu_tg.arn
}

# ASG Outputs
output "us_asg_name" {
  description = "US Auto Scaling Group name"
  value       = aws_autoscaling_group.us_asg.name
}

output "eu_asg_name" {
  description = "EU Auto Scaling Group name"
  value       = aws_autoscaling_group.eu_asg.name
}

# RDS Outputs
output "us_rds_endpoint" {
  description = "US RDS instance endpoint"
  value       = aws_db_instance.us_primary.endpoint
}

output "us_rds_arn" {
  description = "US RDS instance ARN"
  value       = aws_db_instance.us_primary.arn
}


# S3 Outputs
output "us_s3_bucket_name" {
  description = "US S3 bucket name"
  value       = aws_s3_bucket.us_bucket.id
}

output "us_s3_bucket_arn" {
  description = "US S3 bucket ARN"
  value       = aws_s3_bucket.us_bucket.arn
}

output "eu_s3_bucket_name" {
  description = "EU S3 bucket name"
  value       = aws_s3_bucket.eu_bucket.id
}

output "eu_s3_bucket_arn" {
  description = "EU S3 bucket ARN"
  value       = aws_s3_bucket.eu_bucket.arn
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.cdn.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

# Route53 Outputs
output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route53 zone name servers"
  value       = aws_route53_zone.main.name_servers
}

# SNS Topic Outputs
output "us_sns_topic_arn" {
  description = "US SNS topic ARN"
  value       = aws_sns_topic.us_alerts.arn
}

output "eu_sns_topic_arn" {
  description = "EU SNS topic ARN"
  value       = aws_sns_topic.eu_alerts.arn
}

# Security Group Outputs
output "us_alb_sg_id" {
  description = "US ALB security group ID"
  value       = aws_security_group.us_alb.id
}

output "us_ec2_sg_id" {
  description = "US EC2 security group ID"
  value       = aws_security_group.us_ec2.id
}

output "us_rds_sg_id" {
  description = "US RDS security group ID"
  value       = aws_security_group.us_rds.id
}

output "eu_alb_sg_id" {
  description = "EU ALB security group ID"
  value       = aws_security_group.eu_alb.id
}

output "eu_ec2_sg_id" {
  description = "EU EC2 security group ID"
  value       = aws_security_group.eu_ec2.id
}

output "eu_rds_sg_id" {
  description = "EU RDS security group ID"
  value       = aws_security_group.eu_rds.id
}

# Health Check Outputs
output "us_health_check_id" {
  description = "US ALB health check ID"
  value       = aws_route53_health_check.us_alb_health.id
}

output "eu_health_check_id" {
  description = "EU ALB health check ID"
  value       = aws_route53_health_check.eu_alb_health.id
}

# Launch Template Outputs
output "us_launch_template_id" {
  description = "US launch template ID"
  value       = aws_launch_template.us_lt.id
}

output "eu_launch_template_id" {
  description = "EU launch template ID"
  value       = aws_launch_template.eu_lt.id
}

# IAM Role Outputs
output "ec2_role_arn" {
  description = "EC2 IAM role ARN"
  value       = aws_iam_role.ec2_role.arn
}

output "s3_replication_role_arn" {
  description = "S3 replication IAM role ARN"
  value       = aws_iam_role.s3_replication_role.arn
}

output "aws_primary_region"{
  description = "aws primary region"
  value       = var.primary_region
}

output "aws_secondary_region"{
  description = "aws secondary region"
  value       = var.secondary_region
}
