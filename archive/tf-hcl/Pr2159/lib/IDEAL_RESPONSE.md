# tap_stack.tf - Complete multi-region infrastructure stack
```hcl
# Variables
variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment tag"
  type        = string
  default     = "Production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap-stack"
}

# Locals
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }

  primary_region   = "us-east-1"
  secondary_region = "us-west-2"

  # CIDR blocks
  primary_vpc_cidr   = "10.0.0.0/16"
  secondary_vpc_cidr = "10.1.0.0/16"

  # Subnet CIDRs for primary region (us-east-1)
  primary_public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  primary_private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]

  # Subnet CIDRs for secondary region (us-west-2)
  secondary_public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
  secondary_private_subnet_cidrs = ["10.1.10.0/24", "10.1.20.0/24"]
}

# Data sources for availability zones
data "aws_availability_zones" "primary" {
  provider = aws.us_east_1
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.us_west_2
  state    = "available"
}

# Data source for Amazon Linux 2 AMI in primary region
data "aws_ami" "amazon_linux_primary" {
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

# Data source for Amazon Linux 2 AMI in secondary region
data "aws_ami" "amazon_linux_secondary" {
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

# Random password for RDS master password
resource "random_password" "rds_master_password" {
  length  = 16
  special = true
  override_special = "!#$%&()*+-=:?^_"
}

# Random string for RDS master username
resource "random_string" "rds_master_username" {
  length  = 8
  special = false
  numeric = false
  upper   = false
}

# KMS Key for S3 encryption in primary region
resource "aws_kms_key" "s3_primary" {
  provider                = aws.us_east_1
  description             = "KMS key for S3 encryption in primary region"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-s3-kms-primary"
  })
}

resource "aws_kms_alias" "s3_primary" {
  provider      = aws.us_east_1
  name          = "alias/${var.project_name}-s3-primary"
  target_key_id = aws_kms_key.s3_primary.key_id
}

# KMS Key for S3 encryption in secondary region
resource "aws_kms_key" "s3_secondary" {
  provider                = aws.us_west_2
  description             = "KMS key for S3 encryption in secondary region"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-s3-kms-secondary"
  })
}

resource "aws_kms_alias" "s3_secondary" {
  provider      = aws.us_west_2
  name          = "alias/${var.project_name}-s3-secondary"
  target_key_id = aws_kms_key.s3_secondary.key_id
}

# PRIMARY REGION VPC AND NETWORKING
resource "aws_vpc" "primary" {
  provider             = aws.us_east_1
  cidr_block           = local.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc-primary"
  })
}

# Internet Gateway for primary VPC
resource "aws_internet_gateway" "primary" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw-primary"
  })
}

# Public subnets in primary region
resource "aws_subnet" "primary_public" {
  provider                = aws.us_east_1
  count                   = length(local.primary_public_subnet_cidrs)
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}-primary"
    Type = "Public"
  })
}

# Private subnets in primary region
resource "aws_subnet" "primary_private" {
  provider          = aws.us_east_1
  count             = length(local.primary_private_subnet_cidrs)
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}-primary"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways in primary region
resource "aws_eip" "primary_nat" {
  provider = aws.us_east_1
  count    = length(local.primary_public_subnet_cidrs)
  domain   = "vpc"

  depends_on = [aws_internet_gateway.primary]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-eip-nat-${count.index + 1}-primary"
  })
}

# NAT Gateways in primary region
resource "aws_nat_gateway" "primary" {
  provider      = aws.us_east_1
  count         = length(local.primary_public_subnet_cidrs)
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id

  depends_on = [aws_internet_gateway.primary]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-${count.index + 1}-primary"
  })
}

# Route table for public subnets in primary region
resource "aws_route_table" "primary_public" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rt-public-primary"
  })
}

# Route table associations for public subnets in primary region
resource "aws_route_table_association" "primary_public" {
  provider       = aws.us_east_1
  count          = length(aws_subnet.primary_public)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Route tables for private subnets in primary region
resource "aws_route_table" "primary_private" {
  provider = aws.us_east_1
  count    = length(aws_subnet.primary_private)
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rt-private-${count.index + 1}-primary"
  })
}

# Route table associations for private subnets in primary region
resource "aws_route_table_association" "primary_private" {
  provider       = aws.us_east_1
  count          = length(aws_subnet.primary_private)
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# SECONDARY REGION VPC AND NETWORKING
resource "aws_vpc" "secondary" {
  provider             = aws.us_west_2
  cidr_block           = local.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc-secondary"
  })
}

# Internet Gateway for secondary VPC
resource "aws_internet_gateway" "secondary" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw-secondary"
  })
}

# Public subnets in secondary region
resource "aws_subnet" "secondary_public" {
  provider                = aws.us_west_2
  count                   = length(local.secondary_public_subnet_cidrs)
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}-secondary"
    Type = "Public"
  })
}

# Private subnets in secondary region
resource "aws_subnet" "secondary_private" {
  provider          = aws.us_west_2
  count             = length(local.secondary_private_subnet_cidrs)
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}-secondary"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways in secondary region
resource "aws_eip" "secondary_nat" {
  provider = aws.us_west_2
  count    = length(local.secondary_public_subnet_cidrs)
  domain   = "vpc"

  depends_on = [aws_internet_gateway.secondary]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-eip-nat-${count.index + 1}-secondary"
  })
}

# NAT Gateways in secondary region
resource "aws_nat_gateway" "secondary" {
  provider      = aws.us_west_2
  count         = length(local.secondary_public_subnet_cidrs)
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id

  depends_on = [aws_internet_gateway.secondary]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-${count.index + 1}-secondary"
  })
}

# Route table for public subnets in secondary region
resource "aws_route_table" "secondary_public" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rt-public-secondary"
  })
}

# Route table associations for public subnets in secondary region
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.us_west_2
  count          = length(aws_subnet.secondary_public)
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# Route tables for private subnets in secondary region
resource "aws_route_table" "secondary_private" {
  provider = aws.us_west_2
  count    = length(aws_subnet.secondary_private)
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rt-private-${count.index + 1}-secondary"
  })
}

# Route table associations for private subnets in secondary region
resource "aws_route_table_association" "secondary_private" {
  provider       = aws.us_west_2
  count          = length(aws_subnet.secondary_private)
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# VPC PEERING CONNECTION
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider    = aws.us_east_1
  vpc_id      = aws_vpc.primary.id
  peer_vpc_id = aws_vpc.secondary.id
  peer_region = local.secondary_region
  auto_accept = false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-peering-primary-to-secondary"
  })
}

# Accept VPC peering connection in secondary region
resource "aws_vpc_peering_connection_accepter" "secondary" {
  provider                  = aws.us_west_2
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-peering-accepter-secondary"
  })
}

# Add routes for VPC peering in primary region route tables
resource "aws_route" "primary_public_to_secondary" {
  provider                  = aws.us_east_1
  route_table_id            = aws_route_table.primary_public.id
  destination_cidr_block    = local.secondary_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

resource "aws_route" "primary_private_to_secondary" {
  provider                  = aws.us_east_1
  count                     = length(aws_route_table.primary_private)
  route_table_id            = aws_route_table.primary_private[count.index].id
  destination_cidr_block    = local.secondary_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

# Add routes for VPC peering in secondary region route tables
resource "aws_route" "secondary_public_to_primary" {
  provider                  = aws.us_west_2
  route_table_id            = aws_route_table.secondary_public.id
  destination_cidr_block    = local.primary_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

resource "aws_route" "secondary_private_to_primary" {
  provider                  = aws.us_west_2
  count                     = length(aws_route_table.secondary_private)
  route_table_id            = aws_route_table.secondary_private[count.index].id
  destination_cidr_block    = local.primary_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

# IAM ROLES AND POLICIES
# IAM role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

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

# IAM policy for EC2 instances (least privilege)
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${var.project_name}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.primary.arn}/*",
          "${aws_s3_bucket.secondary.arn}/*"
        ]
      }
    ]
  })
}

# IAM instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# SECURITY GROUPS
# Security group for ALB in primary region
resource "aws_security_group" "alb_primary" {
  provider    = aws.us_east_1
  name        = "${var.project_name}-alb-sg-primary"
  description = "Security group for Application Load Balancer in primary region"
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

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-alb-sg-primary"
  })
}

# Security group for EC2 instances in primary region
resource "aws_security_group" "ec2_primary" {
  provider    = aws.us_east_1
  name        = "${var.project_name}-ec2-sg-primary"
  description = "Security group for EC2 instances in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_primary.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [local.primary_vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-ec2-sg-primary"
  })
}

# Security group for ALB in secondary region
resource "aws_security_group" "alb_secondary" {
  provider    = aws.us_west_2
  name        = "${var.project_name}-alb-sg-secondary"
  description = "Security group for Application Load Balancer in secondary region"
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

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-alb-sg-secondary"
  })
}

# Security group for EC2 instances in secondary region
resource "aws_security_group" "ec2_secondary" {
  provider    = aws.us_west_2
  name        = "${var.project_name}-ec2-sg-secondary"
  description = "Security group for EC2 instances in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_secondary.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [local.secondary_vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-ec2-sg-secondary"
  })
}

# Security group for RDS
resource "aws_security_group" "rds_primary" {
  provider    = aws.us_east_1
  name        = "${var.project_name}-rds-sg-primary"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_primary.id]
  }

  # Allow connection from secondary region for read replica
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [local.secondary_vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-sg-primary"
  })
}

# Security group for RDS read replica
resource "aws_security_group" "rds_secondary" {
  provider    = aws.us_west_2
  name        = "${var.project_name}-rds-sg-secondary"
  description = "Security group for RDS read replica"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_secondary.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-sg-secondary"
  })
}

# LAUNCH TEMPLATES
# Launch template for primary region
resource "aws_launch_template" "primary" {
  provider      = aws.us_east_1
  name          = "${var.project_name}-lt-primary"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.ec2_primary.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from Primary Region (${local.primary_region})</h1>" > /var/www/html/index.html
              # Install CloudWatch agent
              yum install -y amazon-cloudwatch-agent
              # Create CloudWatch agent config
              cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOL'
              {
                "logs": {
                  "logs_collected": {
                    "files": {
                      "collect_list": [
                        {
                          "file_path": "/var/log/httpd/access_log",
                          "log_group_name": "${aws_cloudwatch_log_group.primary.name}",
                          "log_stream_name": "{instance_id}/httpd/access_log"
                        },
                        {
                          "file_path": "/var/log/httpd/error_log",
                          "log_group_name": "${aws_cloudwatch_log_group.primary.name}",
                          "log_stream_name": "{instance_id}/httpd/error_log"
                        }
                      ]
                    }
                  }
                }
              }
              EOL
              # Start CloudWatch agent
              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${var.project_name}-instance-primary"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-lt-primary"
  })
}

# Launch template for secondary region
resource "aws_launch_template" "secondary" {
  provider      = aws.us_west_2
  name          = "${var.project_name}-lt-secondary"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.ec2_secondary.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from Secondary Region (${local.secondary_region})</h1>" > /var/www/html/index.html
              # Install CloudWatch agent
              yum install -y amazon-cloudwatch-agent
              # Create CloudWatch agent config
              cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOL'
              {
                "logs": {
                  "logs_collected": {
                    "files": {
                      "collect_list": [
                        {
                          "file_path": "/var/log/httpd/access_log",
                          "log_group_name": "${aws_cloudwatch_log_group.secondary.name}",
                          "log_stream_name": "{instance_id}/httpd/access_log"
                        },
                        {
                          "file_path": "/var/log/httpd/error_log",
                          "log_group_name": "${aws_cloudwatch_log_group.secondary.name}",
                          "log_stream_name": "{instance_id}/httpd/error_log"
                        }
                      ]
                    }
                  }
                }
              }
              EOL
              # Start CloudWatch agent
              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${var.project_name}-instance-secondary"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-lt-secondary"
  })
}

# AUTO SCALING GROUPS
# Auto Scaling Group for primary region
# Auto Scaling Group for primary region
resource "aws_autoscaling_group" "primary" {
  provider            = aws.us_east_1
  name                = "${var.project_name}-asg-primary"
  vpc_zone_identifier = aws_subnet.primary_private[*].id
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 3
  max_size         = 6
  desired_capacity = 3

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-primary"
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

# Auto Scaling Group for secondary region
resource "aws_autoscaling_group" "secondary" {
  provider            = aws.us_west_2
  name                = "${var.project_name}-asg-secondary"
  vpc_zone_identifier = aws_subnet.secondary_private[*].id
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 3
  max_size         = 6
  desired_capacity = 3

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-secondary"
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

# APPLICATION LOAD BALANCERS
# Application Load Balancer for primary region
resource "aws_lb" "primary" {
  provider           = aws.us_east_1
  name               = "${var.project_name}-alb-primary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_primary.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-alb-primary"
  })
}

# Target group for primary region ALB
resource "aws_lb_target_group" "primary" {
  provider = aws.us_east_1
  name     = "${var.project_name}-tg-primary"
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
    Name = "${var.project_name}-tg-primary"
  })
}

# Listener for primary region ALB
resource "aws_lb_listener" "primary" {
  provider          = aws.us_east_1
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }

  tags = local.common_tags
}

# Application Load Balancer for secondary region
resource "aws_lb" "secondary" {
  provider           = aws.us_west_2
  name               = "${var.project_name}-alb-secondary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_secondary.id]
  subnets            = aws_subnet.secondary_public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-alb-secondary"
  })
}

# Target group for secondary region ALB
resource "aws_lb_target_group" "secondary" {
  provider = aws.us_west_2
  name     = "${var.project_name}-tg-secondary"
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
    Name = "${var.project_name}-tg-secondary"
  })
}

# Listener for secondary region ALB
resource "aws_lb_listener" "secondary" {
  provider          = aws.us_west_2
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }

  tags = local.common_tags
}

# S3 BUCKETS
# S3 bucket in primary region
resource "aws_s3_bucket" "primary" {
  provider = aws.us_east_1
  bucket   = "${var.project_name}-bucket-primary-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-bucket-primary"
  })
}

# Random string for bucket suffix to ensure uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 bucket versioning for primary region
resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption for primary region
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_primary.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket public access block for primary region
resource "aws_s3_bucket_public_access_block" "primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket in secondary region
resource "aws_s3_bucket" "secondary" {
  provider = aws.us_west_2
  bucket   = "${var.project_name}-bucket-secondary-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-bucket-secondary"
  })
}

# S3 bucket versioning for secondary region
resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.secondary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption for secondary region
resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_secondary.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket public access block for secondary region
resource "aws_s3_bucket_public_access_block" "secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.secondary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CLOUDFRONT DISTRIBUTION
# CloudFront Origin Access Control for primary bucket
resource "aws_cloudfront_origin_access_control" "primary" {
  name                              = "${var.project_name}-oac-primary"
  description                       = "OAC for primary S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Origin Access Control for secondary bucket
resource "aws_cloudfront_origin_access_control" "secondary" {
  name                              = "${var.project_name}-oac-secondary"
  description                       = "OAC for secondary S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "main" {
  # Primary origin (S3 bucket in us-east-1)
  origin {
    domain_name              = aws_s3_bucket.primary.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.primary.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.primary.id
  }

  # Secondary origin (S3 bucket in us-west-2)
  origin {
    domain_name              = aws_s3_bucket.secondary.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.secondary.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.secondary.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.primary.id}"

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

  # Failover to secondary origin
  ordered_cache_behavior {
    path_pattern     = "*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.secondary.id}"

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

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-cloudfront"
  })
}

# S3 bucket policy for CloudFront access to primary bucket
resource "aws_s3_bucket_policy" "primary_cloudfront" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.primary.id

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
        Resource = "${aws_s3_bucket.primary.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      }
    ]
  })
}

# S3 bucket policy for CloudFront access to secondary bucket
resource "aws_s3_bucket_policy" "secondary_cloudfront" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.secondary.id

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
        Resource = "${aws_s3_bucket.secondary.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      }
    ]
  })
}

# RDS SUBNET GROUPS
# DB subnet group for primary region
resource "aws_db_subnet_group" "primary" {
  provider   = aws.us_east_1
  name       = "${var.project_name}-db-subnet-group-primary"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-subnet-group-primary"
  })
}

# DB subnet group for secondary region
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.us_west_2
  name       = "${var.project_name}-db-subnet-group-secondary"
  subnet_ids = aws_subnet.secondary_private[*].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-subnet-group-secondary"
  })
}

# RDS INSTANCES
# RDS PostgreSQL instance in primary region
#data "aws_rds_engine_version" "postgresql" {
#  provider = aws.us_east_1
#  engine   = "postgres"
#}

resource "aws_db_instance" "primary" {
  provider = aws.us_east_1

  identifier     = "${var.project_name}-postgres-primary"
  engine         = "postgres"
  engine_version = 15
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "tapstackdb"
  username = random_string.rds_master_username.result
  password = random_password.rds_master_password.result

  vpc_security_group_ids = [aws_security_group.rds_primary.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  # Enable automated backups for read replica
  copy_tags_to_snapshot = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-postgres-primary"
  })
}

resource "aws_kms_key" "rds_secondary" {
  provider                = aws.us_west_2
  description             = "KMS key for RDS encryption in secondary region"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-kms-secondary"
  })
}

resource "aws_kms_alias" "rds_secondary" {
  provider      = aws.us_west_2
  name          = "alias/${var.project_name}-rds-secondary"
  target_key_id = aws_kms_key.rds_secondary.key_id
}

# RDS read replica in secondary region
resource "aws_db_instance" "secondary" {
  provider = aws.us_west_2

  identifier                = "${var.project_name}-postgres-replica"
  replicate_source_db       = aws_db_instance.primary.arn
  instance_class            = "db.t3.micro"
  storage_encrypted         = true
  kms_key_id                = aws_kms_key.rds_secondary.arn
  vpc_security_group_ids = [aws_security_group.rds_secondary.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary.name

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-postgres-replica"
  })
}

# CLOUDWATCH LOG GROUPS
# CloudWatch log group for primary region
resource "aws_cloudwatch_log_group" "primary" {
  provider          = aws.us_east_1
  name              = "/aws/ec2/${var.project_name}-primary"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-log-group-primary"
  })
}

# CloudWatch log group for secondary region
resource "aws_cloudwatch_log_group" "secondary" {
  provider          = aws.us_west_2
  name              = "/aws/ec2/${var.project_name}-secondary"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-log-group-secondary"
  })
}

# CloudWatch log group for RDS
resource "aws_cloudwatch_log_group" "rds" {
  provider          = aws.us_east_1
  name              = "/aws/rds/instance/${aws_db_instance.primary.id}/postgresql"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-log-group"
  })
}

# ROUTE 53 HOSTED ZONE AND RECORDS
# Route 53 hosted zone
resource "random_id" "domain_suffix" {
  byte_length = 4
}
resource "aws_route53_zone" "main" {
  name = "${var.project_name}-${random_id.domain_suffix.hex}.internal"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-hosted-zone"
  })
}

# Route 53 health check for primary ALB
resource "aws_route53_health_check" "primary" {
  fqdn                            = aws_lb.primary.dns_name
  port                            = 80
  type                            = "HTTP"
  resource_path                   = "/"
  failure_threshold               = 3
  request_interval                = 30

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-health-check-primary"
  })
}

# Route 53 health check for secondary ALB
resource "aws_route53_health_check" "secondary" {
  fqdn                            = aws_lb.secondary.dns_name
  port                            = 80
  type                            = "HTTP"
  resource_path                   = "/"
  failure_threshold               = 3
  request_interval                = 30

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-health-check-secondary"
  })
}

# Route 53 record for primary region (primary)
resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${aws_route53_zone.main.name}"
  type    = "A"

  set_identifier = "primary"

  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}

# Route 53 record for secondary region (secondary)
resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${aws_route53_zone.main.name}"
  type    = "A"

  set_identifier = "secondary"

  failover_routing_policy {
    type = "SECONDARY"
  }

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}

# OUTPUTS
output "vpc_ids" {
  description = "VPC IDs for both regions"
  value = {
    primary   = aws_vpc.primary.id
    secondary = aws_vpc.secondary.id
  }
}

output "subnet_ids" {
  description = "Subnet IDs for both regions"
  value = {
    primary = {
      public  = aws_subnet.primary_public[*].id
      private = aws_subnet.primary_private[*].id
    }
    secondary = {
      public  = aws_subnet.secondary_public[*].id
      private = aws_subnet.secondary_private[*].id
    }
  }
}

output "vpc_peering_connection_id" {
  description = "VPC Peering Connection ID"
  value       = aws_vpc_peering_connection.primary_to_secondary.id
}

output "load_balancer_dns_names" {
  description = "DNS names of the load balancers"
  value = {
    primary   = aws_lb.primary.dns_name
    secondary = aws_lb.secondary.dns_name
  }
}

output "load_balancer_zone_ids" {
  description = "Zone IDs of the load balancers"
  value = {
    primary   = aws_lb.primary.zone_id
    secondary = aws_lb.secondary.zone_id
  }
}

output "autoscaling_group_names" {
  description = "Auto Scaling Group names"
  value = {
    primary   = aws_autoscaling_group.primary.name
    secondary = aws_autoscaling_group.secondary.name
  }
}

output "launch_template_ids" {
  description = "Launch Template IDs"
  value = {
    primary   = aws_launch_template.primary.id
    secondary = aws_launch_template.secondary.id
  }
}

output "ami_ids" {
  description = "AMI IDs used for EC2 instances"
  value = {
    primary   = data.aws_ami.amazon_linux_primary.id
    secondary = data.aws_ami.amazon_linux_secondary.id
  }
}

output "security_group_ids" {
  description = "Security Group IDs"
  value = {
    alb_primary     = aws_security_group.alb_primary.id
    alb_secondary   = aws_security_group.alb_secondary.id
    ec2_primary     = aws_security_group.ec2_primary.id
    ec2_secondary   = aws_security_group.ec2_secondary.id
    rds_primary     = aws_security_group.rds_primary.id
    rds_secondary   = aws_security_group.rds_secondary.id
  }
}

output "s3_bucket_names" {
  description = "S3 bucket names"
  value = {
    primary   = aws_s3_bucket.primary.bucket
    secondary = aws_s3_bucket.secondary.bucket
  }
}

output "s3_bucket_arns" {
  description = "S3 bucket ARNs"
  value = {
    primary   = aws_s3_bucket.primary.arn
    secondary = aws_s3_bucket.secondary.arn
  }
}

output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_distribution_domain_name" {
  description = "CloudFront Distribution Domain Name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "rds_instance_endpoints" {
  description = "RDS instance endpoints"
  value = {
    primary   = aws_db_instance.primary.endpoint
    secondary = aws_db_instance.secondary.endpoint
  }
}

output "rds_instance_identifiers" {
  description = "RDS instance identifiers"
  value = {
    primary   = aws_db_instance.primary.id
    secondary = aws_db_instance.secondary.id
  }
}

output "rds_master_username" {
  description = "RDS master username"
  value       = random_string.rds_master_username.result
}

output "iam_role_arn" {
  description = "IAM role ARN for EC2 instances"
  value       = aws_iam_role.ec2_role.arn
}

output "iam_instance_profile_name" {
  description = "IAM instance profile name"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "kms_key_ids" {
  description = "KMS Key IDs for S3 encryption"
  value = {
    primary   = aws_kms_key.s3_primary.id
    secondary = aws_kms_key.s3_secondary.id
  }
}

output "kms_key_arns" {
  description = "KMS Key ARNs for S3 encryption"
  value = {
    primary   = aws_kms_key.s3_primary.arn
    secondary = aws_kms_key.s3_secondary.arn
  }
}

output "cloudwatch_log_group_names" {
  description = "CloudWatch Log Group names"
  value = {
    primary   = aws_cloudwatch_log_group.primary.name
    secondary = aws_cloudwatch_log_group.secondary.name
    rds       = aws_cloudwatch_log_group.rds.name
  }
}

output "route53_zone_id" {
  description = "Route 53 Hosted Zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_zone_name" {
  description = "Route 53 Hosted Zone Name"
  value       = aws_route53_zone.main.name
}

output "route53_health_check_ids" {
  description = "Route 53 Health Check IDs"
  value = {
    primary   = aws_route53_health_check.primary.id
    secondary = aws_route53_health_check.secondary.id
  }
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value = {
    primary   = aws_nat_gateway.primary[*].id
    secondary = aws_nat_gateway.secondary[*].id
  }
}

output "elastic_ip_addresses" {
  description = "Elastic IP addresses for NAT Gateways"
  value = {
    primary   = aws_eip.primary_nat[*].public_ip
    secondary = aws_eip.secondary_nat[*].public_ip
  }
}

output "internet_gateway_ids" {
  description = "Internet Gateway IDs"
  value = {
    primary   = aws_internet_gateway.primary.id
    secondary = aws_internet_gateway.secondary.id
  }
}

output "target_group_arns" {
  description = "Target Group ARNs"
  value = {
    primary   = aws_lb_target_group.primary.arn
    secondary = aws_lb_target_group.secondary.arn
  }
}

output "application_url" {
  description = "Application URL with failover capability"
  value       = "http://app.${aws_route53_zone.main.name}"
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
provider "aws" {
  region = var.aws_region
}
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"
}
```
