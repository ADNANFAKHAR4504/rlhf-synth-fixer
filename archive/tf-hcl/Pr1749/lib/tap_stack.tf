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
        Resource = [
          "arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:log-group:${local.name_prefix}-*",
          "arn:aws:logs:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:log-group:${local.name_prefix}-*"
        ]
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
          "ec2:DescribeInstanceStatus"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:ResourceTag/Environment" = var.environment
            "aws:ResourceTag/Project"     = var.project_name
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:UpdateAutoScalingGroup"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:ResourceTag/Environment" = var.environment
            "aws:ResourceTag/Project"     = var.project_name
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elbv2:DescribeLoadBalancers",
          "elbv2:DescribeTargetHealth"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:ResourceTag/Environment" = var.environment
            "aws:ResourceTag/Project"     = var.project_name
          }
        }
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

  force_destroy = true

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-storage-primary"
    Region = var.primary_region
  })
}

# Secondary S3 Bucket (replica)
resource "aws_s3_bucket" "secondary" {
  provider = aws.secondary
  bucket   = "${local.name_prefix}-storage-secondary-${random_id.bucket_suffix.hex}"

  force_destroy = true

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
  provider = aws.primary
  depends_on = [
    aws_s3_bucket_versioning.primary,
    aws_s3_bucket_versioning.secondary
  ]

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

  user_data = base64encode(<<-EOF
    #!/bin/bash
    
    # Bootstrap script for EC2 instances
    # This script is executed when EC2 instances are launched
    
    set -e
    
    # Variables from Terraform
    ENVIRONMENT="${var.environment}"
    REGION="${var.primary_region}"
    BUCKET_NAME="${aws_s3_bucket.primary.bucket}"
    
    # System updates and basic packages
    yum update -y
    yum install -y httpd aws-cli htop
    
    # Install CloudWatch agent
    wget https://amazoncloudwatch-agent.s3.amazonaws.com/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Configure CloudWatch agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CWEOF'
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/httpd/access_log",
                "log_group_name": "tap-${var.environment}-httpd-access",
                "log_stream_name": "{instance_id}",
                "retention_in_days": 7
              },
              {
                "file_path": "/var/log/httpd/error_log",
                "log_group_name": "tap-${var.environment}-httpd-error",
                "log_stream_name": "{instance_id}",
                "retention_in_days": 7
              }
            ]
          }
        }
      },
      "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              "cpu_usage_idle",
              "cpu_usage_iowait",
              "cpu_usage_user",
              "cpu_usage_system"
            ],
            "metrics_collection_interval": 60
          },
          "disk": {
            "measurement": [
              "used_percent"
            ],
            "metrics_collection_interval": 60,
            "resources": [
              "*"
            ]
          },
          "mem": {
            "measurement": [
              "mem_used_percent"
            ],
            "metrics_collection_interval": 60
          }
        }
      }
    }
CWEOF
    
    # Create a simple index.html page
    mkdir -p /var/www/html
    cat > /var/www/html/index.html << 'HTMLEOF'
    <!DOCTYPE html>
    <html>
    <head>
        <title>TAP Application - ${var.environment}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { color: #333; border-bottom: 2px solid #007EC7; padding-bottom: 10px; }
            .info { background: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 4px solid #007EC7; }
            .status { color: #28a745; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="header">TAP Application</h1>
            <div class="info">
                <h3>Instance Information</h3>
                <p><strong>Environment:</strong> ${var.environment}</p>
                <p><strong>Region:</strong> ${var.primary_region}</p>
                <p><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></p>
                <p><strong>Availability Zone:</strong> <span id="az">Loading...</span></p>
                <p><strong>Private IP:</strong> <span id="private-ip">Loading...</span></p>
                <p><strong>S3 Bucket:</strong> ${aws_s3_bucket.primary.bucket}</p>
                <p><strong>Status:</strong> <span class="status">Running</span></p>
            </div>
            
            <h3>Health Check</h3>
            <p>This instance is healthy and ready to serve traffic.</p>
            
            <h3>Features</h3>
            <ul>
                <li>Multi-region deployment</li>
                <li>Auto Scaling Group management</li>
                <li>Load Balancer integration</li>
                <li>S3 cross-region replication</li>
                <li>CloudWatch monitoring</li>
            </ul>
        </div>
        
        <script>
            // Fetch instance metadata
            fetch('http://169.254.169.254/latest/meta-data/instance-id')
                .then(response => response.text())
                .then(data => document.getElementById('instance-id').textContent = data)
                .catch(error => document.getElementById('instance-id').textContent = 'Unable to fetch');
                
            fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone')
                .then(response => response.text())
                .then(data => document.getElementById('az').textContent = data)
                .catch(error => document.getElementById('az').textContent = 'Unable to fetch');
                
            fetch('http://169.254.169.254/latest/meta-data/local-ipv4')
                .then(response => response.text())
                .then(data => document.getElementById('private-ip').textContent = data)
                .catch(error => document.getElementById('private-ip').textContent = 'Unable to fetch');
        </script>
    </body>
    </html>
HTMLEOF
    
    # Create a health check endpoint
    cat > /var/www/html/health << 'HEALTHEOF'
    OK
HEALTHEOF
    
    # Configure httpd
    systemctl start httpd
    systemctl enable httpd
    
    # Configure CloudWatch agent and start it
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
        -a fetch-config \
        -m ec2 \
        -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
        -s
    
    # Log successful completion
    echo "$(date): User data script completed successfully" >> /var/log/user-data.log
    echo "Environment: $ENVIRONMENT" >> /var/log/user-data.log
    echo "Region: $REGION" >> /var/log/user-data.log
    echo "Bucket: $BUCKET_NAME" >> /var/log/user-data.log
    
    # Create a test file in S3 bucket
    echo "Hello from instance $(curl -s http://169.254.169.254/latest/meta-data/instance-id) in $REGION" > /tmp/instance-info.txt
    aws s3 cp /tmp/instance-info.txt s3://$BUCKET_NAME/instances/$(curl -s http://169.254.169.254/latest/meta-data/instance-id).txt || echo "Failed to upload to S3"
    
    # Signal that the instance is ready
    /opt/aws/bin/cfn-signal -e $? --stack $ENVIRONMENT --resource AutoScalingGroup --region $REGION || echo "CFN signal not available"
  EOF
  )

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

  user_data = base64encode(<<-EOF
    #!/bin/bash
    
    # Bootstrap script for EC2 instances
    # This script is executed when EC2 instances are launched
    
    set -e
    
    # Variables from Terraform
    ENVIRONMENT="${var.environment}"
    REGION="${var.secondary_region}"
    BUCKET_NAME="${aws_s3_bucket.secondary.bucket}"
    
    # System updates and basic packages
    yum update -y
    yum install -y httpd aws-cli htop
    
    # Install CloudWatch agent
    wget https://amazoncloudwatch-agent.s3.amazonaws.com/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Configure CloudWatch agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CWEOF'
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/httpd/access_log",
                "log_group_name": "tap-${var.environment}-httpd-access",
                "log_stream_name": "{instance_id}",
                "retention_in_days": 7
              },
              {
                "file_path": "/var/log/httpd/error_log",
                "log_group_name": "tap-${var.environment}-httpd-error",
                "log_stream_name": "{instance_id}",
                "retention_in_days": 7
              }
            ]
          }
        }
      },
      "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              "cpu_usage_idle",
              "cpu_usage_iowait",
              "cpu_usage_user",
              "cpu_usage_system"
            ],
            "metrics_collection_interval": 60
          },
          "disk": {
            "measurement": [
              "used_percent"
            ],
            "metrics_collection_interval": 60,
            "resources": [
              "*"
            ]
          },
          "mem": {
            "measurement": [
              "mem_used_percent"
            ],
            "metrics_collection_interval": 60
          }
        }
      }
    }
CWEOF
    
    # Create a simple index.html page
    mkdir -p /var/www/html
    cat > /var/www/html/index.html << 'HTMLEOF'
    <!DOCTYPE html>
    <html>
    <head>
        <title>TAP Application - ${var.environment}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { color: #333; border-bottom: 2px solid #007EC7; padding-bottom: 10px; }
            .info { background: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 4px solid #007EC7; }
            .status { color: #28a745; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="header">TAP Application</h1>
            <div class="info">
                <h3>Instance Information</h3>
                <p><strong>Environment:</strong> ${var.environment}</p>
                <p><strong>Region:</strong> ${var.secondary_region}</p>
                <p><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></p>
                <p><strong>Availability Zone:</strong> <span id="az">Loading...</span></p>
                <p><strong>Private IP:</strong> <span id="private-ip">Loading...</span></p>
                <p><strong>S3 Bucket:</strong> ${aws_s3_bucket.secondary.bucket}</p>
                <p><strong>Status:</strong> <span class="status">Running</span></p>
            </div>
            
            <h3>Health Check</h3>
            <p>This instance is healthy and ready to serve traffic.</p>
            
            <h3>Features</h3>
            <ul>
                <li>Multi-region deployment</li>
                <li>Auto Scaling Group management</li>
                <li>Load Balancer integration</li>
                <li>S3 cross-region replication</li>
                <li>CloudWatch monitoring</li>
            </ul>
        </div>
        
        <script>
            // Fetch instance metadata
            fetch('http://169.254.169.254/latest/meta-data/instance-id')
                .then(response => response.text())
                .then(data => document.getElementById('instance-id').textContent = data)
                .catch(error => document.getElementById('instance-id').textContent = 'Unable to fetch');
                
            fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone')
                .then(response => response.text())
                .then(data => document.getElementById('az').textContent = data)
                .catch(error => document.getElementById('az').textContent = 'Unable to fetch');
                
            fetch('http://169.254.169.254/latest/meta-data/local-ipv4')
                .then(response => response.text())
                .then(data => document.getElementById('private-ip').textContent = data)
                .catch(error => document.getElementById('private-ip').textContent = 'Unable to fetch');
        </script>
    </body>
    </html>
HTMLEOF
    
    # Create a health check endpoint
    cat > /var/www/html/health << 'HEALTHEOF'
    OK
HEALTHEOF
    
    # Configure httpd
    systemctl start httpd
    systemctl enable httpd
    
    # Configure CloudWatch agent and start it
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
        -a fetch-config \
        -m ec2 \
        -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
        -s
    
    # Log successful completion
    echo "$(date): User data script completed successfully" >> /var/log/user-data.log
    echo "Environment: $ENVIRONMENT" >> /var/log/user-data.log
    echo "Region: $REGION" >> /var/log/user-data.log
    echo "Bucket: $BUCKET_NAME" >> /var/log/user-data.log
    
    # Create a test file in S3 bucket
    echo "Hello from instance $(curl -s http://169.254.169.254/latest/meta-data/instance-id) in $REGION" > /tmp/instance-info.txt
    aws s3 cp /tmp/instance-info.txt s3://$BUCKET_NAME/instances/$(curl -s http://169.254.169.254/latest/meta-data/instance-id).txt || echo "Failed to upload to S3"
    
    # Signal that the instance is ready
    /opt/aws/bin/cfn-signal -e $? --stack $ENVIRONMENT --resource AutoScalingGroup --region $REGION || echo "CFN signal not available"
  EOF
  )

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

# =============================================================================
# TERRAFORM OUTPUTS
# =============================================================================

# =============================================================================
# VPC AND NETWORKING OUTPUTS
# =============================================================================

output "vpc_primary_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "vpc_primary_cidr" {
  description = "CIDR block of the primary VPC"
  value       = aws_vpc.primary.cidr_block
}

output "vpc_secondary_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

output "vpc_secondary_cidr" {
  description = "CIDR block of the secondary VPC"
  value       = aws_vpc.secondary.cidr_block
}

output "public_subnet_primary_ids" {
  description = "IDs of the primary region public subnets"
  value       = aws_subnet.public_primary[*].id
}

output "private_subnet_primary_ids" {
  description = "IDs of the primary region private subnets"
  value       = aws_subnet.private_primary[*].id
}

output "public_subnet_secondary_ids" {
  description = "IDs of the secondary region public subnets"
  value       = aws_subnet.public_secondary[*].id
}

output "private_subnet_secondary_ids" {
  description = "IDs of the secondary region private subnets"
  value       = aws_subnet.private_secondary[*].id
}

output "internet_gateway_primary_id" {
  description = "ID of the primary region internet gateway"
  value       = aws_internet_gateway.primary.id
}

output "internet_gateway_secondary_id" {
  description = "ID of the secondary region internet gateway"
  value       = aws_internet_gateway.secondary.id
}

output "nat_gateway_primary_ids" {
  description = "IDs of the primary region NAT gateways"
  value       = aws_nat_gateway.primary[*].id
}

output "nat_gateway_secondary_ids" {
  description = "IDs of the secondary region NAT gateways"
  value       = aws_nat_gateway.secondary[*].id
}

output "nat_gateway_primary_ips" {
  description = "Public IPs of the primary region NAT gateways"
  value       = aws_eip.nat_primary[*].public_ip
}

output "nat_gateway_secondary_ips" {
  description = "Public IPs of the secondary region NAT gateways"
  value       = aws_eip.nat_secondary[*].public_ip
}

# =============================================================================
# SECURITY GROUP OUTPUTS
# =============================================================================

output "alb_security_group_primary_id" {
  description = "ID of the primary ALB security group"
  value       = aws_security_group.alb_primary.id
}

output "ec2_security_group_primary_id" {
  description = "ID of the primary EC2 security group"
  value       = aws_security_group.ec2_primary.id
}

output "alb_security_group_secondary_id" {
  description = "ID of the secondary ALB security group"
  value       = aws_security_group.alb_secondary.id
}

output "ec2_security_group_secondary_id" {
  description = "ID of the secondary EC2 security group"
  value       = aws_security_group.ec2_secondary.id
}

# =============================================================================
# IAM OUTPUTS
# =============================================================================

output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "automation_role_arn" {
  description = "ARN of the automation IAM role"
  value       = aws_iam_role.automation_role.arn
}

output "s3_replication_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.replication_role.arn
}

# =============================================================================
# S3 OUTPUTS
# =============================================================================

output "s3_bucket_primary_id" {
  description = "ID of the primary S3 bucket"
  value       = aws_s3_bucket.primary.id
}

output "s3_bucket_primary_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary.arn
}

output "s3_bucket_primary_domain_name" {
  description = "Domain name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.bucket_domain_name
}

output "s3_bucket_secondary_id" {
  description = "ID of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.id
}

output "s3_bucket_secondary_arn" {
  description = "ARN of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.arn
}

output "s3_bucket_secondary_domain_name" {
  description = "Domain name of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.bucket_domain_name
}

# =============================================================================
# LOAD BALANCER OUTPUTS
# =============================================================================

output "alb_primary_id" {
  description = "ID of the primary Application Load Balancer"
  value       = aws_lb.primary.id
}

output "alb_primary_arn" {
  description = "ARN of the primary Application Load Balancer"
  value       = aws_lb.primary.arn
}

output "alb_primary_dns_name" {
  description = "DNS name of the primary Application Load Balancer"
  value       = aws_lb.primary.dns_name
}

output "alb_primary_zone_id" {
  description = "Zone ID of the primary Application Load Balancer"
  value       = aws_lb.primary.zone_id
}

output "alb_secondary_id" {
  description = "ID of the secondary Application Load Balancer"
  value       = aws_lb.secondary.id
}

output "alb_secondary_arn" {
  description = "ARN of the secondary Application Load Balancer"
  value       = aws_lb.secondary.arn
}

output "alb_secondary_dns_name" {
  description = "DNS name of the secondary Application Load Balancer"
  value       = aws_lb.secondary.dns_name
}

output "alb_secondary_zone_id" {
  description = "Zone ID of the secondary Application Load Balancer"
  value       = aws_lb.secondary.zone_id
}

output "target_group_primary_arn" {
  description = "ARN of the primary target group"
  value       = aws_lb_target_group.primary.arn
}

output "target_group_secondary_arn" {
  description = "ARN of the secondary target group"
  value       = aws_lb_target_group.secondary.arn
}

# =============================================================================
# AUTO SCALING GROUP OUTPUTS
# =============================================================================

output "asg_primary_id" {
  description = "ID of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.id
}

output "asg_primary_arn" {
  description = "ARN of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.arn
}

output "asg_primary_name" {
  description = "Name of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.name
}

output "asg_secondary_id" {
  description = "ID of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.id
}

output "asg_secondary_arn" {
  description = "ARN of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.arn
}

output "asg_secondary_name" {
  description = "Name of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.name
}

output "launch_template_primary_id" {
  description = "ID of the primary launch template"
  value       = aws_launch_template.primary.id
}

output "launch_template_primary_latest_version" {
  description = "Latest version of the primary launch template"
  value       = aws_launch_template.primary.latest_version
}

output "launch_template_secondary_id" {
  description = "ID of the secondary launch template"
  value       = aws_launch_template.secondary.id
}

output "launch_template_secondary_latest_version" {
  description = "Latest version of the secondary launch template"
  value       = aws_launch_template.secondary.latest_version
}

# =============================================================================
# DATA SOURCE OUTPUTS
# =============================================================================

output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "primary_availability_zones" {
  description = "Available availability zones in primary region"
  value       = data.aws_availability_zones.primary.names
}

output "secondary_availability_zones" {
  description = "Available availability zones in secondary region"
  value       = data.aws_availability_zones.secondary.names
}

output "amazon_linux_ami_primary" {
  description = "Amazon Linux AMI ID in primary region"
  value       = data.aws_ami.amazon_linux_primary.id
}

output "amazon_linux_ami_secondary" {
  description = "Amazon Linux AMI ID in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.id
}

# =============================================================================
# CONFIGURATION OUTPUTS
# =============================================================================

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "primary_region" {
  description = "Primary AWS region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary AWS region"
  value       = var.secondary_region
}

output "environment_config" {
  description = "Environment-specific configuration"
  value       = local.env_config
  sensitive   = false
}

# =============================================================================
# APPLICATION ENDPOINTS
# =============================================================================

output "application_url_primary" {
  description = "Primary application URL"
  value       = "http://${aws_lb.primary.dns_name}"
}

output "application_url_secondary" {
  description = "Secondary application URL"
  value       = "http://${aws_lb.secondary.dns_name}"
}

output "health_check_url_primary" {
  description = "Primary health check URL"
  value       = "http://${aws_lb.primary.dns_name}/health"
}

output "health_check_url_secondary" {
  description = "Secondary health check URL"
  value       = "http://${aws_lb.secondary.dns_name}/health"
}
