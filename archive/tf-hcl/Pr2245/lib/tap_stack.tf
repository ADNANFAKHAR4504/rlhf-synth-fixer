# Simplified multi-region Terraform configuration

# Variables
variable "regions" {
  description = "List of AWS regions for deployment"
  type        = list(string)
  default     = ["us-east-1", "us-west-2"]
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "application_name" {
  description = "Name of the application"
  type        = string
  default     = "webapp"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
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
  default     = 2
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  default     = "SecurePassword123!"
  sensitive   = true
}

# Provider configurations
provider "aws" {
  alias  = "primary"
  region = var.regions[0]
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"
}

# Data sources for us-east-1
data "aws_availability_zones" "available_us_east_1" {
  provider = aws.us_east_1
  state    = "available"
}

data "aws_ami" "amazon_linux_us_east_1" {
  provider    = aws.us_east_1
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Data sources for us-west-2
data "aws_availability_zones" "available_us_west_2" {
  provider = aws.us_west_2
  state    = "available"
}

data "aws_ami" "amazon_linux_us_west_2" {
  provider    = aws.us_west_2
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# VPC for us-east-1
resource "aws_vpc" "main_us_east_1" {
  provider             = aws.us_east_1
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.application_name}-vpc-us-east-1"
    Environment = var.environment
    Region      = "us-east-1"
  }
}

# VPC for us-west-2
resource "aws_vpc" "main_us_west_2" {
  provider             = aws.us_west_2
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.application_name}-vpc-us-west-2"
    Environment = var.environment
    Region      = "us-west-2"
  }
}

# Internet Gateway for us-east-1
resource "aws_internet_gateway" "main_us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.main_us_east_1.id

  tags = {
    Name        = "${var.application_name}-igw-us-east-1"
    Environment = var.environment
  }
}

# Internet Gateway for us-west-2
resource "aws_internet_gateway" "main_us_west_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.main_us_west_2.id

  tags = {
    Name        = "${var.application_name}-igw-us-west-2"
    Environment = var.environment
  }
}

# Public Subnet for us-east-1 (AZ 1)
resource "aws_subnet" "public_us_east_1" {
  provider                = aws.us_east_1
  vpc_id                  = aws_vpc.main_us_east_1.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available_us_east_1.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.application_name}-public-us-east-1"
    Environment = var.environment
    Type        = "Public"
  }
}

# Public Subnet for us-east-1 (AZ 2)
resource "aws_subnet" "public_us_east_1_az2" {
  provider                = aws.us_east_1
  vpc_id                  = aws_vpc.main_us_east_1.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available_us_east_1.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.application_name}-public-us-east-1-az2"
    Environment = var.environment
    Type        = "Public"
  }
}

# Public Subnet for us-west-2 (AZ 1)
resource "aws_subnet" "public_us_west_2" {
  provider                = aws.us_west_2
  vpc_id                  = aws_vpc.main_us_west_2.id
  cidr_block              = "10.1.1.0/24"
  availability_zone       = data.aws_availability_zones.available_us_west_2.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.application_name}-public-us-west-2"
    Environment = var.environment
    Type        = "Public"
  }
}

# Public Subnet for us-west-2 (AZ 2)
resource "aws_subnet" "public_us_west_2_az2" {
  provider                = aws.us_west_2
  vpc_id                  = aws_vpc.main_us_west_2.id
  cidr_block              = "10.1.2.0/24"
  availability_zone       = data.aws_availability_zones.available_us_west_2.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.application_name}-public-us-west-2-az2"
    Environment = var.environment
    Type        = "Public"
  }
}

# Route Table for us-east-1
resource "aws_route_table" "public_us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.main_us_east_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_us_east_1.id
  }

  tags = {
    Name        = "${var.application_name}-public-rt-us-east-1"
    Environment = var.environment
  }
}

# Route Table for us-west-2
resource "aws_route_table" "public_us_west_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.main_us_west_2.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_us_west_2.id
  }

  tags = {
    Name        = "${var.application_name}-public-rt-us-west-2"
    Environment = var.environment
  }
}

# Route Table Association for us-east-1 (AZ 1)
resource "aws_route_table_association" "public_us_east_1" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.public_us_east_1.id
  route_table_id = aws_route_table.public_us_east_1.id
}

# Route Table Association for us-east-1 (AZ 2)
resource "aws_route_table_association" "public_us_east_1_az2" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.public_us_east_1_az2.id
  route_table_id = aws_route_table.public_us_east_1.id
}

# Route Table Association for us-west-2 (AZ 1)
resource "aws_route_table_association" "public_us_west_2" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.public_us_west_2.id
  route_table_id = aws_route_table.public_us_west_2.id
}

# Route Table Association for us-west-2 (AZ 2)
resource "aws_route_table_association" "public_us_west_2_az2" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.public_us_west_2_az2.id
  route_table_id = aws_route_table.public_us_west_2.id
}

# Security Group for ALB us-east-1
resource "aws_security_group" "alb_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.application_name}-alb-sg-us-east-1"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main_us_east_1.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.application_name}-alb-sg-us-east-1"
    Environment = var.environment
  }
}

# Security Group for ALB us-west-2
resource "aws_security_group" "alb_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.application_name}-alb-sg-us-west-2"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main_us_west_2.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.application_name}-alb-sg-us-west-2"
    Environment = var.environment
  }
}

# Application Load Balancer for us-east-1
resource "aws_lb" "main_us_east_1" {
  provider           = aws.us_east_1
  name               = "${var.application_name}-alb-us-east-1"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_us_east_1.id]
  subnets            = [aws_subnet.public_us_east_1.id, aws_subnet.public_us_east_1_az2.id]

  enable_deletion_protection = false

  tags = {
    Name        = "${var.application_name}-alb-us-east-1"
    Environment = var.environment
    Region      = "us-east-1"
  }
}

# Application Load Balancer for us-west-2
resource "aws_lb" "main_us_west_2" {
  provider           = aws.us_west_2
  name               = "${var.application_name}-alb-us-west-2"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_us_west_2.id]
  subnets            = [aws_subnet.public_us_west_2.id, aws_subnet.public_us_west_2_az2.id]

  enable_deletion_protection = false

  tags = {
    Name        = "${var.application_name}-alb-us-west-2"
    Environment = var.environment
    Region      = "us-west-2"
  }
}

# ALB Target Group for us-east-1
resource "aws_lb_target_group" "main_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.application_name}-tg-us-east-1"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main_us_east_1.id
  target_type = "ip"

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

  tags = {
    Name        = "${var.application_name}-tg-us-east-1"
    Environment = var.environment
  }
}

# ALB Target Group for us-west-2
resource "aws_lb_target_group" "main_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.application_name}-tg-us-west-2"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main_us_west_2.id
  target_type = "ip"

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

  tags = {
    Name        = "${var.application_name}-tg-us-west-2"
    Environment = var.environment
  }
}

# ALB Listener for us-east-1
resource "aws_lb_listener" "main_us_east_1" {
  provider          = aws.us_east_1
  load_balancer_arn = aws_lb.main_us_east_1.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main_us_east_1.arn
  }
}

# ALB Listener for us-west-2
resource "aws_lb_listener" "main_us_west_2" {
  provider          = aws.us_west_2
  load_balancer_arn = aws_lb.main_us_west_2.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main_us_west_2.arn
  }
}

# Outputs
output "vpc_ids" {
  description = "VPC IDs for each region"
  value = {
    "us-east-1" = aws_vpc.main_us_east_1.id
    "us-west-2" = aws_vpc.main_us_west_2.id
  }
}

output "subnet_ids" {
  description = "Subnet IDs for each region"
  value = {
    "us-east-1" = [aws_subnet.public_us_east_1.id, aws_subnet.public_us_east_1_az2.id]
    "us-west-2" = [aws_subnet.public_us_west_2.id, aws_subnet.public_us_west_2_az2.id]
  }
}

output "alb_dns_names" {
  description = "ALB DNS names for each region"
  value = {
    "us-east-1" = aws_lb.main_us_east_1.dns_name
    "us-west-2" = aws_lb.main_us_west_2.dns_name
  }
}

output "alb_arns" {
  description = "ALB ARNs for each region"
  value = {
    "us-east-1" = aws_lb.main_us_east_1.arn
    "us-west-2" = aws_lb.main_us_west_2.arn
  }
}

output "target_group_arns" {
  description = "Target Group ARNs for each region"
  value = {
    "us-east-1" = aws_lb_target_group.main_us_east_1.arn
    "us-west-2" = aws_lb_target_group.main_us_west_2.arn
  }
}
