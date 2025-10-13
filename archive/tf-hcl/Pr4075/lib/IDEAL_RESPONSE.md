# tap_stack.tf - Complete Multi-Region Infrastructure Stack

```hcl

################################################################################
# Variables
################################################################################

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-2"
}

variable "third_region" {
  description = "Third AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 3
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 2
}

################################################################################
# Locals
################################################################################

locals {
  # Generate random suffix for resource naming
  random_suffix = lower(substr(replace(uuid(), "-", ""), 0, 4))
  
  # Common tags for all resources
  common_tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
  
  # Resource naming conventions
  vpc_name_primary   = "vpc-primary-${local.random_suffix}"
  vpc_name_secondary = "vpc-secondary-${local.random_suffix}"
  vpc_name_third     = "vpc-third-${local.random_suffix}"
  
  # CIDR blocks for VPCs
  vpc_cidr_primary   = "10.0.0.0/16"
  vpc_cidr_secondary = "10.1.0.0/16"
  vpc_cidr_third     = "10.2.0.0/16"
  
  # Availability zones mapping
  azs_primary   = ["us-east-1a", "us-east-1b"]
  azs_secondary = ["us-west-2a", "us-west-2b"]
  azs_third     = ["eu-central-1a", "eu-central-1b"]
}

################################################################################
# Random Resources for Unique Naming
################################################################################

resource "random_string" "suffix" {
  length  = 4
  special = false
  upper   = false
  numeric = false
}

# RDS Master Username (starts with alphabet, 8 chars)
resource "random_string" "rds_username_primary" {
  length  = 7
  special = false
  numeric = true
  upper   = false
}

resource "random_string" "rds_username_secondary" {
  length  = 7
  special = false
  numeric = true
  upper   = false
}

resource "random_string" "rds_username_third" {
  length  = 7
  special = false
  numeric = true
  upper   = false
}

# RDS Master Password (16 chars with allowed special characters)
resource "random_password" "rds_password_primary" {
  length           = 16
  special          = true
  override_special = "!#$%^&*()-_=+[]{}:?"
}

resource "random_password" "rds_password_secondary" {
  length           = 16
  special          = true
  override_special = "!#$%^&*()-_=+[]{}:?"
}

resource "random_password" "rds_password_third" {
  length           = 16
  special          = true
  override_special = "!#$%^&*()-_=+[]{}:?"
}

################################################################################
# Data Sources
################################################################################

# Get latest Amazon Linux 2 AMI for each region
data "aws_ami" "amazon_linux2_primary" {
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

data "aws_ami" "amazon_linux2_secondary" {
  provider    = aws.us_west_2
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

data "aws_ami" "amazon_linux2_third" {
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

################################################################################
# PRIMARY REGION (us-east-1) RESOURCES
################################################################################

# VPC for Primary Region
resource "aws_vpc" "primary" {
  provider             = aws.us_east_1
  cidr_block           = local.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = local.vpc_name_primary
    }
  )
}

# Internet Gateway for Primary VPC
resource "aws_internet_gateway" "primary" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary.id

  tags = merge(
    local.common_tags,
    {
      Name = "igw-primary-${random_string.suffix.result}"
    }
  )
}

# Public Subnets for Primary Region
resource "aws_subnet" "primary_public" {
  provider                = aws.us_east_1
  count                   = 2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(local.vpc_cidr_primary, 8, count.index)
  availability_zone       = local.azs_primary[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "subnet-public-primary-${count.index + 1}-${random_string.suffix.result}"
      Type = "Public"
    }
  )
}

# Private Subnets for Primary Region
resource "aws_subnet" "primary_private" {
  provider          = aws.us_east_1
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(local.vpc_cidr_primary, 8, count.index + 10)
  availability_zone = local.azs_primary[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "subnet-private-primary-${count.index + 1}-${random_string.suffix.result}"
      Type = "Private"
    }
  )
}

# Elastic IPs for NAT Gateways in Primary Region
resource "aws_eip" "primary_nat" {
  provider = aws.us_east_1
  count    = 2
  domain   = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "eip-nat-primary-${count.index + 1}-${random_string.suffix.result}"
    }
  )
}

# NAT Gateways for Primary Region
resource "aws_nat_gateway" "primary" {
  provider      = aws.us_east_1
  count         = 2
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "nat-primary-${count.index + 1}-${random_string.suffix.result}"
    }
  )
}

# Route Table for Public Subnets in Primary Region
resource "aws_route_table" "primary_public" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rt-public-primary-${random_string.suffix.result}"
    }
  )
}

# Route Tables for Private Subnets in Primary Region
resource "aws_route_table" "primary_private" {
  provider = aws.us_east_1
  count    = 2
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rt-private-primary-${count.index + 1}-${random_string.suffix.result}"
    }
  )
}

# Route Table Associations for Public Subnets in Primary Region
resource "aws_route_table_association" "primary_public" {
  provider       = aws.us_east_1
  count          = 2
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Route Table Associations for Private Subnets in Primary Region
resource "aws_route_table_association" "primary_private" {
  provider       = aws.us_east_1
  count          = 2
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# Security Group for ALB in Primary Region
resource "aws_security_group" "primary_alb" {
  provider    = aws.us_east_1
  name_prefix = "alb-primary-"
  description = "Security group for ALB in primary region"
  vpc_id      = aws_vpc.primary.id

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
    local.common_tags,
    {
      Name = "alb-primary-${random_string.suffix.result}"
    }
  )
}

# Security Group for EC2 Instances in Primary Region
resource "aws_security_group" "primary_ec2" {
  provider    = aws.us_east_1
  name_prefix = "ec2-primary-"
  description = "Security group for EC2 instances in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "ec2-primary-${random_string.suffix.result}"
    }
  )
}

# Security Group for RDS in Primary Region
resource "aws_security_group" "primary_rds" {
  provider    = aws.us_east_1
  name_prefix = "rds-primary-"
  description = "Security group for RDS in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-${random_string.suffix.result}"
    }
  )
}

# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2_role_primary" {
  provider = aws.us_east_1
  name     = "ec2-role-primary-${random_string.suffix.result}"

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

# IAM Role Policy Attachment for EC2
resource "aws_iam_role_policy_attachment" "ec2_ssm_primary" {
  provider   = aws.us_east_1
  role       = aws_iam_role.ec2_role_primary.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch_primary" {
  provider   = aws.us_east_1
  role       = aws_iam_role.ec2_role_primary.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# IAM Instance Profile for EC2 in Primary Region
resource "aws_iam_instance_profile" "ec2_profile_primary" {
  provider = aws.us_east_1
  name     = "ec2-profile-primary-${random_string.suffix.result}"
  role     = aws_iam_role.ec2_role_primary.name
}

# Launch Template for Primary Region
resource "aws_launch_template" "primary" {
  provider      = aws.us_east_1
  name_prefix   = "lt-primary-"
  image_id      = data.aws_ami.amazon_linux2_primary.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile_primary.name
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.primary_ec2.id]
    delete_on_termination       = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from Primary Region - ${var.primary_region}</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(
      local.common_tags,
      {
        Name = "ec2-primary-${random_string.suffix.result}"
      }
    )
  }

  tags = local.common_tags
}

# Application Load Balancer for Primary Region
resource "aws_lb" "primary" {
  provider           = aws.us_east_1
  name               = "alb-primary-${random_string.suffix.result}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = local.common_tags
}

# Target Group for Primary Region
resource "aws_lb_target_group" "primary" {
  provider    = aws.us_east_1
  name        = "tg-primary-${random_string.suffix.result}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.primary.id
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

  tags = local.common_tags
}

# ALB Listener for Primary Region
resource "aws_lb_listener" "primary" {
  provider          = aws.us_east_1
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }
}

# Auto Scaling Group for Primary Region
resource "aws_autoscaling_group" "primary" {
  provider            = aws.us_east_1
  name                = "asg-primary-${random_string.suffix.result}"
  vpc_zone_identifier = aws_subnet.primary_private[*].id
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  min_size            = var.min_size
  max_size            = var.max_size
  desired_capacity    = var.desired_capacity

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "asg-instance-primary-${random_string.suffix.result}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# RDS Subnet Group for Primary Region
resource "aws_db_subnet_group" "primary" {
  provider   = aws.us_east_1
  name       = "db-subnet-group-primary-${random_string.suffix.result}"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "db-subnet-group-primary-${random_string.suffix.result}"
    }
  )
}

# RDS Instance for Primary Region
resource "aws_db_instance" "primary" {
  provider                = aws.us_east_1
  identifier              = "rds-primary-${random_string.suffix.result}"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = var.rds_instance_class
  allocated_storage       = 20
  storage_type            = "gp3"
  storage_encrypted       = true
  
  db_name  = "appdb"
  username = "a${random_string.rds_username_primary.result}"
  password = random_password.rds_password_primary.result
  
  vpc_security_group_ids = [aws_security_group.primary_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  
  multi_az                    = true
  publicly_accessible         = false
  auto_minor_version_upgrade  = true
  backup_retention_period     = 7
  backup_window              = "03:00-04:00"
  maintenance_window         = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true

  tags = local.common_tags
}

# Secrets Manager Secret for RDS Credentials - Primary Region
resource "aws_secretsmanager_secret" "rds_primary" {
  provider                = aws.us_east_1
  name                    = "rds-credentials-primary-${random_string.suffix.result}"
  recovery_window_in_days = 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "rds_primary" {
  provider  = aws.us_east_1
  secret_id = aws_secretsmanager_secret.rds_primary.id
  secret_string = jsonencode({
    username = "a${random_string.rds_username_primary.result}"
    password = random_password.rds_password_primary.result
    endpoint = aws_db_instance.primary.endpoint
  })
}

# S3 Bucket for Logs - Primary Region
resource "aws_s3_bucket" "logs_primary" {
  provider = aws.us_east_1
  bucket   = "logs-primary-${random_string.suffix.result}"

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "logs_primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.logs_primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.logs_primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs_primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.logs_primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch Log Group for Primary Region
resource "aws_cloudwatch_log_group" "primary" {
  provider          = aws.us_east_1
  name              = "/aws/application/primary-${random_string.suffix.result}"
  retention_in_days = 7

  tags = local.common_tags
}

################################################################################
# SECONDARY REGION (us-west-2) RESOURCES
################################################################################

# VPC for Secondary Region
resource "aws_vpc" "secondary" {
  provider             = aws.us_west_2
  cidr_block           = local.vpc_cidr_secondary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = local.vpc_name_secondary
    }
  )
}

# Internet Gateway for Secondary VPC
resource "aws_internet_gateway" "secondary" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary.id

  tags = merge(
    local.common_tags,
    {
      Name = "igw-secondary-${random_string.suffix.result}"
    }
  )
}

# Public Subnets for Secondary Region
resource "aws_subnet" "secondary_public" {
  provider                = aws.us_west_2
  count                   = 2
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = cidrsubnet(local.vpc_cidr_secondary, 8, count.index)
  availability_zone       = local.azs_secondary[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "subnet-public-secondary-${count.index + 1}-${random_string.suffix.result}"
      Type = "Public"
    }
  )
}

# Private Subnets for Secondary Region
resource "aws_subnet" "secondary_private" {
  provider          = aws.us_west_2
  count             = 2
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(local.vpc_cidr_secondary, 8, count.index + 10)
  availability_zone = local.azs_secondary[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "subnet-private-secondary-${count.index + 1}-${random_string.suffix.result}"
      Type = "Private"
    }
  )
}

# Elastic IPs for NAT Gateways in Secondary Region
resource "aws_eip" "secondary_nat" {
  provider = aws.us_west_2
  count    = 2
  domain   = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "eip-nat-secondary-${count.index + 1}-${random_string.suffix.result}"
    }
  )
}

# NAT Gateways for Secondary Region
resource "aws_nat_gateway" "secondary" {
  provider      = aws.us_west_2
  count         = 2
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "nat-secondary-${count.index + 1}-${random_string.suffix.result}"
    }
  )
}

# Route Table for Public Subnets in Secondary Region
resource "aws_route_table" "secondary_public" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rt-public-secondary-${random_string.suffix.result}"
    }
  )
}

# Route Tables for Private Subnets in Secondary Region
resource "aws_route_table" "secondary_private" {
  provider = aws.us_west_2
  count    = 2
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rt-private-secondary-${count.index + 1}-${random_string.suffix.result}"
    }
  )
}

# Route Table Associations for Public Subnets in Secondary Region
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.us_west_2
  count          = 2
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# Route Table Associations for Private Subnets in Secondary Region
resource "aws_route_table_association" "secondary_private" {
  provider       = aws.us_west_2
  count          = 2
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# Security Group for ALB in Secondary Region
resource "aws_security_group" "secondary_alb" {
  provider    = aws.us_west_2
  name_prefix = "alb-secondary-"
  description = "Security group for ALB in secondary region"
  vpc_id      = aws_vpc.secondary.id

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
    local.common_tags,
    {
      Name = "alb-secondary-${random_string.suffix.result}"
    }
  )
}

# Security Group for EC2 Instances in Secondary Region
resource "aws_security_group" "secondary_ec2" {
  provider    = aws.us_west_2
  name_prefix = "ec2-secondary-"
  description = "Security group for EC2 instances in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "ec2-secondary-${random_string.suffix.result}"
    }
  )
}

# Security Group for RDS in Secondary Region
resource "aws_security_group" "secondary_rds" {
  provider    = aws.us_west_2
  name_prefix = "rds-secondary-"
  description = "Security group for RDS in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-secondary-${random_string.suffix.result}"
    }
  )
}

# IAM Role for EC2 Instances in Secondary Region
resource "aws_iam_role" "ec2_role_secondary" {
  provider = aws.us_west_2
  name     = "ec2-role-secondary-${random_string.suffix.result}"

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

# IAM Role Policy Attachments for Secondary Region
resource "aws_iam_role_policy_attachment" "ec2_ssm_secondary" {
  provider   = aws.us_west_2
  role       = aws_iam_role.ec2_role_secondary.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch_secondary" {
  provider   = aws.us_west_2
  role       = aws_iam_role.ec2_role_secondary.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# IAM Instance Profile for EC2 in Secondary Region
resource "aws_iam_instance_profile" "ec2_profile_secondary" {
  provider = aws.us_west_2
  name     = "ec2-profile-secondary-${random_string.suffix.result}"
  role     = aws_iam_role.ec2_role_secondary.name
}

# Launch Template for Secondary Region
resource "aws_launch_template" "secondary" {
  provider      = aws.us_west_2
  name_prefix   = "lt-secondary-"
  image_id      = data.aws_ami.amazon_linux2_secondary.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile_secondary.name
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.secondary_ec2.id]
    delete_on_termination       = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from Secondary Region - ${var.secondary_region}</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(
      local.common_tags,
      {
        Name = "ec2-secondary-${random_string.suffix.result}"
      }
    )
  }

  tags = local.common_tags
}

# Application Load Balancer for Secondary Region
resource "aws_lb" "secondary" {
  provider           = aws.us_west_2
  name               = "alb-secondary-${random_string.suffix.result}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = aws_subnet.secondary_public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = local.common_tags
}

# Target Group for Secondary Region
resource "aws_lb_target_group" "secondary" {
  provider    = aws.us_west_2
  name        = "tg-secondary-${random_string.suffix.result}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.secondary.id
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

  tags = local.common_tags
}

# ALB Listener for Secondary Region
resource "aws_lb_listener" "secondary" {
  provider          = aws.us_west_2
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }
}

# Auto Scaling Group for Secondary Region
resource "aws_autoscaling_group" "secondary" {
  provider            = aws.us_west_2
  name                = "asg-secondary-${random_string.suffix.result}"
  vpc_zone_identifier = aws_subnet.secondary_private[*].id
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  min_size            = var.min_size
  max_size            = var.max_size
  desired_capacity    = var.desired_capacity

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "asg-instance-secondary-${random_string.suffix.result}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# RDS Subnet Group for Secondary Region
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.us_west_2
  name       = "db-subnet-group-secondary-${random_string.suffix.result}"
  subnet_ids = aws_subnet.secondary_private[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "db-subnet-group-secondary-${random_string.suffix.result}"
    }
  )
}

# RDS Instance for Secondary Region
resource "aws_db_instance" "secondary" {
  provider                = aws.us_west_2
  identifier              = "rds-secondary-${random_string.suffix.result}"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = var.rds_instance_class
  allocated_storage       = 20
  storage_type            = "gp3"
  storage_encrypted       = true
  
  db_name  = "appdb"
  username = "a${random_string.rds_username_secondary.result}"
  password = random_password.rds_password_secondary.result
  
  vpc_security_group_ids = [aws_security_group.secondary_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary.name
  
  multi_az                    = true
  publicly_accessible         = false
  auto_minor_version_upgrade  = true
  backup_retention_period     = 7
  backup_window              = "03:00-04:00"
  maintenance_window         = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true

  tags = local.common_tags
}

# Secrets Manager Secret for RDS Credentials - Secondary Region
resource "aws_secretsmanager_secret" "rds_secondary" {
  provider                = aws.us_west_2
  name                    = "rds-credentials-secondary-${random_string.suffix.result}"
  recovery_window_in_days = 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "rds_secondary" {
  provider  = aws.us_west_2
  secret_id = aws_secretsmanager_secret.rds_secondary.id
  secret_string = jsonencode({
    username = "a${random_string.rds_username_secondary.result}"
    password = random_password.rds_password_secondary.result
    endpoint = aws_db_instance.secondary.endpoint
  })
}

# S3 Bucket for Logs - Secondary Region
resource "aws_s3_bucket" "logs_secondary" {
  provider = aws.us_west_2
  bucket   = "logs-secondary-${random_string.suffix.result}"

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "logs_secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.logs_secondary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.logs_secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs_secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.logs_secondary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch Log Group for Secondary Region
resource "aws_cloudwatch_log_group" "secondary" {
  provider          = aws.us_west_2
  name              = "/aws/application/secondary-${random_string.suffix.result}"
  retention_in_days = 7

  tags = local.common_tags
}

################################################################################
# THIRD REGION (eu-central-1) RESOURCES
################################################################################

# VPC for Third Region
resource "aws_vpc" "third" {
  provider             = aws.eu_central_1
  cidr_block           = local.vpc_cidr_third
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = local.vpc_name_third
    }
  )
}

# Internet Gateway for Third VPC
resource "aws_internet_gateway" "third" {
  provider = aws.eu_central_1
  vpc_id   = aws_vpc.third.id

  tags = merge(
    local.common_tags,
    {
      Name = "igw-third-${random_string.suffix.result}"
    }
  )
}

# Public Subnets for Third Region
resource "aws_subnet" "third_public" {
  provider                = aws.eu_central_1
  count                   = 2
  vpc_id                  = aws_vpc.third.id
  cidr_block              = cidrsubnet(local.vpc_cidr_third, 8, count.index)
  availability_zone       = local.azs_third[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "subnet-public-third-${count.index + 1}-${random_string.suffix.result}"
      Type = "Public"
    }
  )
}

# Private Subnets for Third Region
resource "aws_subnet" "third_private" {
  provider          = aws.eu_central_1
  count             = 2
  vpc_id            = aws_vpc.third.id
  cidr_block        = cidrsubnet(local.vpc_cidr_third, 8, count.index + 10)
  availability_zone = local.azs_third[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "subnet-private-third-${count.index + 1}-${random_string.suffix.result}"
      Type = "Private"
    }
  )
}

# Elastic IPs for NAT Gateways in Third Region
resource "aws_eip" "third_nat" {
  provider = aws.eu_central_1
  count    = 2
  domain   = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "eip-nat-third-${count.index + 1}-${random_string.suffix.result}"
    }
  )
}

# NAT Gateways for Third Region
resource "aws_nat_gateway" "third" {
  provider      = aws.eu_central_1
  count         = 2
  allocation_id = aws_eip.third_nat[count.index].id
  subnet_id     = aws_subnet.third_public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "nat-third-${count.index + 1}-${random_string.suffix.result}"
    }
  )
}

# Route Table for Public Subnets in Third Region
resource "aws_route_table" "third_public" {
  provider = aws.eu_central_1
  vpc_id   = aws_vpc.third.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.third.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rt-public-third-${random_string.suffix.result}"
    }
  )
}

# Route Tables for Private Subnets in Third Region
resource "aws_route_table" "third_private" {
  provider = aws.eu_central_1
  count    = 2
  vpc_id   = aws_vpc.third.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.third[count.index].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rt-private-third-${count.index + 1}-${random_string.suffix.result}"
    }
  )
}

# Route Table Associations for Public Subnets in Third Region
resource "aws_route_table_association" "third_public" {
  provider       = aws.eu_central_1
  count          = 2
  subnet_id      = aws_subnet.third_public[count.index].id
  route_table_id = aws_route_table.third_public.id
}

# Route Table Associations for Private Subnets in Third Region
resource "aws_route_table_association" "third_private" {
  provider       = aws.eu_central_1
  count          = 2
  subnet_id      = aws_subnet.third_private[count.index].id
  route_table_id = aws_route_table.third_private[count.index].id
}

# Security Group for ALB in Third Region
resource "aws_security_group" "third_alb" {
  provider    = aws.eu_central_1
  name_prefix = "alb-third-"
  description = "Security group for ALB in third region"
  vpc_id      = aws_vpc.third.id

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
    local.common_tags,
    {
      Name = "alb-third-${random_string.suffix.result}"
    }
  )
}

# Security Group for EC2 Instances in Third Region
resource "aws_security_group" "third_ec2" {
  provider    = aws.eu_central_1
  name_prefix = "ec2-third-"
  description = "Security group for EC2 instances in third region"
  vpc_id      = aws_vpc.third.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.third_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "ec2-third-${random_string.suffix.result}"
    }
  )
}

# Security Group for RDS in Third Region
resource "aws_security_group" "third_rds" {
  provider    = aws.eu_central_1
  name_prefix = "rds-third-"
  description = "Security group for RDS in third region"
  vpc_id      = aws_vpc.third.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.third_ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-third-${random_string.suffix.result}"
    }
  )
}

# IAM Role for EC2 Instances in Third Region
resource "aws_iam_role" "ec2_role_third" {
  provider = aws.eu_central_1
  name     = "ec2-role-third-${random_string.suffix.result}"

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

# IAM Role Policy Attachments for Third Region
resource "aws_iam_role_policy_attachment" "ec2_ssm_third" {
  provider   = aws.eu_central_1
  role       = aws_iam_role.ec2_role_third.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch_third" {
  provider   = aws.eu_central_1
  role       = aws_iam_role.ec2_role_third.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# IAM Instance Profile for EC2 in Third Region
resource "aws_iam_instance_profile" "ec2_profile_third" {
  provider = aws.eu_central_1
  name     = "ec2-profile-third-${random_string.suffix.result}"
  role     = aws_iam_role.ec2_role_third.name
}

# Launch Template for Third Region
resource "aws_launch_template" "third" {
  provider      = aws.eu_central_1
  name_prefix   = "lt-third-"
  image_id      = data.aws_ami.amazon_linux2_third.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile_third.name
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.third_ec2.id]
    delete_on_termination       = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from Third Region - ${var.third_region}</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(
      local.common_tags,
      {
        Name = "ec2-third-${random_string.suffix.result}"
      }
    )
  }

  tags = local.common_tags
}

# Application Load Balancer for Third Region
resource "aws_lb" "third" {
  provider           = aws.eu_central_1
  name               = "alb-third-${random_string.suffix.result}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.third_alb.id]
  subnets            = aws_subnet.third_public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = local.common_tags
}

# Target Group for Third Region
resource "aws_lb_target_group" "third" {
  provider    = aws.eu_central_1
  name        = "tg-third-${random_string.suffix.result}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.third.id
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

  tags = local.common_tags
}

# ALB Listener for Third Region
resource "aws_lb_listener" "third" {
  provider          = aws.eu_central_1
  load_balancer_arn = aws_lb.third.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.third.arn
  }
}

# Auto Scaling Group for Third Region
resource "aws_autoscaling_group" "third" {
  provider            = aws.eu_central_1
  name                = "asg-third-${random_string.suffix.result}"
  vpc_zone_identifier = aws_subnet.third_private[*].id
  target_group_arns   = [aws_lb_target_group.third.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  min_size            = var.min_size
  max_size            = var.max_size
  desired_capacity    = var.desired_capacity

  launch_template {
    id      = aws_launch_template.third.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "asg-instance-third-${random_string.suffix.result}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# RDS Subnet Group for Third Region
resource "aws_db_subnet_group" "third" {
  provider   = aws.eu_central_1
  name       = "db-subnet-group-third-${random_string.suffix.result}"
  subnet_ids = aws_subnet.third_private[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "db-subnet-group-third-${random_string.suffix.result}"
    }
  )
}

# RDS Instance for Third Region
resource "aws_db_instance" "third" {
  provider                = aws.eu_central_1
  identifier              = "rds-third-${random_string.suffix.result}"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = var.rds_instance_class
  allocated_storage       = 20
  storage_type            = "gp3"
  storage_encrypted       = true
  
  db_name  = "appdb"
  username = "a${random_string.rds_username_third.result}"
  password = random_password.rds_password_third.result
  
  vpc_security_group_ids = [aws_security_group.third_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.third.name
  
  multi_az                    = true
  publicly_accessible         = false
  auto_minor_version_upgrade  = true
  backup_retention_period     = 7
  backup_window              = "03:00-04:00"
  maintenance_window         = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true

  tags = local.common_tags
}

# Secrets Manager Secret for RDS Credentials - Third Region
resource "aws_secretsmanager_secret" "rds_third" {
  provider                = aws.eu_central_1
  name                    = "rds-credentials-third-${random_string.suffix.result}"
  recovery_window_in_days = 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "rds_third" {
  provider  = aws.eu_central_1
  secret_id = aws_secretsmanager_secret.rds_third.id
  secret_string = jsonencode({
    username = "a${random_string.rds_username_third.result}"
    password = random_password.rds_password_third.result
    endpoint = aws_db_instance.third.endpoint
  })
}

# S3 Bucket for Logs - Third Region
resource "aws_s3_bucket" "logs_third" {
  provider = aws.eu_central_1
  bucket   = "logs-third-${random_string.suffix.result}"

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "logs_third" {
  provider = aws.eu_central_1
  bucket   = aws_s3_bucket.logs_third.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_third" {
  provider = aws.eu_central_1
  bucket   = aws_s3_bucket.logs_third.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs_third" {
  provider = aws.eu_central_1
  bucket   = aws_s3_bucket.logs_third.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch Log Group for Third Region
resource "aws_cloudwatch_log_group" "third" {
  provider          = aws.eu_central_1
  name              = "/aws/application/third-${random_string.suffix.result}"
  retention_in_days = 7

  tags = local.common_tags
}

################################################################################
# Outputs
################################################################################

# Primary Region Outputs
output "primary_vpc_id" {
  description = "VPC ID for primary region"
  value       = aws_vpc.primary.id
}

output "primary_public_subnet_ids" {
  description = "Public subnet IDs for primary region"
  value       = aws_subnet.primary_public[*].id
}

output "primary_private_subnet_ids" {
  description = "Private subnet IDs for primary region"
  value       = aws_subnet.primary_private[*].id
}

output "primary_alb_dns_name" {
  description = "ALB DNS name for primary region"
  value       = aws_lb.primary.dns_name
}

output "primary_alb_arn" {
  description = "ALB ARN for primary region"
  value       = aws_lb.primary.arn
}

output "primary_rds_endpoint" {
  description = "RDS endpoint for primary region"
  value       = aws_db_instance.primary.endpoint
}

output "primary_rds_id" {
  description = "RDS instance ID for primary region"
  value       = aws_db_instance.primary.id
}

output "primary_s3_bucket_name" {
  description = "S3 bucket name for primary region"
  value       = aws_s3_bucket.logs_primary.id
}

output "primary_s3_bucket_arn" {
  description = "S3 bucket ARN for primary region"
  value       = aws_s3_bucket.logs_primary.arn
}

output "primary_iam_role_arn" {
  description = "IAM role ARN for EC2 instances in primary region"
  value       = aws_iam_role.ec2_role_primary.arn
}

output "primary_asg_name" {
  description = "Auto Scaling Group name for primary region"
  value       = aws_autoscaling_group.primary.name
}

output "primary_launch_template_id" {
  description = "Launch Template ID for primary region"
  value       = aws_launch_template.primary.id
}

output "primary_secrets_manager_arn" {
  description = "Secrets Manager ARN for RDS credentials in primary region"
  value       = aws_secretsmanager_secret.rds_primary.arn
}

output "primary_cloudwatch_log_group" {
  description = "CloudWatch Log Group name for primary region"
  value       = aws_cloudwatch_log_group.primary.name
}

output "primary_internet_gateway_id" {
  description = "Internet Gateway ID for primary region"
  value       = aws_internet_gateway.primary.id
}

output "primary_route_table_public_id" {
  description = "Public route table ID for primary region"
  value       = aws_route_table.primary_public.id
}

output "primary_route_table_private_ids" {
  description = "Private route table IDs for primary region"
  value       = aws_route_table.primary_private[*].id
}

output "primary_security_group_alb_id" {
  description = "ALB security group ID for primary region"
  value       = aws_security_group.primary_alb.id
}

output "primary_security_group_ec2_id" {
  description = "EC2 security group ID for primary region"
  value       = aws_security_group.primary_ec2.id
}

output "primary_security_group_rds_id" {
  description = "RDS security group ID for primary region"
  value       = aws_security_group.primary_rds.id
}

output "primary_target_group_arn" {
  description = "Target group ARN for primary region"
  value       = aws_lb_target_group.primary.arn
}

output "primary_db_subnet_group_name" {
  description = "DB subnet group name for primary region"
  value       = aws_db_subnet_group.primary.name
}

output "primary_ami_id" {
  description = "Amazon Linux 2 AMI ID for primary region"
  value       = data.aws_ami.amazon_linux2_primary.id
}

output "primary_elastic_ip_ids" {
  description = "Elastic IP IDs for NAT gateways in primary region"
  value       = aws_eip.primary_nat[*].id
}

output "primary_instance_profile_name" {
  description = "IAM instance profile name for primary region"
  value       = aws_iam_instance_profile.ec2_profile_primary.name
}

# Secondary Region Outputs
output "secondary_vpc_id" {
  description = "VPC ID for secondary region"
  value       = aws_vpc.secondary.id
}

output "secondary_public_subnet_ids" {
  description = "Public subnet IDs for secondary region"
  value       = aws_subnet.secondary_public[*].id
}

output "secondary_private_subnet_ids" {
  description = "Private subnet IDs for secondary region"
  value       = aws_subnet.secondary_private[*].id
}

output "secondary_alb_dns_name" {
  description = "ALB DNS name for secondary region"
  value       = aws_lb.secondary.dns_name
}

output "secondary_alb_arn" {
  description = "ALB ARN for secondary region"
  value       = aws_lb.secondary.arn
}

output "secondary_rds_endpoint" {
  description = "RDS endpoint for secondary region"
  value       = aws_db_instance.secondary.endpoint
}

output "secondary_rds_id" {
  description = "RDS instance ID for secondary region"
  value       = aws_db_instance.secondary.id
}

output "secondary_s3_bucket_name" {
  description = "S3 bucket name for secondary region"
  value       = aws_s3_bucket.logs_secondary.id
}

output "secondary_s3_bucket_arn" {
  description = "S3 bucket ARN for secondary region"
  value       = aws_s3_bucket.logs_secondary.arn
}

output "secondary_iam_role_arn" {
  description = "IAM role ARN for EC2 instances in secondary region"
  value       = aws_iam_role.ec2_role_secondary.arn
}

output "secondary_asg_name" {
  description = "Auto Scaling Group name for secondary region"
  value       = aws_autoscaling_group.secondary.name
}

output "secondary_launch_template_id" {
  description = "Launch Template ID for secondary region"
  value       = aws_launch_template.secondary.id
}

output "secondary_secrets_manager_arn" {
  description = "Secrets Manager ARN for RDS credentials in secondary region"
  value       = aws_secretsmanager_secret.rds_secondary.arn
}

output "secondary_cloudwatch_log_group" {
  description = "CloudWatch Log Group name for secondary region"
  value       = aws_cloudwatch_log_group.secondary.name
}

output "secondary_nat_gateway_ids" {
  description = "NAT Gateway IDs for secondary region"
  value       = aws_nat_gateway.secondary[*].id
}

output "secondary_internet_gateway_id" {
  description = "Internet Gateway ID for secondary region"
  value       = aws_internet_gateway.secondary.id
}

output "secondary_route_table_public_id" {
  description = "Public route table ID for secondary region"
  value       = aws_route_table.secondary_public.id
}

output "secondary_route_table_private_ids" {
  description = "Private route table IDs for secondary region"
  value       = aws_route_table.secondary_private[*].id
}

output "secondary_security_group_alb_id" {
  description = "ALB security group ID for secondary region"
  value       = aws_security_group.secondary_alb.id
}

output "secondary_security_group_ec2_id" {
  description = "EC2 security group ID for secondary region"
  value       = aws_security_group.secondary_ec2.id
}

output "secondary_security_group_rds_id" {
  description = "RDS security group ID for secondary region"
  value       = aws_security_group.secondary_rds.id
}

output "secondary_target_group_arn" {
  description = "Target group ARN for secondary region"
  value       = aws_lb_target_group.secondary.arn
}

output "secondary_db_subnet_group_name" {
  description = "DB subnet group name for secondary region"
  value       = aws_db_subnet_group.secondary.name
}

output "secondary_ami_id" {
  description = "Amazon Linux 2 AMI ID for secondary region"
  value       = data.aws_ami.amazon_linux2_secondary.id
}

output "secondary_elastic_ip_ids" {
  description = "Elastic IP IDs for NAT gateways in secondary region"
  value       = aws_eip.secondary_nat[*].id
}

output "secondary_instance_profile_name" {
  description = "IAM instance profile name for secondary region"
  value       = aws_iam_instance_profile.ec2_profile_secondary.name
}

# Third Region Outputs
output "third_vpc_id" {
  description = "VPC ID for third region"
  value       = aws_vpc.third.id
}

output "third_public_subnet_ids" {
  description = "Public subnet IDs for third region"
  value       = aws_subnet.third_public[*].id
}

output "third_private_subnet_ids" {
  description = "Private subnet IDs for third region"
  value       = aws_subnet.third_private[*].id
}

output "third_alb_dns_name" {
  description = "ALB DNS name for third region"
  value       = aws_lb.third.dns_name
}

output "third_alb_arn" {
  description = "ALB ARN for third region"
  value       = aws_lb.third.arn
}

output "third_rds_endpoint" {
  description = "RDS endpoint for third region"
  value       = aws_db_instance.third.endpoint
}

output "third_rds_id" {
  description = "RDS instance ID for third region"
  value       = aws_db_instance.third.id
}

output "third_s3_bucket_name" {
  description = "S3 bucket name for third region"
  value       = aws_s3_bucket.logs_third.id
}

output "third_s3_bucket_arn" {
  description = "S3 bucket ARN for third region"
  value       = aws_s3_bucket.logs_third.arn
}

output "third_iam_role_arn" {
  description = "IAM role ARN for EC2 instances in third region"
  value       = aws_iam_role.ec2_role_third.arn
}

output "third_asg_name" {
  description = "Auto Scaling Group name for third region"
  value       = aws_autoscaling_group.third.name
}

output "third_launch_template_id" {
  description = "Launch Template ID for third region"
  value       = aws_launch_template.third.id
}

output "third_secrets_manager_arn" {
  description = "Secrets Manager ARN for RDS credentials in third region"
  value       = aws_secretsmanager_secret.rds_third.arn
}

output "third_cloudwatch_log_group" {
  description = "CloudWatch Log Group name for third region"
  value       = aws_cloudwatch_log_group.third.name
}

output "third_nat_gateway_ids" {
  description = "NAT Gateway IDs for third region"
  value       = aws_nat_gateway.third[*].id
}

output "third_internet_gateway_id" {
  description = "Internet Gateway ID for third region"
  value       = aws_internet_gateway.third.id
}

output "third_route_table_public_id" {
  description = "Public route table ID for third region"
  value       = aws_route_table.third_public.id
}

output "third_route_table_private_ids" {
  description = "Private route table IDs for third region"
  value       = aws_route_table.third_private[*].id
}

output "third_security_group_alb_id" {
  description = "ALB security group ID for third region"
  value       = aws_security_group.third_alb.id
}

output "third_security_group_ec2_id" {
  description = "EC2 security group ID for third region"
  value       = aws_security_group.third_ec2.id
}

output "third_security_group_rds_id" {
  description = "RDS security group ID for third region"
  value       = aws_security_group.third_rds.id
}

output "third_target_group_arn" {
  description = "Target group ARN for third region"
  value       = aws_lb_target_group.third.arn
}

output "third_db_subnet_group_name" {
  description = "DB subnet group name for third region"
  value       = aws_db_subnet_group.third.name
}

output "third_ami_id" {
  description = "Amazon Linux 2 AMI ID for third region"
  value       = data.aws_ami.amazon_linux2_third.id
}

output "third_elastic_ip_ids" {
  description = "Elastic IP IDs for NAT gateways in third region"
  value       = aws_eip.third_nat[*].id
}

output "third_instance_profile_name" {
  description = "IAM instance profile name for third region"
  value       = aws_iam_instance_profile.ec2_profile_third.name
}

# Global Outputs
output "random_suffix" {
  description = "Random suffix used for resource naming"
  value       = random_string.suffix.result
}

output "environment_tag" {
  description = "Environment tag applied to all resources"
  value       = var.environment
}

```

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
  alias  = "us_east_1"
  region = var.primary_region
}

provider "aws" {
  alias  = "us_west_2"
  region = var.secondary_region
}

provider "aws" {
  alias  = "eu_central_1"
  region = var.third_region
}

```
