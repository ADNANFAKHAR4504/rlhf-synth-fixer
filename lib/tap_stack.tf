# =============================================================================
# DATA SOURCES
# =============================================================================

# Get availability zones for primary region
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

# Get availability zones for secondary region
data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# Get latest Amazon Linux 2 AMI for primary region
data "aws_ami" "amazon_linux_primary" {
  provider    = aws.primary
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
data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.secondary
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

# =============================================================================
# LOCAL VALUES FOR CONSISTENT NAMING
# =============================================================================

locals {
  # Consistent naming convention
  name_prefix = "${var.project_name}-${var.environment}"

  # Common tags
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }

  # Environment-specific configurations
  environment_configs = {
    dev = {
      instance_type    = "t3.micro"
      min_size         = 1
      max_size         = 2
      desired_capacity = 1
    }
    staging = {
      instance_type    = "t3.small"
      min_size         = 1
      max_size         = 3
      desired_capacity = 2
    }
    prod = {
      instance_type    = "t3.medium"
      min_size         = 2
      max_size         = 6
      desired_capacity = 3
    }
  }

  # Get environment-specific config
  env_config = local.environment_configs[var.environment]
}

# =============================================================================
# VPC AND NETWORKING - PRIMARY REGION
# =============================================================================

# Primary VPC
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-vpc-primary"
    Region = var.primary_region
  })
}

# Internet Gateway - Primary
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-igw-primary"
    Region = var.primary_region
  })
}

# Public Subnets - Primary Region
resource "aws_subnet" "public_primary" {
  provider                = aws.primary
  count                   = 2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_primary, 8, count.index)
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-public-subnet-primary-${count.index + 1}"
    Region = var.primary_region
    Type   = "Public"
  })
}

# Private Subnets - Primary Region
resource "aws_subnet" "private_primary" {
  provider          = aws.primary
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_primary, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-private-subnet-primary-${count.index + 1}"
    Region = var.primary_region
    Type   = "Private"
  })
}

# Route Table - Primary Public
resource "aws_route_table" "public_primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-rt-public-primary"
    Region = var.primary_region
  })
}

# Route Table Associations - Primary Public
resource "aws_route_table_association" "public_primary" {
  provider       = aws.primary
  count          = length(aws_subnet.public_primary)
  subnet_id      = aws_subnet.public_primary[count.index].id
  route_table_id = aws_route_table.public_primary.id
}

# Elastic IPs for NAT Gateways - Primary
resource "aws_eip" "nat_primary" {
  provider = aws.primary
  count    = 2
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-eip-nat-primary-${count.index + 1}"
    Region = var.primary_region
  })

  depends_on = [aws_internet_gateway.primary]
}

# NAT Gateways - Primary
resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  count         = 2
  allocation_id = aws_eip.nat_primary[count.index].id
  subnet_id     = aws_subnet.public_primary[count.index].id

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-nat-primary-${count.index + 1}"
    Region = var.primary_region
  })

  depends_on = [aws_internet_gateway.primary]
}

# Route Tables - Primary Private
resource "aws_route_table" "private_primary" {
  provider = aws.primary
  count    = 2
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-rt-private-primary-${count.index + 1}"
    Region = var.primary_region
  })
}

# Route Table Associations - Primary Private
resource "aws_route_table_association" "private_primary" {
  provider       = aws.primary
  count          = length(aws_subnet.private_primary)
  subnet_id      = aws_subnet.private_primary[count.index].id
  route_table_id = aws_route_table.private_primary[count.index].id
}

# =============================================================================
# VPC AND NETWORKING - SECONDARY REGION
# =============================================================================

# Secondary VPC
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.vpc_cidr_secondary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-vpc-secondary"
    Region = var.secondary_region
  })
}

# Internet Gateway - Secondary
resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-igw-secondary"
    Region = var.secondary_region
  })
}

# Public Subnets - Secondary Region
resource "aws_subnet" "public_secondary" {
  provider                = aws.secondary
  count                   = 2
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_secondary, 8, count.index)
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-public-subnet-secondary-${count.index + 1}"
    Region = var.secondary_region
    Type   = "Public"
  })
}

# Private Subnets - Secondary Region
resource "aws_subnet" "private_secondary" {
  provider          = aws.secondary
  count             = 2
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_secondary, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-private-subnet-secondary-${count.index + 1}"
    Region = var.secondary_region
    Type   = "Private"
  })
}

# Route Table - Secondary Public
resource "aws_route_table" "public_secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-rt-public-secondary"
    Region = var.secondary_region
  })
}

# Route Table Associations - Secondary Public
resource "aws_route_table_association" "public_secondary" {
  provider       = aws.secondary
  count          = length(aws_subnet.public_secondary)
  subnet_id      = aws_subnet.public_secondary[count.index].id
  route_table_id = aws_route_table.public_secondary.id
}

# Elastic IPs for NAT Gateways - Secondary
resource "aws_eip" "nat_secondary" {
  provider = aws.secondary
  count    = 2
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-eip-nat-secondary-${count.index + 1}"
    Region = var.secondary_region
  })

  depends_on = [aws_internet_gateway.secondary]
}

# NAT Gateways - Secondary
resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  count         = 2
  allocation_id = aws_eip.nat_secondary[count.index].id
  subnet_id     = aws_subnet.public_secondary[count.index].id

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-nat-secondary-${count.index + 1}"
    Region = var.secondary_region
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Route Tables - Secondary Private
resource "aws_route_table" "private_secondary" {
  provider = aws.secondary
  count    = 2
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-rt-private-secondary-${count.index + 1}"
    Region = var.secondary_region
  })
}

# Route Table Associations - Secondary Private
resource "aws_route_table_association" "private_secondary" {
  provider       = aws.secondary
  count          = length(aws_subnet.private_secondary)
  subnet_id      = aws_subnet.private_secondary[count.index].id
  route_table_id = aws_route_table.private_secondary[count.index].id
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# Application Load Balancer Security Group - Primary
resource "aws_security_group" "alb_primary" {
  provider    = aws.primary
  name        = "${local.name_prefix}-alb-sg-primary"
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
    Name   = "${local.name_prefix}-alb-sg-primary"
    Region = var.primary_region
  })
}

# EC2 Security Group - Primary
resource "aws_security_group" "ec2_primary" {
  provider    = aws.primary
  name        = "${local.name_prefix}-ec2-sg-primary"
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
    cidr_blocks = [var.vpc_cidr_primary]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-ec2-sg-primary"
    Region = var.primary_region
  })
}

# Application Load Balancer Security Group - Secondary
resource "aws_security_group" "alb_secondary" {
  provider    = aws.secondary
  name        = "${local.name_prefix}-alb-sg-secondary"
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
    Name   = "${local.name_prefix}-alb-sg-secondary"
    Region = var.secondary_region
  })
}

# EC2 Security Group - Secondary
resource "aws_security_group" "ec2_secondary" {
  provider    = aws.secondary
  name        = "${local.name_prefix}-ec2-sg-secondary"
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
    cidr_blocks = [var.vpc_cidr_secondary]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-ec2-sg-secondary"
    Region = var.secondary_region
  })
}

# =============================================================================
# IAM ROLES AND POLICIES
# =============================================================================

# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = "${local.name_prefix}-ec2-role"

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

# EC2 Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# S3 Access Policy for EC2 instances
resource "aws_iam_role_policy" "s3_access" {
  name = "${local.name_prefix}-s3-access"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.primary.arn}/*",
          "${aws_s3_bucket.secondary.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          aws_s3_bucket.secondary.arn
        ]
      }
    ]
  })
}

# CloudWatch Logs Policy
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "${local.name_prefix}-cloudwatch-logs"
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
      }
    ]
  })
}

# Cross-account automation role (for CI/CD)
resource "aws_iam_role" "automation_role" {
  name = "${local.name_prefix}-automation-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${local.name_prefix}-automation"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

# Automation role policy with least privilege
resource "aws_iam_role_policy" "automation_policy" {
  name = "${local.name_prefix}-automation-policy"
  role = aws_iam_role.automation_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceStatus",
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:UpdateAutoScalingGroup",
          "elbv2:DescribeLoadBalancers",
          "elbv2:DescribeTargetHealth"
        ]
        Resource = "*"
      }
    ]
  })
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# =============================================================================
# S3 BUCKETS WITH CROSS-REGION REPLICATION
# =============================================================================

# Primary S3 Bucket
resource "aws_s3_bucket" "primary" {
  provider = aws.primary
  bucket   = "${local.name_prefix}-storage-primary-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-storage-primary"
    Region = var.primary_region
  })
}

# Secondary S3 Bucket (replica)
resource "aws_s3_bucket" "secondary" {
  provider = aws.secondary
  bucket   = "${local.name_prefix}-storage-secondary-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-storage-secondary"
    Region = var.secondary_region
  })
}

# Random ID for unique bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket Versioning - Primary
resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Versioning - Secondary
resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-side Encryption - Primary
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Server-side Encryption - Secondary
resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block - Primary
resource "aws_s3_bucket_public_access_block" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Public Access Block - Secondary
resource "aws_s3_bucket_public_access_block" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Replication Role
resource "aws_iam_role" "replication_role" {
  name = "${local.name_prefix}-s3-replication-role"

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

# S3 Replication Policy
resource "aws_iam_role_policy" "replication_policy" {
  name = "${local.name_prefix}-s3-replication-policy"
  role = aws_iam_role.replication_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Resource = "${aws_s3_bucket.secondary.arn}/*"
      }
    ]
  })
}

# S3 Cross-Region Replication Configuration
resource "aws_s3_bucket_replication_configuration" "replication" {
  provider   = aws.primary
  depends_on = [aws_s3_bucket_versioning.primary]

  role   = aws_iam_role.replication_role.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "${local.name_prefix}-replication-rule"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD_IA"
    }
  }
}

# =============================================================================
# APPLICATION LOAD BALANCERS
# =============================================================================

# Application Load Balancer - Primary Region
resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = "${local.name_prefix}-alb-primary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_primary.id]
  subnets            = aws_subnet.public_primary[*].id

  enable_deletion_protection = var.environment == "prod" ? true : false

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-alb-primary"
    Region = var.primary_region
  })
}

# Target Group - Primary Region
resource "aws_lb_target_group" "primary" {
  provider = aws.primary
  name     = "${local.name_prefix}-tg-primary"
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
    Name   = "${local.name_prefix}-tg-primary"
    Region = var.primary_region
  })
}

# Load Balancer Listener - Primary Region
resource "aws_lb_listener" "primary" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }
}

# Application Load Balancer - Secondary Region
resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = "${local.name_prefix}-alb-secondary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_secondary.id]
  subnets            = aws_subnet.public_secondary[*].id

  enable_deletion_protection = var.environment == "prod" ? true : false

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-alb-secondary"
    Region = var.secondary_region
  })
}

# Target Group - Secondary Region
resource "aws_lb_target_group" "secondary" {
  provider = aws.secondary
  name     = "${local.name_prefix}-tg-secondary"
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
    Name   = "${local.name_prefix}-tg-secondary"
    Region = var.secondary_region
  })
}

# Load Balancer Listener - Secondary Region
resource "aws_lb_listener" "secondary" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }
}

# =============================================================================
# EC2 LAUNCH TEMPLATES AND AUTO SCALING GROUPS
# =============================================================================

# Launch Template - Primary Region
resource "aws_launch_template" "primary" {
  provider      = aws.primary
  name          = "${local.name_prefix}-lt-primary"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = local.env_config.instance_type

  vpc_security_group_ids = [aws_security_group.ec2_primary.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment = var.environment
    region      = var.primary_region
    bucket_name = aws_s3_bucket.primary.bucket
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name   = "${local.name_prefix}-instance-primary"
      Region = var.primary_region
    })
  }

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-lt-primary"
    Region = var.primary_region
  })
}

# Auto Scaling Group - Primary Region
resource "aws_autoscaling_group" "primary" {
  provider                  = aws.primary
  name                      = "${local.name_prefix}-asg-primary"
  vpc_zone_identifier       = aws_subnet.private_primary[*].id
  target_group_arns         = [aws_lb_target_group.primary.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = local.env_config.min_size
  max_size         = local.env_config.max_size
  desired_capacity = local.env_config.desired_capacity

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-primary"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }
}

# Launch Template - Secondary Region
resource "aws_launch_template" "secondary" {
  provider      = aws.secondary
  name          = "${local.name_prefix}-lt-secondary"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = local.env_config.instance_type

  vpc_security_group_ids = [aws_security_group.ec2_secondary.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment = var.environment
    region      = var.secondary_region
    bucket_name = aws_s3_bucket.secondary.bucket
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name   = "${local.name_prefix}-instance-secondary"
      Region = var.secondary_region
    })
  }

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-lt-secondary"
    Region = var.secondary_region
  })
}

# Auto Scaling Group - Secondary Region
resource "aws_autoscaling_group" "secondary" {
  provider                  = aws.secondary
  name                      = "${local.name_prefix}-asg-secondary"
  vpc_zone_identifier       = aws_subnet.private_secondary[*].id
  target_group_arns         = [aws_lb_target_group.secondary.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = local.env_config.min_size
  max_size         = local.env_config.max_size
  desired_capacity = local.env_config.desired_capacity

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-secondary"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }
}
