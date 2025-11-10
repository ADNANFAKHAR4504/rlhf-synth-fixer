This is a complex multi-region AWS infrastructure migration request using Terraform. The user wants to:

1. Build parallel infrastructure in eu-central-1 that mirrors us-east-1
2. Use VPC peering for inter-region communication
3. Set up database replication
4. Configure S3 bucket replication
5. Use CloudFront and Route53 for traffic management
6. Implement comprehensive monitoring

```hcl
# ========================================
# VARIABLES
# ========================================

variable "primary_region" {
  description = "Primary AWS region (source)"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region (target)"
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

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "ecommerce"
}

variable "instance_type" {
  description = "EC2 instance type for application servers"
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
  default     = 4
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "ecommerce_db"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
}

variable "route53_zone_name" {
  description = "Route53 hosted zone domain name"
  type        = string
  default     = "example.com"
}

variable "notification_email" {
  description = "Email for CloudWatch notifications"
  type        = string
  default     = "ops@example.com"
}

# ========================================
# LOCALS
# ========================================

locals {
  suffix = "mitr"
  
  # Common tags for all resources
  common_tags = {
    Environment     = var.environment
    MigrationPhase  = var.migration_phase
    ManagedBy       = "Terraform"
    Application     = var.app_name
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
  
  # S3 bucket names
  us_bucket_name = "${var.app_name}-assets-use1-${local.suffix}"
  eu_bucket_name = "${var.app_name}-assets-euc1-${local.suffix}"
}

# ========================================
# DATA SOURCES
# ========================================

# Get availability zones for US region
data "aws_availability_zones" "us_azs" {
  provider = aws.us_east_1
  state    = "available"
}

# Get availability zones for EU region
data "aws_availability_zones" "eu_azs" {
  provider = aws.eu_central_1
  state    = "available"
}

# Get latest Amazon Linux 2 AMI for US
data "aws_ami" "us_amazon_linux" {
  provider    = aws.us_east_1
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

# Get latest Amazon Linux 2 AMI for EU
data "aws_ami" "eu_amazon_linux" {
  provider    = aws.eu_central_1
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

# Get Route53 Hosted Zone
data "aws_route53_zone" "main" {
  name = var.route53_zone_name
}

# ========================================
# RANDOM PASSWORD FOR RDS
# ========================================

resource "random_password" "rds_password" {
  length  = 16
  special = false
  upper   = true
  lower   = true
  numeric = true
}

# ========================================
# NETWORKING - US-EAST-1
# ========================================

# VPC for US Region
resource "aws_vpc" "us_vpc" {
  provider             = aws.us_east_1
  cidr_block           = local.us_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-vpc-us-${local.suffix}"
  })
}

# Internet Gateway for US
resource "aws_internet_gateway" "us_igw" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_vpc.id
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-igw-us-${local.suffix}"
  })
}

# Public Subnets for US
resource "aws_subnet" "us_public" {
  count                   = 2
  provider                = aws.us_east_1
  vpc_id                  = aws_vpc.us_vpc.id
  cidr_block              = local.us_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.us_azs.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-public-subnet-us-${count.index + 1}-${local.suffix}"
    Type = "Public"
  })
}

# Private Subnets for US
resource "aws_subnet" "us_private" {
  count             = 2
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_vpc.id
  cidr_block        = local.us_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.us_azs.names[count.index]
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-private-subnet-us-${count.index + 1}-${local.suffix}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways in US
resource "aws_eip" "us_nat" {
  count    = 2
  provider = aws.us_east_1
  domain   = "vpc"
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-nat-eip-us-${count.index + 1}-${local.suffix}"
  })
}

# NAT Gateways for US
resource "aws_nat_gateway" "us_nat" {
  count         = 2
  provider      = aws.us_east_1
  allocation_id = aws_eip.us_nat[count.index].id
  subnet_id     = aws_subnet.us_public[count.index].id
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-nat-us-${count.index + 1}-${local.suffix}"
  })
  
  depends_on = [aws_internet_gateway.us_igw]
}

# Route Table for Public Subnets in US
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

# Route Tables for Private Subnets in US
resource "aws_route_table" "us_private" {
  count    = 2
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_vpc.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.us_nat[count.index].id
  }
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-private-rt-us-${count.index + 1}-${local.suffix}"
  })
}

# Route Table Associations for US Public Subnets
resource "aws_route_table_association" "us_public" {
  count          = 2
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_public[count.index].id
  route_table_id = aws_route_table.us_public.id
}

# Route Table Associations for US Private Subnets
resource "aws_route_table_association" "us_private" {
  count          = 2
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_private[count.index].id
  route_table_id = aws_route_table.us_private[count.index].id
}

# ========================================
# NETWORKING - EU-CENTRAL-1
# ========================================

# VPC for EU Region
resource "aws_vpc" "eu_vpc" {
  provider             = aws.eu_central_1
  cidr_block           = local.eu_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-vpc-eu-${local.suffix}"
  })
}

# Internet Gateway for EU
resource "aws_internet_gateway" "eu_igw" {
  provider = aws.eu_central_1
  vpc_id   = aws_vpc.eu_vpc.id
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-igw-eu-${local.suffix}"
  })
}

# Public Subnets for EU
resource "aws_subnet" "eu_public" {
  count                   = 2
  provider                = aws.eu_central_1
  vpc_id                  = aws_vpc.eu_vpc.id
  cidr_block              = local.eu_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.eu_azs.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-public-subnet-eu-${count.index + 1}-${local.suffix}"
    Type = "Public"
  })
}

# Private Subnets for EU
resource "aws_subnet" "eu_private" {
  count             = 2
  provider          = aws.eu_central_1
  vpc_id            = aws_vpc.eu_vpc.id
  cidr_block        = local.eu_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.eu_azs.names[count.index]
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-private-subnet-eu-${count.index + 1}-${local.suffix}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways in EU
resource "aws_eip" "eu_nat" {
  count    = 2
  provider = aws.eu_central_1
  domain   = "vpc"
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-nat-eip-eu-${count.index + 1}-${local.suffix}"
  })
}

# NAT Gateways for EU
resource "aws_nat_gateway" "eu_nat" {
  count         = 2
  provider      = aws.eu_central_1
  allocation_id = aws_eip.eu_nat[count.index].id
  subnet_id     = aws_subnet.eu_public[count.index].id
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-nat-eu-${count.index + 1}-${local.suffix}"
  })
  
  depends_on = [aws_internet_gateway.eu_igw]
}

# Route Table for Public Subnets in EU
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

# Route Tables for Private Subnets in EU
resource "aws_route_table" "eu_private" {
  count    = 2
  provider = aws.eu_central_1
  vpc_id   = aws_vpc.eu_vpc.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.eu_nat[count.index].id
  }
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-private-rt-eu-${count.index + 1}-${local.suffix}"
  })
}

# Route Table Associations for EU Public Subnets
resource "aws_route_table_association" "eu_public" {
  count          = 2
  provider       = aws.eu_central_1
  subnet_id      = aws_subnet.eu_public[count.index].id
  route_table_id = aws_route_table.eu_public.id
}

# Route Table Associations for EU Private Subnets
resource "aws_route_table_association" "eu_private" {
  count          = 2
  provider       = aws.eu_central_1
  subnet_id      = aws_subnet.eu_private[count.index].id
  route_table_id = aws_route_table.eu_private[count.index].id
}

# ========================================
# VPC PEERING
# ========================================

# VPC Peering Connection Request (from US to EU)
resource "aws_vpc_peering_connection" "us_to_eu" {
  provider      = aws.us_east_1
  vpc_id        = aws_vpc.us_vpc.id
  peer_vpc_id   = aws_vpc.eu_vpc.id
  peer_region   = var.secondary_region
  auto_accept   = false
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-peering-us-eu-${local.suffix}"
  })
}

# Accept the VPC Peering Connection in EU
resource "aws_vpc_peering_connection_accepter" "eu_accept" {
  provider                  = aws.eu_central_1
  vpc_peering_connection_id = aws_vpc_peering_connection.us_to_eu.id
  auto_accept               = true
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-peering-accept-${local.suffix}"
  })
}

# Routes for VPC Peering in US
resource "aws_route" "us_to_eu_private" {
  count                     = 2
  provider                  = aws.us_east_1
  route_table_id            = aws_route_table.us_private[count.index].id
  destination_cidr_block    = local.eu_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.us_to_eu.id
}

# Routes for VPC Peering in EU
resource "aws_route" "eu_to_us_private" {
  count                     = 2
  provider                  = aws.eu_central_1
  route_table_id            = aws_route_table.eu_private[count.index].id
  destination_cidr_block    = local.us_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.us_to_eu.id
}

# ========================================
# SECURITY GROUPS
# ========================================

# ALB Security Group for US
resource "aws_security_group" "us_alb" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-alb-sg-us-${local.suffix}"
  description = "Security group for Application Load Balancer in US"
  vpc_id      = aws_vpc.us_vpc.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from Internet"
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from Internet"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-alb-sg-us-${local.suffix}"
  })
}

# Application Security Group for US
resource "aws_security_group" "us_app" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-app-sg-us-${local.suffix}"
  description = "Security group for Application instances in US"
  vpc_id      = aws_vpc.us_vpc.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.us_alb.id]
    description     = "HTTP from ALB"
  }
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [local.us_vpc_cidr]
    description = "SSH from VPC"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-app-sg-us-${local.suffix}"
  })
}

# RDS Security Group for US
resource "aws_security_group" "us_rds" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-rds-sg-us-${local.suffix}"
  description = "Security group for RDS database in US"
  vpc_id      = aws_vpc.us_vpc.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.us_app.id]
    description     = "PostgreSQL from App servers"
  }
  
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [local.eu_vpc_cidr]
    description = "PostgreSQL replication from EU"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-rds-sg-us-${local.suffix}"
  })
}

# ALB Security Group for EU
resource "aws_security_group" "eu_alb" {
  provider    = aws.eu_central_1
  name        = "${var.app_name}-alb-sg-eu-${local.suffix}"
  description = "Security group for Application Load Balancer in EU"
  vpc_id      = aws_vpc.eu_vpc.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from Internet"
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from Internet"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-alb-sg-eu-${local.suffix}"
  })
}

# Application Security Group for EU
resource "aws_security_group" "eu_app" {
  provider    = aws.eu_central_1
  name        = "${var.app_name}-app-sg-eu-${local.suffix}"
  description = "Security group for Application instances in EU"
  vpc_id      = aws_vpc.eu_vpc.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.eu_alb.id]
    description     = "HTTP from ALB"
  }
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [local.eu_vpc_cidr]
    description = "SSH from VPC"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-app-sg-eu-${local.suffix}"
  })
}

# RDS Security Group for EU
resource "aws_security_group" "eu_rds" {
  provider    = aws.eu_central_1
  name        = "${var.app_name}-rds-sg-eu-${local.suffix}"
  description = "Security group for RDS database in EU"
  vpc_id      = aws_vpc.eu_vpc.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eu_app.id]
    description     = "PostgreSQL from App servers"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-rds-sg-eu-${local.suffix}"
  })
}

# ========================================
# APPLICATION LOAD BALANCERS
# ========================================

# ALB for US
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

# ALB Target Group for US
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
    path                = "/health"
    matcher             = "200"
  }
  
  deregistration_delay = 300
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-tg-us-${local.suffix}"
  })
}

# ALB Listener for US
resource "aws_lb_listener" "us_listener" {
  provider          = aws.us_east_1
  load_balancer_arn = aws_lb.us_alb.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.us_tg.arn
  }
}

# ALB for EU
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

# ALB Target Group for EU
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
    path                = "/health"
    matcher             = "200"
  }
  
  deregistration_delay = 300
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-tg-eu-${local.suffix}"
  })
}

# ALB Listener for EU
resource "aws_lb_listener" "eu_listener" {
  provider          = aws.eu_central_1
  load_balancer_arn = aws_lb.eu_alb.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.eu_tg.arn
  }
}

# ========================================
# LAUNCH TEMPLATES & AUTO SCALING
# ========================================

# Launch Template for US
resource "aws_launch_template" "us_lt" {
  provider               = aws.us_east_1
  name_prefix           = "${var.app_name}-lt-us-${local.suffix}-"
  image_id              = data.aws_ami.us_amazon_linux.id
  instance_type         = var.instance_type
  vpc_security_group_ids = [aws_security_group.us_app.id]
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Application Server - US Region</h1>" > /var/www/html/index.html
    echo "OK" > /var/www/html/health
    
    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
  EOF
  )
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
  
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

# Auto Scaling Group for US
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
    key                 = "Region"
    value               = var.primary_region
    propagate_at_launch = true
  }
}

# Launch Template for EU
resource "aws_launch_template" "eu_lt" {
  provider               = aws.eu_central_1
  name_prefix           = "${var.app_name}-lt-eu-${local.suffix}-"
  image_id              = data.aws_ami.eu_amazon_linux.id
  instance_type         = var.instance_type
  vpc_security_group_ids = [aws_security_group.eu_app.id]
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Application Server - EU Region</h1>" > /var/www/html/index.html
    echo "OK" > /var/www/html/health
    
    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
  EOF
  )
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
  
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

# Auto Scaling Group for EU
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
    key                 = "Region"
    value               = var.secondary_region
    propagate_at_launch = true
  }
}

# ========================================
# RDS DATABASE
# ========================================

# DB Subnet Group for US
resource "aws_db_subnet_group" "us_db_subnet" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-db-subnet-us-${local.suffix}"
  description = "DB subnet group for US region"
  subnet_ids  = aws_subnet.us_private[*].id
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-db-subnet-us-${local.suffix}"
  })
}

# RDS Instance for US (Primary)
resource "aws_db_instance" "us_primary" {
  provider                = aws.us_east_1
  identifier              = "${var.app_name}-db-us-${local.suffix}"
  engine                  = "postgres"
  engine_version          = "14.9"
  instance_class          = var.db_instance_class
  allocated_storage       = 100
  storage_type            = "gp3"
  storage_encrypted       = true
  
  db_name  = var.db_name
  username = var.db_username
  password = random_password.rds_password.result
  
  vpc_security_group_ids = [aws_security_group.us_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.us_db_subnet.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  
  multi_az               = true
  publicly_accessible    = false
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.app_name}-db-final-us-${local.suffix}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-db-us-${local.suffix}"
  })
}

# DB Subnet Group for EU
resource "aws_db_subnet_group" "eu_db_subnet" {
  provider    = aws.eu_central_1
  name        = "${var.app_name}-db-subnet-eu-${local.suffix}"
  description = "DB subnet group for EU region"
  subnet_ids  = aws_subnet.eu_private[*].id
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-db-subnet-eu-${local.suffix}"
  })
}

# RDS Read Replica for EU
resource "aws_db_instance" "eu_replica" {
  provider               = aws.eu_central_1
  identifier             = "${var.app_name}-db-replica-eu-${local.suffix}"
  replicate_source_db    = aws_db_instance.us_primary.arn
  instance_class         = var.db_instance_class
  
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.app_name}-db-final-eu-${local.suffix}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-db-replica-eu-${local.suffix}"
  })
  
  depends_on = [
    aws_db_subnet_group.eu_db_subnet,
    aws_security_group.eu_rds
  ]
}

# ========================================
# S3 BUCKETS & REPLICATION
# ========================================

# S3 Bucket for US
resource "aws_s3_bucket" "us_bucket" {
  provider = aws.us_east_1
  bucket   = local.us_bucket_name
  
  tags = merge(local.us_tags, {
    Name = local.us_bucket_name
  })
}

# S3 Bucket Versioning for US
resource "aws_s3_bucket_versioning" "us_versioning" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.us_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption for US
resource "aws_s3_bucket_server_side_encryption_configuration" "us_encryption" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.us_bucket.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket for EU
resource "aws_s3_bucket" "eu_bucket" {
  provider = aws.eu_central_1
  bucket   = local.eu_bucket_name
  
  tags = merge(local.eu_tags, {
    Name = local.eu_bucket_name
  })
}

# S3 Bucket Versioning for EU
resource "aws_s3_bucket_versioning" "eu_versioning" {
  provider = aws.eu_central_1
  bucket   = aws_s3_bucket.eu_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption for EU
resource "aws_s3_bucket_server_side_encryption_configuration" "eu_encryption" {
  provider = aws.eu_central_1
  bucket   = aws_s3_bucket.eu_bucket.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# IAM Role for S3 Replication
resource "aws_iam_role" "replication" {
  provider = aws.us_east_1
  name     = "${var.app_name}-s3-replication-role-${local.suffix}"
  
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
  
  tags = local.us_tags
}

# IAM Policy for S3 Replication
resource "aws_iam_role_policy" "replication" {
  provider = aws.us_east_1
  name     = "${var.app_name}-s3-replication-policy-${local.suffix}"
  role     = aws_iam_role.replication.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = aws_s3_bucket.us_bucket.arn
      },
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Effect = "Allow"
        Resource = "${aws_s3_bucket.us_bucket.arn}/*"
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Effect = "Allow"
        Resource = "${aws_s3_bucket.eu_bucket.arn}/*"
      }
    ]
  })
}

# S3 Bucket Replication Configuration
resource "aws_s3_bucket_replication_configuration" "replication" {
  provider = aws.us_east_1
  role     = aws_iam_role.replication.arn
  bucket   = aws_s3_bucket.us_bucket.id
  
  rule {
    id     = "replicate-all"
    status = "Enabled"
    
    destination {
      bucket        = aws_s3_bucket.eu_bucket.arn
      storage_class = "STANDARD"
    }
  }
  
  depends_on = [aws_s3_bucket_versioning.us_versioning]
}

# ========================================
# CLOUDFRONT DISTRIBUTION
# ========================================

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.app_name} CloudFront Distribution"
  default_root_object = "index.html"
  
  # Primary Origin - US ALB
  origin {
    domain_name = aws_lb.us_alb.dns_name
    origin_id   = "US-ALB"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  # Secondary Origin - EU ALB
  origin {
    domain_name = aws_lb.eu_alb.dns_name
    origin_id   = "EU-ALB"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  # Origin Group for Failover
  origin_group {
    origin_id = "ALB-GROUP"
    
    failover_criteria {
      status_codes = [500, 502, 503, 504]
    }
    
    member {
      origin_id = "US-ALB"
    }
    
    member {
      origin_id = "EU-ALB"
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-GROUP"
    
    forwarded_values {
      query_string = true
      headers      = ["Host", "CloudFront-Forwarded-Proto"]
      
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }
  
  price_class = "PriceClass_All"
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = local.common_tags
}

# ========================================
# ROUTE53
# ========================================

# Health Check for US ALB
resource "aws_route53_health_check" "us_health" {
  fqdn              = aws_lb.us_alb.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-health-check-us-${local.suffix}"
  })
}

# Health Check for EU ALB
resource "aws_route53_health_check" "eu_health" {
  fqdn              = aws_lb.eu_alb.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-health-check-eu-${local.suffix}"
  })
}

# Route53 Record for US (Weighted)
resource "aws_route53_record" "us_weighted" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "app.${var.route53_zone_name}"
  type    = "CNAME"
  ttl     = 60
  
  weighted_routing_policy {
    weight = 100  # Start with 100% traffic to US
  }
  
  set_identifier  = "US-Region"
  records         = [aws_lb.us_alb.dns_name]
  health_check_id = aws_route53_health_check.us_health.id
}

# Route53 Record for EU (Weighted)
resource "aws_route53_record" "eu_weighted" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "app.${var.route53_zone_name}"
  type    = "CNAME"
  ttl     = 60
  
  weighted_routing_policy {
    weight = 0  # Start with 0% traffic to EU
  }
  
  set_identifier  = "EU-Region"
  records         = [aws_lb.eu_alb.dns_name]
  health_check_id = aws_route53_health_check.eu_health.id
}

# Route53 Record for CloudFront
resource "aws_route53_record" "cloudfront" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "cdn.${var.route53_zone_name}"
  type    = "CNAME"
  ttl     = 300
  records = [aws_cloudfront_distribution.cdn.domain_name]
}

# ========================================
# MONITORING - SNS
# ========================================

# SNS Topic for US Alerts
resource "aws_sns_topic" "us_alerts" {
  provider = aws.us_east_1
  name     = "${var.app_name}-alerts-us-${local.suffix}"
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-alerts-us-${local.suffix}"
  })
}

# SNS Topic Subscription for US
resource "aws_sns_topic_subscription" "us_email" {
  provider  = aws.us_east_1
  topic_arn = aws_sns_topic.us_alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# SNS Topic for EU Alerts
resource "aws_sns_topic" "eu_alerts" {
  provider = aws.eu_central_1
  name     = "${var.app_name}-alerts-eu-${local.suffix}"
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-alerts-eu-${local.suffix}"
  })
}

# SNS Topic Subscription for EU
resource "aws_sns_topic_subscription" "eu_email" {
  provider  = aws.eu_central_1
  topic_arn = aws_sns_topic.eu_alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# ========================================
# MONITORING - CLOUDWATCH ALARMS
# ========================================

# US ALB Target Health Alarm
resource "aws_cloudwatch_metric_alarm" "us_alb_healthy_hosts" {
  provider            = aws.us_east_1
  alarm_name          = "${var.app_name}-us-alb-healthy-hosts-${local.suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = var.min_size
  alarm_description   = "Alarm when healthy host count drops below minimum"
  alarm_actions       = [aws_sns_topic.us_alerts.arn]
  
  dimensions = {
    TargetGroup  = aws_lb_target_group.us_tg.arn_suffix
    LoadBalancer = aws_lb.us_alb.arn_suffix
  }
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-us-alb-alarm-${local.suffix}"
  })
}

# EU ALB Target Health Alarm
resource "aws_cloudwatch_metric_alarm" "eu_alb_healthy_hosts" {
  provider            = aws.eu_central_1
  alarm_name          = "${var.app_name}-eu-alb-healthy-hosts-${local.suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = var.min_size
  alarm_description   = "Alarm when healthy host count drops below minimum"
  alarm_actions       = [aws_sns_topic.eu_alerts.arn]
  
  dimensions = {
    TargetGroup  = aws_lb_target_group.eu_tg.arn_suffix
    LoadBalancer = aws_lb.eu_alb.arn_suffix
  }
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-eu-alb-alarm-${local.suffix}"
  })
}

# US RDS CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "us_rds_cpu" {
  provider            = aws.us_east_1
  alarm_name          = "${var.app_name}-us-rds-cpu-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "RDS instance CPU utilization"
  alarm_actions       = [aws_sns_topic.us_alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.us_primary.id
  }
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-us-rds-cpu-alarm-${local.suffix}"
  })
}

# EU RDS Read Replica Lag Alarm
resource "aws_cloudwatch_metric_alarm" "eu_replica_lag" {
  provider            = aws.eu_central_1
  alarm_name          = "${var.app_name}-eu-replica-lag-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "RDS Read Replica Lag"
  alarm_actions       = [aws_sns_topic.eu_alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.eu_replica.id
  }
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-eu-replica-lag-alarm-${local.suffix}"
  })
  
  depends_on = [aws_db_instance.eu_replica]
}

# US ASG CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "us_asg_cpu" {
  provider            = aws.us_east_1
  alarm_name          = "${var.app_name}-us-asg-cpu-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "ASG average CPU utilization"
  alarm_actions       = [aws_sns_topic.us_alerts.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.us_asg.name
  }
  
  tags = merge(local.us_tags, {
    Name = "${var.app_name}-us-asg-cpu-alarm-${local.suffix}"
  })
}

# EU ASG CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "eu_asg_cpu" {
  provider            = aws.eu_central_1
  alarm_name          = "${var.app_name}-eu-asg-cpu-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "ASG average CPU utilization"
  alarm_actions       = [aws_sns_topic.eu_alerts.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.eu_asg.name
  }
  
  tags = merge(local.eu_tags, {
    Name = "${var.app_name}-eu-asg-cpu-alarm-${local.suffix}"
  })
}

# ========================================
# AUTO SCALING POLICIES
# ========================================

# US ASG Scale Up Policy
resource "aws_autoscaling_policy" "us_scale_up" {
  provider               = aws.us_east_1
  name                   = "${var.app_name}-scale-up-us-${local.suffix}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.us_asg.name
}

# US ASG Scale Down Policy
resource "aws_autoscaling_policy" "us_scale_down" {
  provider               = aws.us_east_1
  name                   = "${var.app_name}-scale-down-us-${local.suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.us_asg.name
}

# EU ASG Scale Up Policy
resource "aws_autoscaling_policy" "eu_scale_up" {
  provider               = aws.eu_central_1
  name                   = "${var.app_name}-scale-up-eu-${local.suffix}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.eu_asg.name
}

# EU ASG Scale Down Policy
resource "aws_autoscaling_policy" "eu_scale_down" {
  provider               = aws.eu_central_1
  name                   = "${var.app_name}-scale-down-eu-${local.suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.eu_asg.name
}

# ========================================
# OUTPUTS
# ========================================

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

# Security Group Outputs
output "us_alb_security_group_id" {
  description = "US ALB Security Group ID"
  value       = aws_security_group.us_alb.id
}

output "us_app_security_group_id" {
  description = "US Application Security Group ID"
  value       = aws_security_group.us_app.id
}

output "us_rds_security_group_id" {
  description = "US RDS Security Group ID"
  value       = aws_security_group.us_rds.id
}

output "eu_alb_security_group_id" {
  description = "EU ALB Security Group ID"
  value       = aws_security_group.eu_alb.id
}

output "eu_app_security_group_id" {
  description = "EU Application Security Group ID"
  value       = aws_security_group.eu_app.id
}

output "eu_rds_security_group_id" {
  description = "EU RDS Security Group ID"
  value       = aws_security_group.eu_rds.id
}

# Load Balancer Outputs
output "us_alb_arn" {
  description = "US Application Load Balancer ARN"
  value       = aws_lb.us_alb.arn
}

output "us_alb_dns_name" {
  description = "US Application Load Balancer DNS Name"
  value       = aws_lb.us_alb.dns_name
}

output "eu_alb_arn" {
  description = "EU Application Load Balancer ARN"
  value       = aws_lb.eu_alb.arn
}

output "eu_alb_dns_name" {
  description = "EU Application Load Balancer DNS Name"
  value       = aws_lb.eu_alb.dns_name
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

# Auto Scaling Group Outputs
output "us_asg_id" {
  description = "US Auto Scaling Group ID"
  value       = aws_autoscaling_group.us_asg.id
}

output "us_asg_name" {
  description = "US Auto Scaling Group Name"
  value       = aws_autoscaling_group.us_asg.name
}

output "eu_asg_id" {
  description = "EU Auto Scaling Group ID"
  value       = aws_autoscaling_group.eu_asg.id
}

output "eu_asg_name" {
  description = "EU Auto Scaling Group Name"
  value       = aws_autoscaling_group.eu_asg.name
}

# Launch Template Outputs
output "us_launch_template_id" {
  description = "US Launch Template ID"
  value       = aws_launch_template.us_lt.id
}

output "eu_launch_template_id" {
  description = "EU Launch Template ID"
  value       = aws_launch_template.eu_lt.id
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

output "eu_rds_replica_endpoint" {
  description = "EU RDS read replica endpoint"
  value       = aws_db_instance.eu_replica.endpoint
}

output "eu_rds_replica_arn" {
  description = "EU RDS read replica ARN"
  value       = aws_db_instance.eu_replica.arn
}

# S3 Bucket Outputs
output "us_s3_bucket_id" {
  description = "US S3 bucket name"
  value       = aws_s3_bucket.us_bucket.id
}

output "us_s3_bucket_arn" {
  description = "US S3 bucket ARN"
  value       = aws_s3_bucket.us_bucket.arn
}


# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID"
  value       = aws_cloudfront_distribution.cdn.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront Distribution ARN"
  value       = aws_cloudfront_distribution.cdn.arn
}

output "cloudfront_distribution_domain" {
  description = "CloudFront Distribution Domain Name"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

# Route53 Outputs
output "route53_zone_id" {
  description = "Route53 Hosted Zone ID"
  value       = data.aws_route53_zone.main.zone_id
}


# SNS Topic Outputs
output "us_sns_topic_arn" {
  description = "US SNS Topic ARN for alerts"
  value       = aws_sns_topic.us_alerts.arn
}

output "eu_sns_topic_arn" {
  description = "EU SNS Topic ARN for alerts"
  value       = aws_sns_topic.eu_alerts.arn
}

# CloudWatch Alarm Outputs
output "us_alb_alarm_arn" {
  description = "US ALB Health Alarm ARN"
  value       = aws_cloudwatch_metric_alarm.us_alb_healthy_hosts.arn
}


output "eu_replica_lag_alarm_arn" {
  description = "EU RDS Replica Lag Alarm ARN"
  value       = aws_cloudwatch_metric_alarm.eu_replica_lag.arn
}

# Migration-specific Outputs
output "migration_status" {
  description = "Current migration phase"
  value       = var.migration_phase
}

```

Migration Process

Initial Deployment (Phase 1):**
Deploy with 100% traffic to US region
EU infrastructure is created but receives no traffic
Monitor replication lag and health checks

Testing Phase (Phase 2):**
Gradually adjust Route53 weights (e.g., 90/10, then 70/30)
Monitor application performance and replication lag
Test failover scenarios

Migration Phase (Phase 3):**
Continue shifting traffic (50/50, then 30/70)
Promote EU read replica to primary if needed
Update application configurations

Completion Phase (Phase 4):**
Shift 100% traffic to EU region
Maintain US infrastructure for rollback capability
After validation period, decommission US resources


