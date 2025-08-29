```hcl
# Variables
variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-2"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-1"
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "allowed_https_cidrs" {
  description = "CIDR blocks allowed for HTTPS access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# Locals for consistent naming and configuration
locals {
  environment = "Production"

  # VPC Configuration
  primary_vpc_cidr   = "10.0.0.0/16"
  secondary_vpc_cidr = "10.1.0.0/16"

  # Subnet Configuration
  primary_public_subnet_cidr  = "10.0.1.0/24"
  primary_private_subnet_cidr = "10.0.2.0/24"
  secondary_public_subnet_cidr  = "10.1.1.0/24"
  secondary_private_subnet_cidr = "10.1.2.0/24"

  # Common tags
  common_tags = {
    Environment = local.environment
    Project     = "TAP-Stack"
    ManagedBy   = "Terraform"
  }

  # Naming conventions
  primary_prefix   = "tap-primary-${var.primary_region}"
  secondary_prefix = "tap-secondary-${var.secondary_region}"
}

# Random resources for RDS
resource "random_string" "db_username" {
  length  = 8
  special = false
  numeric = true
  upper   = true
  lower   = true
}

resource "random_password" "db_password" {
  length  = 16
  special = true
  # Exclude characters that AWS RDS doesn't allow
  override_special = "!#$%&*+-=?^_`|~"
}

# Data sources for AMI
data "aws_ami" "amazon_linux_primary" {
  provider    = aws.us_east_2
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

data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.us_west_1
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

# Availability Zones
data "aws_availability_zones" "primary" {
  provider = aws.us_east_2
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.us_west_1
  state    = "available"
}

# PRIMARY REGION RESOURCES (us-east-2)

# VPC - Primary Region
resource "aws_vpc" "primary" {
  provider             = aws.us_east_2
  cidr_block           = local.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-vpc"
  })
}

# Internet Gateway - Primary Region
resource "aws_internet_gateway" "primary" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-igw"
  })
}

# Public Subnet - Primary Region
resource "aws_subnet" "primary_public" {
  provider                = aws.us_east_2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_subnet_cidr
  availability_zone       = data.aws_availability_zones.primary.names[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-public-subnet"
    Type = "Public"
  })
}

# Private Subnet - Primary Region
resource "aws_subnet" "primary_private" {
  provider          = aws.us_east_2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnet_cidr
  availability_zone = data.aws_availability_zones.primary.names[1]

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-private-subnet"
    Type = "Private"
  })
}

# Elastic IP for NAT Gateway - Primary Region
resource "aws_eip" "primary_nat" {
  provider = aws.us_east_2
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-nat-eip"
  })

  depends_on = [aws_internet_gateway.primary]
}

# NAT Gateway - Primary Region
resource "aws_nat_gateway" "primary" {
  provider      = aws.us_east_2
  allocation_id = aws_eip.primary_nat.id
  subnet_id     = aws_subnet.primary_public.id

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-nat-gateway"
  })

  depends_on = [aws_internet_gateway.primary]
}

# Route Table for Public Subnet - Primary Region
resource "aws_route_table" "primary_public" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-public-rt"
  })
}

# Route Table for Private Subnet - Primary Region
resource "aws_route_table" "primary_private" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-private-rt"
  })
}

# Route Table Associations - Primary Region
resource "aws_route_table_association" "primary_public" {
  provider       = aws.us_east_2
  subnet_id      = aws_subnet.primary_public.id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  provider       = aws.us_east_2
  subnet_id      = aws_subnet.primary_private.id
  route_table_id = aws_route_table.primary_private.id
}

# SECONDARY REGION RESOURCES (us-west-1)

# VPC - Secondary Region
resource "aws_vpc" "secondary" {
  provider             = aws.us_west_1
  cidr_block           = local.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-vpc"
  })
}

# Internet Gateway - Secondary Region
resource "aws_internet_gateway" "secondary" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-igw"
  })
}

# Public Subnet - Secondary Region
resource "aws_subnet" "secondary_public" {
  provider                = aws.us_west_1
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_subnet_cidr
  availability_zone       = data.aws_availability_zones.secondary.names[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-public-subnet"
    Type = "Public"
  })
}

# Private Subnet - Secondary Region
resource "aws_subnet" "secondary_private" {
  provider          = aws.us_west_1
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnet_cidr
  availability_zone = data.aws_availability_zones.secondary.names[1]

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-private-subnet"
    Type = "Private"
  })
}

# Elastic IP for NAT Gateway - Secondary Region
resource "aws_eip" "secondary_nat" {
  provider = aws.us_west_1
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-nat-eip"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# NAT Gateway - Secondary Region
resource "aws_nat_gateway" "secondary" {
  provider      = aws.us_west_1
  allocation_id = aws_eip.secondary_nat.id
  subnet_id     = aws_subnet.secondary_public.id

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-nat-gateway"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Route Table for Public Subnet - Secondary Region
resource "aws_route_table" "secondary_public" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-public-rt"
  })
}

# Route Table for Private Subnet - Secondary Region
resource "aws_route_table" "secondary_private" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-private-rt"
  })
}

# Route Table Associations - Secondary Region
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.us_west_1
  subnet_id      = aws_subnet.secondary_public.id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table_association" "secondary_private" {
  provider       = aws.us_west_1
  subnet_id      = aws_subnet.secondary_private.id
  route_table_id = aws_route_table.secondary_private.id
}

# SECURITY GROUPS

# Security Group for EC2 instances - Primary Region
resource "aws_security_group" "ec2_primary" {
  provider    = aws.us_east_2
  name        = "${local.primary_prefix}-ec2-sg"
  description = "Security group for EC2 instances in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
    description = "SSH access"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_https_cidrs
    description = "HTTPS access"
  }

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.elb_primary.id]
    description     = "HTTP from ELB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-ec2-sg"
  })
}

# Security Group for EC2 instances - Secondary Region
resource "aws_security_group" "ec2_secondary" {
  provider    = aws.us_west_1
  name        = "${local.secondary_prefix}-ec2-sg"
  description = "Security group for EC2 instances in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
    description = "SSH access"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_https_cidrs
    description = "HTTPS access"
  }

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.elb_secondary.id]
    description     = "HTTP from ELB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-ec2-sg"
  })
}

# Security Group for ELB - Primary Region
resource "aws_security_group" "elb_primary" {
  provider    = aws.us_east_2
  name        = "${local.primary_prefix}-elb-sg"
  description = "Security group for ELB in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-elb-sg"
  })
}

# Security Group for ELB - Secondary Region
resource "aws_security_group" "elb_secondary" {
  provider    = aws.us_west_1
  name        = "${local.secondary_prefix}-elb-sg"
  description = "Security group for ELB in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-elb-sg"
  })
}

# Security Group for RDS - Primary Region
resource "aws_security_group" "rds_primary" {
  provider    = aws.us_east_2
  name        = "${local.primary_prefix}-rds-sg"
  description = "Security group for RDS in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_primary.id]
    description     = "MySQL access from EC2"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-rds-sg"
  })
}

# Security Group for RDS - Secondary Region
resource "aws_security_group" "rds_secondary" {
  provider    = aws.us_west_1
  name        = "${local.secondary_prefix}-rds-sg"
  description = "Security group for RDS in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_secondary.id]
    description     = "MySQL access from EC2"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-rds-sg"
  })
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "tap-ec2-role"

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

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "tap-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# IAM Policy for CloudWatch
resource "aws_iam_role_policy" "ec2_cloudwatch_policy" {
  name = "tap-ec2-cloudwatch-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      }
    ]
  })
}

# Launch Template - Primary Region
resource "aws_launch_template" "primary" {
  provider      = aws.us_east_2
  name          = "${local.primary_prefix}-launch-template"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2_primary.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  monitoring {
    enabled = true
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent
              systemctl enable amazon-cloudwatch-agent
              systemctl start amazon-cloudwatch-agent
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.primary_prefix}-instance"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-launch-template"
  })
}

# Launch Template - Secondary Region
resource "aws_launch_template" "secondary" {
  provider      = aws.us_west_1
  name          = "${local.secondary_prefix}-launch-template"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2_secondary.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  monitoring {
    enabled = true
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent
              systemctl enable amazon-cloudwatch-agent
              systemctl start amazon-cloudwatch-agent
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.secondary_prefix}-instance"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-launch-template"
  })
}

# Auto Scaling Group - Primary Region
resource "aws_autoscaling_group" "primary" {
  provider            = aws.us_east_2
  name                = "${local.primary_prefix}-asg"
  vpc_zone_identifier = [aws_subnet.primary_private.id]
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 4
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.primary.id
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
    value               = "${local.primary_prefix}-asg"
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

# Auto Scaling Group - Secondary Region
resource "aws_autoscaling_group" "secondary" {
  provider            = aws.us_west_1
  name                = "${local.secondary_prefix}-asg"
  vpc_zone_identifier = [aws_subnet.secondary_private.id]
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 4
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.secondary.id
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
    value               = "${local.secondary_prefix}-asg"
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

# Application Load Balancer - Primary Region
resource "aws_lb" "primary" {
  provider           = aws.us_east_2
  name               = "${local.primary_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.elb_primary.id]
  subnets            = [aws_subnet.primary_public.id, aws_subnet.primary_private.id]

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-alb"
  })
}

# Application Load Balancer - Secondary Region
resource "aws_lb" "secondary" {
  provider           = aws.us_west_1
  name               = "${local.secondary_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.elb_secondary.id]
  subnets            = [aws_subnet.secondary_public.id, aws_subnet.secondary_private.id]

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-alb"
  })
}

# Target Group - Primary Region
resource "aws_lb_target_group" "primary" {
  provider = aws.us_east_2
  name     = "${local.primary_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id

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
    Name = "${local.primary_prefix}-tg"
  })
}

# Target Group - Secondary Region
resource "aws_lb_target_group" "secondary" {
  provider = aws.us_west_1
  name     = "${local.secondary_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id

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
    Name = "${local.secondary_prefix}-tg"
  })
}

# Load Balancer Listener - Primary Region
resource "aws_lb_listener" "primary" {
  provider          = aws.us_east_2
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }

  tags = local.common_tags
}

# Load Balancer Listener - Secondary Region
resource "aws_lb_listener" "secondary" {
  provider          = aws.us_west_1
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }

  tags = local.common_tags
}

# DB Subnet Group - Primary Region
resource "aws_db_subnet_group" "primary" {
  provider   = aws.us_east_2
  name       = "${local.primary_prefix}-db-subnet-group"
  subnet_ids = [aws_subnet.primary_private.id, aws_subnet.primary_public.id]

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-db-subnet-group"
  })
}

# DB Subnet Group - Secondary Region
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.us_west_1
  name       = "${local.secondary_prefix}-db-subnet-group"
  subnet_ids = [aws_subnet.secondary_private.id, aws_subnet.secondary_public.id]

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-db-subnet-group"
  })
}

# RDS Primary Database
resource "aws_db_instance" "primary" {
  provider = aws.us_east_2

  identifier = "${local.primary_prefix}-database"

  # Database Configuration
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  # Storage Configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  # Database Credentials
  db_name  = "tapdb"
  username = "a${random_string.db_username.result}"
  password = random_password.db_password.result

  # Network Configuration
  vpc_security_group_ids = [aws_security_group.rds_primary.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name

  # Backup Configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Security
  skip_final_snapshot = true
  deletion_protection = false

  # Performance Insights
  #performance_insights_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-database"
  })
}

# RDS Read Replica in Secondary Region
resource "aws_db_instance" "secondary" {
  provider = aws.us_west_1

  identifier = "${local.secondary_prefix}-database-replica"

  # Replica Configuration
  replicate_source_db = aws_db_instance.primary.arn
  instance_class      = var.db_instance_class

  # Storage Configuration
  storage_encrypted = true

  # Network Configuration
  vpc_security_group_ids = [aws_security_group.rds_secondary.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary.name

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Security
  skip_final_snapshot = true
  deletion_protection = false

  # Performance Insights
  #performance_insights_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-database-replica"
  })

  depends_on = [aws_db_instance.primary]
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "tap-rds-monitoring-role"

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

# Attach AWS managed policy for RDS Enhanced Monitoring
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# S3 Bucket for CloudFront
resource "aws_s3_bucket" "cloudfront_bucket" {
  bucket = "tap-cloudfront-bucket-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "tap-cloudfront-bucket"
  })
}

# Random string for S3 bucket suffix to ensure uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudfront_bucket" {
  bucket = aws_s3_bucket.cloudfront_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "cloudfront_bucket" {
  bucket = aws_s3_bucket.cloudfront_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "cloudfront_bucket" {
  bucket = aws_s3_bucket.cloudfront_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "s3_oac" {
  name                              = "tap-s3-oac"
  description                       = "OAC for S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name              = aws_s3_bucket.cloudfront_bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.s3_oac.id
    origin_id                = "S3-${aws_s3_bucket.cloudfront_bucket.bucket}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.cloudfront_bucket.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(local.common_tags, {
    Name = "tap-cloudfront-distribution"
  })
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "cloudfront_bucket_policy" {
  bucket = aws_s3_bucket.cloudfront_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.cloudfront_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.s3_distribution.arn
          }
        }
      }
    ]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "primary_app_logs" {
  provider          = aws.us_east_2
  name              = "/aws/ec2/${local.primary_prefix}"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-log-group"
  })
}

resource "aws_cloudwatch_log_group" "secondary_app_logs" {
  provider          = aws.us_west_1
  name              = "/aws/ec2/${local.secondary_prefix}"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-log-group"
  })
}

# CloudWatch Alarms for Primary Region
resource "aws_cloudwatch_metric_alarm" "primary_cpu_high" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-cpu-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "primary_cpu_low" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-cpu-low-alarm"
  })
}

# CloudWatch Alarms for Secondary Region
resource "aws_cloudwatch_metric_alarm" "secondary_cpu_high" {
  provider            = aws.us_west_1
  alarm_name          = "${local.secondary_prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-cpu-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "secondary_cpu_low" {
  provider            = aws.us_west_1
  alarm_name          = "${local.secondary_prefix}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-cpu-low-alarm"
  })
}

# Auto Scaling Policies - Primary Region
resource "aws_autoscaling_policy" "primary_scale_up" {
  provider           = aws.us_east_2
  name               = "${local.primary_prefix}-scale-up"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

resource "aws_autoscaling_policy" "primary_scale_down" {
  provider           = aws.us_east_2
  name               = "${local.primary_prefix}-scale-down"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

# Auto Scaling Policies - Secondary Region
resource "aws_autoscaling_policy" "secondary_scale_up" {
  provider           = aws.us_west_1
  name               = "${local.secondary_prefix}-scale-up"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

resource "aws_autoscaling_policy" "secondary_scale_down" {
  provider           = aws.us_west_1
  name               = "${local.secondary_prefix}-scale-down"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

# CloudWatch Alarm Actions - Primary Region
resource "aws_cloudwatch_metric_alarm" "primary_scale_up_alarm" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-scale-up-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization for scaling up"
  alarm_actions       = [aws_autoscaling_policy.primary_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-scale-up-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "primary_scale_down_alarm" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-scale-down-alarm"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization for scaling down"
  alarm_actions       = [aws_autoscaling_policy.primary_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-scale-down-alarm"
  })
}

# CloudWatch Alarm Actions - Secondary Region
resource "aws_cloudwatch_metric_alarm" "secondary_scale_up_alarm" {
  provider            = aws.us_west_1
  alarm_name          = "${local.secondary_prefix}-scale-up-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization for scaling up"
  alarm_actions       = [aws_autoscaling_policy.secondary_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-scale-up-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "secondary_scale_down_alarm" {
  provider            = aws.us_west_1
  alarm_name          = "${local.secondary_prefix}-scale-down-alarm"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization for scaling down"
  alarm_actions       = [aws_autoscaling_policy.secondary_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-scale-down-alarm"
  })
}

# OUTPUTS

# VPC Outputs
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

output "primary_vpc_cidr" {
  description = "CIDR block of the primary VPC"
  value       = aws_vpc.primary.cidr_block
}

output "secondary_vpc_cidr" {
  description = "CIDR block of the secondary VPC"
  value       = aws_vpc.secondary.cidr_block
}

# Subnet Outputs
output "primary_public_subnet_id" {
  description = "ID of the primary public subnet"
  value       = aws_subnet.primary_public.id
}

output "primary_private_subnet_id" {
  description = "ID of the primary private subnet"
  value       = aws_subnet.primary_private.id
}

output "secondary_public_subnet_id" {
  description = "ID of the secondary public subnet"
  value       = aws_subnet.secondary_public.id
}

output "secondary_private_subnet_id" {
  description = "ID of the secondary private subnet"
  value       = aws_subnet.secondary_private.id
}

# Internet Gateway Outputs
output "primary_internet_gateway_id" {
  description = "ID of the primary internet gateway"
  value       = aws_internet_gateway.primary.id
}

output "secondary_internet_gateway_id" {
  description = "ID of the secondary internet gateway"
  value       = aws_internet_gateway.secondary.id
}

# NAT Gateway Outputs
output "primary_nat_gateway_id" {
  description = "ID of the primary NAT gateway"
  value       = aws_nat_gateway.primary.id
}

output "secondary_nat_gateway_id" {
  description = "ID of the secondary NAT gateway"
  value       = aws_nat_gateway.secondary.id
}

# Route Table Outputs
output "primary_public_route_table_id" {
  description = "ID of the primary public route table"
  value       = aws_route_table.primary_public.id
}

output "primary_private_route_table_id" {
  description = "ID of the primary private route table"
  value       = aws_route_table.primary_private.id
}

output "secondary_public_route_table_id" {
  description = "ID of the secondary public route table"
  value       = aws_route_table.secondary_public.id
}

output "secondary_private_route_table_id" {
  description = "ID of the secondary private route table"
  value       = aws_route_table.secondary_private.id
}

# Security Group Outputs
output "primary_ec2_security_group_id" {
  description = "ID of the primary EC2 security group"
  value       = aws_security_group.ec2_primary.id
}

output "secondary_ec2_security_group_id" {
  description = "ID of the secondary EC2 security group"
  value       = aws_security_group.ec2_secondary.id
}

output "primary_elb_security_group_id" {
  description = "ID of the primary ELB security group"
  value       = aws_security_group.elb_primary.id
}

output "secondary_elb_security_group_id" {
  description = "ID of the secondary ELB security group"
  value       = aws_security_group.elb_secondary.id
}

output "primary_rds_security_group_id" {
  description = "ID of the primary RDS security group"
  value       = aws_security_group.rds_primary.id
}

output "secondary_rds_security_group_id" {
  description = "ID of the secondary RDS security group"
  value       = aws_security_group.rds_secondary.id
}

# AMI Outputs
output "primary_ami_id" {
  description = "AMI ID used in primary region"
  value       = data.aws_ami.amazon_linux_primary.id
}

output "secondary_ami_id" {
  description = "AMI ID used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.id
}

output "primary_ami_name" {
  description = "AMI name used in primary region"
  value       = data.aws_ami.amazon_linux_primary.name
}

output "secondary_ami_name" {
  description = "AMI name used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.name
}

# IAM Outputs
output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "rds_monitoring_role_arn" {
  description = "ARN of the RDS monitoring IAM role"
  value       = aws_iam_role.rds_monitoring.arn
}

# Launch Template Outputs
output "primary_launch_template_id" {
  description = "ID of the primary launch template"
  value       = aws_launch_template.primary.id
}

output "secondary_launch_template_id" {
  description = "ID of the secondary launch template"
  value       = aws_launch_template.secondary.id
}

output "primary_launch_template_latest_version" {
  description = "Latest version of the primary launch template"
  value       = aws_launch_template.primary.latest_version
}

output "secondary_launch_template_latest_version" {
  description = "Latest version of the secondary launch template"
  value       = aws_launch_template.secondary.latest_version
}

# Auto Scaling Group Outputs
output "primary_asg_name" {
  description = "Name of the primary auto scaling group"
  value       = aws_autoscaling_group.primary.name
}

output "secondary_asg_name" {
  description = "Name of the secondary auto scaling group"
  value       = aws_autoscaling_group.secondary.name
}

output "primary_asg_arn" {
  description = "ARN of the primary auto scaling group"
  value       = aws_autoscaling_group.primary.arn
}

output "secondary_asg_arn" {
  description = "ARN of the secondary auto scaling group"
  value       = aws_autoscaling_group.secondary.arn
}

# Load Balancer Outputs
output "primary_alb_arn" {
  description = "ARN of the primary application load balancer"
  value       = aws_lb.primary.arn
}

output "secondary_alb_arn" {
  description = "ARN of the secondary application load balancer"
  value       = aws_lb.secondary.arn
}

output "primary_alb_dns_name" {
  description = "DNS name of the primary application load balancer"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary application load balancer"
  value       = aws_lb.secondary.dns_name
}

output "primary_alb_zone_id" {
  description = "Zone ID of the primary application load balancer"
  value       = aws_lb.primary.zone_id
}

output "secondary_alb_zone_id" {
  description = "Zone ID of the secondary application load balancer"
  value       = aws_lb.secondary.zone_id
}

# Target Group Outputs
output "primary_target_group_arn" {
  description = "ARN of the primary target group"
  value       = aws_lb_target_group.primary.arn
}

output "secondary_target_group_arn" {
  description = "ARN of the secondary target group"
  value       = aws_lb_target_group.secondary.arn
}

# RDS Outputs
output "primary_rds_endpoint" {
  description = "RDS instance endpoint for primary database"
  value       = aws_db_instance.primary.endpoint
}

output "secondary_rds_endpoint" {
  description = "RDS instance endpoint for secondary database (read replica)"
  value       = aws_db_instance.secondary.endpoint
}

output "primary_rds_instance_id" {
  description = "RDS instance ID for primary database"
  value       = aws_db_instance.primary.id
}

output "secondary_rds_instance_id" {
  description = "RDS instance ID for secondary database"
  value       = aws_db_instance.secondary.id
}

output "primary_rds_port" {
  description = "RDS instance port for primary database"
  value       = aws_db_instance.primary.port
}

output "secondary_rds_port" {
  description = "RDS instance port for secondary database"
  value       = aws_db_instance.secondary.port
}

output "rds_database_name" {
  description = "Name of the database"
  value       = aws_db_instance.primary.db_name
}

output "rds_username" {
  description = "Master username for the database"
  value       = aws_db_instance.primary.username
}

# S3 and CloudFront Outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.cloudfront_bucket.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.cloudfront_bucket.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.cloudfront_bucket.bucket_domain_name
}

output "s3_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.cloudfront_bucket.bucket_regional_domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.s3_distribution.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.s3_distribution.arn
}

output "cloudfront_distribution_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.s3_distribution.domain_name
}

output "cloudfront_distribution_hosted_zone_id" {
  description = "Hosted zone ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
}

# CloudWatch Outputs
output "primary_log_group_name" {
  description = "Name of the primary CloudWatch log group"
  value       = aws_cloudwatch_log_group.primary_app_logs.name
}

output "secondary_log_group_name" {
  description = "Name of the secondary CloudWatch log group"
  value       = aws_cloudwatch_log_group.secondary_app_logs.name
}

output "primary_cpu_high_alarm_name" {
  description = "Name of the primary CPU high alarm"
  value       = aws_cloudwatch_metric_alarm.primary_cpu_high.alarm_name
}

output "secondary_cpu_high_alarm_name" {
  description = "Name of the secondary CPU high alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_cpu_high.alarm_name
}

# Auto Scaling Policy Outputs
output "primary_scale_up_policy_arn" {
  description = "ARN of the primary scale up policy"
  value       = aws_autoscaling_policy.primary_scale_up.arn
}

output "primary_scale_down_policy_arn" {
  description = "ARN of the primary scale down policy"
  value       = aws_autoscaling_policy.primary_scale_down.arn
}

output "secondary_scale_up_policy_arn" {
  description = "ARN of the secondary scale up policy"
  value       = aws_autoscaling_policy.secondary_scale_up.arn
}

output "secondary_scale_down_policy_arn" {
  description = "ARN of the secondary scale down policy"
  value       = aws_autoscaling_policy.secondary_scale_down.arn
}

# Availability Zone Outputs
output "primary_availability_zones" {
  description = "List of availability zones in primary region"
  value       = data.aws_availability_zones.primary.names
}

output "secondary_availability_zones" {
  description = "List of availability zones in secondary region"
  value       = data.aws_availability_zones.secondary.names
}

# Region Outputs
output "primary_region" {
  description = "Primary region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary region"
  value       = var.secondary_region
}

# Environment and Tags
output "environment" {
  description = "Environment name"
  value       = local.environment
}

output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}
```

# provider.tf
```hcl
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
#provider "aws" {
#  region = var.aws_region
#}
provider "aws" {
  alias  = "us_east_2"
  region = var.primary_region
}

provider "aws" {
  alias  = "us_west_1"
  region = var.secondary_region
}
```
