# tap_stack.tf - Complete Infrastructure Stack Configuration

# ===========================
# VARIABLES
# ===========================

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "eu-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap"
}

variable "key_name" {
  description = "EC2 Key pair name"
  type        = string
  default     = "tap-keypair"
}

# ===========================
# LOCALS
# ===========================

locals {
  # Common tags for all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }

  # Resource naming convention with Byte4 suffix
  name_prefix = "${var.project_name}-${var.environment}"
  suffix      = "Byte4"

  # VPC Configuration
  primary_vpc_cidr   = "10.0.0.0/16"
  secondary_vpc_cidr = "10.1.0.0/16"

  # Subnet CIDR blocks for primary region
  primary_public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  primary_private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

  # Subnet CIDR blocks for secondary region
  secondary_public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
  secondary_private_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24"]

  # RDS Configuration
  db_instance_class = "db.t3.micro"
  db_engine        = "mysql"
  db_engine_version = "8.0"
  db_name          = "tapdb"
}

# ===========================
# DATA SOURCES
# ===========================

# Get availability zones for primary region
data "aws_availability_zones" "primary" {
  provider = aws.eu_east_1
  state    = "available"
}

# Get availability zones for secondary region
data "aws_availability_zones" "secondary" {
  provider = aws.eu_west_1
  state    = "available"
}

# Get latest Amazon Linux 2 AMI for primary region
data "aws_ami" "amazon_linux2_primary" {
  provider    = aws.eu_east_1
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

# Get latest Amazon Linux 2 AMI for secondary region
data "aws_ami" "amazon_linux2_secondary" {
  provider    = aws.eu_west_1
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

# ===========================
# RANDOM RESOURCES FOR RDS
# ===========================

# Generate random username for RDS (starts with letter, 8 chars, no special chars)
resource "random_string" "rds_username" {
  length  = 7
  special = false
  upper   = true
  lower   = true
  numeric = true
}

# Generate random password for RDS (16 chars with allowed special chars)
resource "random_password" "rds_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}:?"
}

# ===========================
# PRIMARY REGION RESOURCES
# ===========================

# --- VPC for Primary Region ---
resource "aws_vpc" "primary" {
  provider             = aws.eu_east_1
  cidr_block          = local.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-vpc-primary-${local.suffix}"
    Region = var.primary_region
  })
}

# --- Internet Gateway for Primary VPC ---
resource "aws_internet_gateway" "primary" {
  provider = aws.eu_east_1
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw-primary-${local.suffix}"
  })
}

# --- Public Subnets for Primary Region ---
resource "aws_subnet" "primary_public" {
  provider                = aws.eu_east_1
  count                   = length(local.primary_public_subnet_cidrs)
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}-primary-${local.suffix}"
    Type = "Public"
  })
}

# --- Private Subnets for Primary Region ---
resource "aws_subnet" "primary_private" {
  provider          = aws.eu_east_1
  count             = length(local.primary_private_subnet_cidrs)
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}-primary-${local.suffix}"
    Type = "Private"
  })
}

# --- Elastic IPs for NAT Gateways in Primary Region ---
resource "aws_eip" "primary_nat" {
  provider = aws.eu_east_1
  count    = 2
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eip-nat-${count.index + 1}-primary-${local.suffix}"
  })
}

# --- NAT Gateways for Primary Region ---
resource "aws_nat_gateway" "primary" {
  provider      = aws.eu_east_1
  count         = 2
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}-primary-${local.suffix}"
  })

  depends_on = [aws_internet_gateway.primary]
}

# --- Route Table for Public Subnets in Primary Region ---
resource "aws_route_table" "primary_public" {
  provider = aws.eu_east_1
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-public-primary-${local.suffix}"
  })
}

# --- Route Table for Private Subnets in Primary Region ---
resource "aws_route_table" "primary_private" {
  provider = aws.eu_east_1
  count    = 2
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-private-${count.index + 1}-primary-${local.suffix}"
  })
}

# --- Route Table Associations for Primary Region ---
resource "aws_route_table_association" "primary_public" {
  provider       = aws.eu_east_1
  count          = length(aws_subnet.primary_public)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  provider       = aws.eu_east_1
  count          = length(aws_subnet.primary_private)
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# --- Security Group for RDS in Primary Region ---
resource "aws_security_group" "rds_primary" {
  provider    = aws.eu_east_1
  name_prefix = "${local.name_prefix}-rds-sg-primary-"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 3306
    to_port     = 3306
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
    Name = "${local.name_prefix}-rds-sg-primary-${local.suffix}"
  })
}

# --- RDS Subnet Group for Primary Region ---
resource "aws_db_subnet_group" "primary" {
  provider    = aws.eu_east_1
  name        = "${local.name_prefix}-db-subnet-primary-${local.suffix}"
  subnet_ids  = aws_subnet.primary_private[*].id
  description = "Database subnet group for primary region"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-primary-${local.suffix}"
  })
}

# --- RDS Instance for Primary Region ---
resource "aws_db_instance" "primary" {
  provider                    = aws.eu_east_1
  identifier                  = "${local.name_prefix}-rds-primary-${local.suffix}"
  engine                      = local.db_engine
  engine_version              = local.db_engine_version
  instance_class              = local.db_instance_class
  allocated_storage          = 20
  storage_type               = "gp2"
  storage_encrypted          = true
  db_name                    = local.db_name
  username                   = "a${random_string.rds_username.result}"
  password                   = random_password.rds_password.result
  db_subnet_group_name       = aws_db_subnet_group.primary.name
  vpc_security_group_ids     = [aws_security_group.rds_primary.id]
  multi_az                   = true
  publicly_accessible        = false
  auto_minor_version_upgrade = true
  skip_final_snapshot        = true
  deletion_protection        = false
  backup_retention_period    = 7
  backup_window              = "03:00-04:00"
  maintenance_window         = "sun:04:00-sun:05:00"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-primary-${local.suffix}"
  })
}

# --- Secrets Manager for RDS Credentials in Primary Region ---
resource "aws_secretsmanager_secret" "rds_primary" {
  provider                = aws.eu_east_1
  name                    = "${local.name_prefix}-rds-secret-primary-${local.suffix}"
  description             = "RDS master credentials for primary region"
  recovery_window_in_days = 0

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-secret-primary-${local.suffix}"
  })
}

resource "aws_secretsmanager_secret_version" "rds_primary" {
  provider  = aws.eu_east_1
  secret_id = aws_secretsmanager_secret.rds_primary.id
  secret_string = jsonencode({
    username = "a${random_string.rds_username.result}"
    password = random_password.rds_password.result
    engine   = local.db_engine
    host     = aws_db_instance.primary.endpoint
    port     = 3306
    dbname   = local.db_name
  })
}

# --- S3 Bucket for Primary Region ---
resource "aws_s3_bucket" "primary" {
  provider = aws.eu_east_1
  bucket   = "${local.name_prefix}-s3-primary-${local.suffix}-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-primary-${local.suffix}"
  })
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
  numeric = true
}

resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.eu_east_1
  bucket   = aws_s3_bucket.primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.eu_east_1
  bucket   = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "primary" {
  provider                = aws.eu_east_1
  bucket                  = aws_s3_bucket.primary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- IAM Role for EC2 Instances in Primary Region ---
resource "aws_iam_role" "ec2_primary" {
  provider = aws.eu_east_1
  name     = "${local.name_prefix}-ec2-role-primary-${local.suffix}"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-role-primary-${local.suffix}"
  })
}

# --- IAM Policy for EC2 Instances in Primary Region ---
resource "aws_iam_role_policy" "ec2_primary" {
  provider = aws.eu_east_1
  name     = "${local.name_prefix}-ec2-policy-primary-${local.suffix}"
  role     = aws_iam_role.ec2_primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.rds_primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_primary" {
  provider = aws.eu_east_1
  name     = "${local.name_prefix}-ec2-profile-primary-${local.suffix}"
  role     = aws_iam_role.ec2_primary.name
}

# --- Security Group for ALB in Primary Region ---
resource "aws_security_group" "alb_primary" {
  provider    = aws.eu_east_1
  name_prefix = "${local.name_prefix}-alb-sg-primary-"
  description = "Security group for Application Load Balancer"
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
    Name = "${local.name_prefix}-alb-sg-primary-${local.suffix}"
  })
}

# --- Security Group for EC2 Instances in Primary Region ---
resource "aws_security_group" "ec2_primary" {
  provider    = aws.eu_east_1
  name_prefix = "${local.name_prefix}-ec2-sg-primary-"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_primary.id]
  }

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_primary.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-sg-primary-${local.suffix}"
  })
}

# --- Application Load Balancer for Primary Region ---
resource "aws_lb" "primary" {
  provider           = aws.eu_east_1
  name               = "${local.name_prefix}-alb-primary-${local.suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_primary.id]
  subnets           = aws_subnet.primary_public[*].id

  enable_deletion_protection = false
  enable_http2              = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-primary-${local.suffix}"
  })
}

# --- Target Group for ALB in Primary Region ---
resource "aws_lb_target_group" "primary" {
  provider    = aws.eu_east_1
  name        = "${local.name_prefix}-tg-primary-${local.suffix}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.primary.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    path                = "/"
    interval            = 30
    matcher             = "200"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tg-primary-${local.suffix}"
  })
}

# --- ALB Listener for Primary Region ---
resource "aws_lb_listener" "primary" {
  provider          = aws.eu_east_1
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }
}

# --- Launch Template for EC2 Instances in Primary Region ---
resource "aws_launch_template" "primary" {
  provider               = aws.eu_east_1
  name_prefix           = "${local.name_prefix}-lt-primary-"
  image_id              = data.aws_ami.amazon_linux2_primary.id
  instance_type         = "t3.micro"
  vpc_security_group_ids = [aws_security_group.ec2_primary.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_primary.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Instance in Primary Region</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-ec2-primary-${local.suffix}"
    })
  }
}

# --- Auto Scaling Group for Primary Region ---
resource "aws_autoscaling_group" "primary" {
  provider            = aws.eu_east_1
  name                = "${local.name_prefix}-asg-primary-${local.suffix}"
  min_size            = 2
  max_size            = 4
  desired_capacity    = 2
  vpc_zone_identifier = aws_subnet.primary_private[*].id
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-instance-primary-${local.suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# --- Auto Scaling Policies for Primary Region ---
resource "aws_autoscaling_policy" "scale_up_primary" {
  provider               = aws.eu_east_1
  name                   = "${local.name_prefix}-scale-up-primary-${local.suffix}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

resource "aws_autoscaling_policy" "scale_down_primary" {
  provider               = aws.eu_east_1
  name                   = "${local.name_prefix}-scale-down-primary-${local.suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

# ===========================
# SECONDARY REGION RESOURCES
# ===========================

# --- VPC for Secondary Region ---
resource "aws_vpc" "secondary" {
  provider             = aws.eu_west_1
  cidr_block          = local.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-vpc-secondary-${local.suffix}"
    Region = var.secondary_region
  })
}

# --- Internet Gateway for Secondary VPC ---
resource "aws_internet_gateway" "secondary" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw-secondary-${local.suffix}"
  })
}

# --- Public Subnets for Secondary Region ---
resource "aws_subnet" "secondary_public" {
  provider                = aws.eu_west_1
  count                   = length(local.secondary_public_subnet_cidrs)
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}-secondary-${local.suffix}"
    Type = "Public"
  })
}

# --- Private Subnets for Secondary Region ---
resource "aws_subnet" "secondary_private" {
  provider          = aws.eu_west_1
  count             = length(local.secondary_private_subnet_cidrs)
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}-secondary-${local.suffix}"
    Type = "Private"
  })
}

# --- Elastic IPs for NAT Gateways in Secondary Region ---
resource "aws_eip" "secondary_nat" {
  provider = aws.eu_west_1
  count    = 2
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eip-nat-${count.index + 1}-secondary-${local.suffix}"
  })
}

# --- NAT Gateways for Secondary Region ---
resource "aws_nat_gateway" "secondary" {
  provider      = aws.eu_west_1
  count         = 2
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}-secondary-${local.suffix}"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# --- Route Table for Public Subnets in Secondary Region ---
resource "aws_route_table" "secondary_public" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-public-secondary-${local.suffix}"
  })
}

# --- Route Table for Private Subnets in Secondary Region ---
resource "aws_route_table" "secondary_private" {
  provider = aws.eu_west_1
  count    = 2
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-private-${count.index + 1}-secondary-${local.suffix}"
  })
}

# --- Route Table Associations for Secondary Region ---
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.eu_west_1
  count          = length(aws_subnet.secondary_public)
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table_association" "secondary_private" {
  provider       = aws.eu_west_1
  count          = length(aws_subnet.secondary_private)
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# --- Security Group for RDS in Secondary Region ---
resource "aws_security_group" "rds_secondary" {
  provider    = aws.eu_west_1
  name_prefix = "${local.name_prefix}-rds-sg-secondary-"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 3306
    to_port     = 3306
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
    Name = "${local.name_prefix}-rds-sg-secondary-${local.suffix}"
  })
}

# --- RDS Subnet Group for Secondary Region ---
resource "aws_db_subnet_group" "secondary" {
  provider    = aws.eu_west_1
  name        = "${local.name_prefix}-db-subnet-secondary-${local.suffix}"
  subnet_ids  = aws_subnet.secondary_private[*].id
  description = "Database subnet group for secondary region"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-secondary-${local.suffix}"
  })
}

# --- RDS Instance for Secondary Region ---
resource "aws_db_instance" "secondary" {
  provider                    = aws.eu_west_1
  identifier                  = "${local.name_prefix}-rds-secondary-${local.suffix}"
  engine                      = local.db_engine
  engine_version              = local.db_engine_version
  instance_class              = local.db_instance_class
  allocated_storage          = 20
  storage_type               = "gp2"
  storage_encrypted          = true
  db_name                    = local.db_name
  username                   = "a${random_string.rds_username.result}"
  password                   = random_password.rds_password.result
  db_subnet_group_name       = aws_db_subnet_group.secondary.name
  vpc_security_group_ids     = [aws_security_group.rds_secondary.id]
  multi_az                   = true
  publicly_accessible        = false
  auto_minor_version_upgrade = true
  skip_final_snapshot        = true
  deletion_protection        = false
  backup_retention_period    = 7
  backup_window              = "03:00-04:00"
  maintenance_window         = "sun:04:00-sun:05:00"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-secondary-${local.suffix}"
  })
}

# --- Secrets Manager for RDS Credentials in Secondary Region ---
resource "aws_secretsmanager_secret" "rds_secondary" {
  provider                = aws.eu_west_1
  name                    = "${local.name_prefix}-rds-secret-secondary-${local.suffix}"
  description             = "RDS master credentials for secondary region"
  recovery_window_in_days = 0

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-secret-secondary-${local.suffix}"
  })
}

resource "aws_secretsmanager_secret_version" "rds_secondary" {
  provider  = aws.eu_west_1
  secret_id = aws_secretsmanager_secret.rds_secondary.id
  secret_string = jsonencode({
    username = "a${random_string.rds_username.result}"
    password = random_password.rds_password.result
    engine   = local.db_engine
    host     = aws_db_instance.secondary.endpoint
    port     = 3306
    dbname   = local.db_name
  })
}

# --- S3 Bucket for Secondary Region ---
resource "aws_s3_bucket" "secondary" {
  provider = aws.eu_west_1
  bucket   = "${local.name_prefix}-s3-secondary-${local.suffix}-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-secondary-${local.suffix}"
  })
}

resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.secondary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "secondary" {
  provider                = aws.eu_west_1
  bucket                  = aws_s3_bucket.secondary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- IAM Role for EC2 Instances in Secondary Region ---
resource "aws_iam_role" "ec2_secondary" {
  provider = aws.eu_west_1
  name     = "${local.name_prefix}-ec2-role-secondary-${local.suffix}"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-role-secondary-${local.suffix}"
  })
}

# --- IAM Policy for EC2 Instances in Secondary Region ---
resource "aws_iam_role_policy" "ec2_secondary" {
  provider = aws.eu_west_1
  name     = "${local.name_prefix}-ec2-policy-secondary-${local.suffix}"
  role     = aws_iam_role.ec2_secondary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.secondary.arn,
          "${aws_s3_bucket.secondary.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.rds_secondary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_secondary" {
  provider = aws.eu_west_1
  name     = "${local.name_prefix}-ec2-profile-secondary-${local.suffix}"
  role     = aws_iam_role.ec2_secondary.name
}

# --- Security Group for ALB in Secondary Region ---
resource "aws_security_group" "alb_secondary" {
  provider    = aws.eu_west_1
  name_prefix = "${local.name_prefix}-alb-sg-secondary-"
  description = "Security group for Application Load Balancer"
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
    Name = "${local.name_prefix}-alb-sg-secondary-${local.suffix}"
  })
}

# --- Security Group for EC2 Instances in Secondary Region ---
resource "aws_security_group" "ec2_secondary" {
  provider    = aws.eu_west_1
  name_prefix = "${local.name_prefix}-ec2-sg-secondary-"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_secondary.id]
  }

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_secondary.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-sg-secondary-${local.suffix}"
  })
}

# --- Application Load Balancer for Secondary Region ---
resource "aws_lb" "secondary" {
  provider           = aws.eu_west_1
  name               = "${local.name_prefix}-alb-secondary-${local.suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_secondary.id]
  subnets           = aws_subnet.secondary_public[*].id

  enable_deletion_protection = false
  enable_http2              = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-secondary-${local.suffix}"
  })
}

# --- Target Group for ALB in Secondary Region ---
resource "aws_lb_target_group" "secondary" {
  provider    = aws.eu_west_1
  name        = "${local.name_prefix}-tg-secondary-${local.suffix}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.secondary.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    path                = "/"
    interval            = 30
    matcher             = "200"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tg-secondary-${local.suffix}"
  })
}

# --- ALB Listener for Secondary Region ---
resource "aws_lb_listener" "secondary" {
  provider          = aws.eu_west_1
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }
}

# --- Launch Template for EC2 Instances in Secondary Region ---
resource "aws_launch_template" "secondary" {
  provider               = aws.eu_west_1
  name_prefix           = "${local.name_prefix}-lt-secondary-"
  image_id              = data.aws_ami.amazon_linux2_secondary.id
  instance_type         = "t3.micro"
  vpc_security_group_ids = [aws_security_group.ec2_secondary.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_secondary.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Instance in Secondary Region</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-ec2-secondary-${local.suffix}"
    })
  }
}

# --- Auto Scaling Group for Secondary Region ---
resource "aws_autoscaling_group" "secondary" {
  provider            = aws.eu_west_1
  name                = "${local.name_prefix}-asg-secondary-${local.suffix}"
  min_size            = 2
  max_size            = 4
  desired_capacity    = 2
  vpc_zone_identifier = aws_subnet.secondary_private[*].id
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-instance-secondary-${local.suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# --- Auto Scaling Policies for Secondary Region ---
resource "aws_autoscaling_policy" "scale_up_secondary" {
  provider               = aws.eu_west_1
  name                   = "${local.name_prefix}-scale-up-secondary-${local.suffix}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

resource "aws_autoscaling_policy" "scale_down_secondary" {
  provider               = aws.eu_west_1
  name                   = "${local.name_prefix}-scale-down-secondary-${local.suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

# ===========================
# S3 BUCKET REPLICATION
# ===========================

# --- Replication IAM Role ---
resource "aws_iam_role" "replication" {
  provider = aws.eu_east_1
  name     = "${local.name_prefix}-s3-replication-role-${local.suffix}"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-replication-role-${local.suffix}"
  })
}

# --- Replication IAM Policy ---
resource "aws_iam_role_policy" "replication" {
  provider = aws.eu_east_1
  name     = "${local.name_prefix}-s3-replication-policy-${local.suffix}"
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
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Effect = "Allow"
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Effect = "Allow"
        Resource = "${aws_s3_bucket.secondary.arn}/*"
      }
    ]
  })
}

# --- S3 Bucket Replication Configuration ---
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider = aws.eu_east_1
  role     = aws_iam_role.replication.arn
  bucket   = aws_s3_bucket.primary.id

  rule {
    id     = "replicate-all-objects"
    status = "Enabled"

    filter {}

    delete_marker_replication {
      status = "Enabled"
    }

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD_IA"
    }
  }

  depends_on = [
    aws_s3_bucket_versioning.primary,
    aws_s3_bucket_versioning.secondary
  ]
}

# ===========================
# OUTPUTS
# ===========================

# --- VPC Outputs ---
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

# --- Subnet Outputs ---
output "primary_public_subnet_ids" {
  description = "IDs of the public subnets in primary region"
  value       = aws_subnet.primary_public[*].id
}

output "primary_private_subnet_ids" {
  description = "IDs of the private subnets in primary region"
  value       = aws_subnet.primary_private[*].id
}

output "secondary_public_subnet_ids" {
  description = "IDs of the public subnets in secondary region"
  value       = aws_subnet.secondary_public[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of the private subnets in secondary region"
  value       = aws_subnet.secondary_private[*].id
}

# --- RDS Outputs ---
output "primary_rds_endpoint" {
  description = "Endpoint of the primary RDS instance"
  value       = aws_db_instance.primary.endpoint
}

output "secondary_rds_endpoint" {
  description = "Endpoint of the secondary RDS instance"
  value       = aws_db_instance.secondary.endpoint
}

output "primary_rds_instance_id" {
  description = "ID of the primary RDS instance"
  value       = aws_db_instance.primary.id
}

output "secondary_rds_instance_id" {
  description = "ID of the secondary RDS instance"
  value       = aws_db_instance.secondary.id
}

# --- S3 Outputs ---
output "primary_s3_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.id
}

output "secondary_s3_bucket_name" {
  description = "Name of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.id
}

output "primary_s3_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary.arn
}

output "secondary_s3_bucket_arn" {
  description = "ARN of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.arn
}

# --- Load Balancer Outputs ---
output "primary_alb_dns_name" {
  description = "DNS name of the primary Application Load Balancer"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary Application Load Balancer"
  value       = aws_lb.secondary.dns_name
}

output "primary_alb_arn" {
  description = "ARN of the primary Application Load Balancer"
  value       = aws_lb.primary.arn
}

output "secondary_alb_arn" {
  description = "ARN of the secondary Application Load Balancer"
  value       = aws_lb.secondary.arn
}

# --- Auto Scaling Group Outputs ---
output "primary_asg_name" {
  description = "Name of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.name
}

output "secondary_asg_name" {
  description = "Name of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.name
}

output "primary_asg_arn" {
  description = "ARN of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.arn
}

output "secondary_asg_arn" {
  description = "ARN of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.arn
}

# --- IAM Role Outputs ---
output "primary_ec2_iam_role_arn" {
  description = "ARN of the primary EC2 IAM role"
  value       = aws_iam_role.ec2_primary.arn
}

output "secondary_ec2_iam_role_arn" {
  description = "ARN of the secondary EC2 IAM role"
  value       = aws_iam_role.ec2_secondary.arn
}

output "primary_ec2_instance_profile_name" {
  description = "Name of the primary EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_primary.name
}

output "secondary_ec2_instance_profile_name" {
  description = "Name of the secondary EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_secondary.name
}

output "s3_replication_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.replication.arn
}

# --- Security Group Outputs ---
output "primary_alb_security_group_id" {
  description = "ID of the primary ALB security group"
  value       = aws_security_group.alb_primary.id
}

output "secondary_alb_security_group_id" {
  description = "ID of the secondary ALB security group"
  value       = aws_security_group.alb_secondary.id
}

output "primary_ec2_security_group_id" {
  description = "ID of the primary EC2 security group"
  value       = aws_security_group.ec2_primary.id
}

output "secondary_ec2_security_group_id" {
  description = "ID of the secondary EC2 security group"
  value       = aws_security_group.ec2_secondary.id
}

output "primary_rds_security_group_id" {
  description = "ID of the primary RDS security group"
  value       = aws_security_group.rds_primary.id
}

output "secondary_rds_security_group_id" {
  description = "ID of the secondary RDS security group"
  value       = aws_security_group.rds_secondary.id
}

# --- Secrets Manager Outputs ---
output "primary_rds_secret_arn" {
  description = "ARN of the primary RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_primary.arn
}

output "secondary_rds_secret_arn" {
  description = "ARN of the secondary RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_secondary.arn
}

# --- Launch Template Outputs ---
output "primary_launch_template_id" {
  description = "ID of the primary launch template"
  value       = aws_launch_template.primary.id
}

output "secondary_launch_template_id" {
  description = "ID of the secondary launch template"
  value       = aws_launch_template.secondary.id
}

# --- AMI Outputs ---
output "primary_ami_id" {
  description = "ID of the Amazon Linux 2 AMI used in primary region"
  value       = data.aws_ami.amazon_linux2_primary.id
}

output "secondary_ami_id" {
  description = "ID of the Amazon Linux 2 AMI used in secondary region"
  value       = data.aws_ami.amazon_linux2_secondary.id
}

# --- NAT Gateway Outputs ---
output "primary_nat_gateway_ids" {
  description = "IDs of the NAT gateways in primary region"
  value       = aws_nat_gateway.primary[*].id
}

output "secondary_nat_gateway_ids" {
  description = "IDs of the NAT gateways in secondary region"
  value       = aws_nat_gateway.secondary[*].id
}

# --- Internet Gateway Outputs ---
output "primary_internet_gateway_id" {
  description = "ID of the Internet Gateway in primary region"
  value       = aws_internet_gateway.primary.id
}

output "secondary_internet_gateway_id" {
  description = "ID of the Internet Gateway in secondary region"
  value       = aws_internet_gateway.secondary.id
}

# --- Target Group Outputs ---
output "primary_target_group_arn" {
  description = "ARN of the primary target group"
  value       = aws_lb_target_group.primary.arn
}

output "secondary_target_group_arn" {
  description = "ARN of the secondary target group"
  value       = aws_lb_target_group.secondary.arn
}
