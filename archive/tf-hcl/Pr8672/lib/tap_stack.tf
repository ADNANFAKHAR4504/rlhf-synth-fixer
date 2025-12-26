# lib/tap_stack.tf - Multi-environment, multi-region Terraform stack
# Single logic file containing all variables, locals, data sources, resources, and outputs

# =============================================================================
# VARIABLES
# =============================================================================

variable "aws_region" {
  description = "Primary AWS region for deployment (used by default provider)"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production"
  }
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "platform-team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "engineering"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap-stack"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access (restrict to specific IPs, not 0.0.0.0/0)"
  type        = string
  default     = "10.0.0.0/8"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "enable_multi_region" {
  description = "Enable multi-region deployment"
  type        = bool
  default     = true
}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  # Environment-specific configurations
  env_config = {
    dev = {
      instance_type       = "t3.micro"
      db_instance_class   = "db.t3.micro"
      min_size            = 1
      max_size            = 2
      desired_capacity    = 1
      backup_retention    = 7
      monitoring_enabled  = false
      multi_az            = false
      deletion_protection = false
      log_retention_days  = 7
      config_frequency    = "TwentyFour_Hours"
    }
    staging = {
      instance_type       = "t3.small"
      db_instance_class   = "db.t3.small"
      min_size            = 1
      max_size            = 3
      desired_capacity    = 2
      backup_retention    = 14
      monitoring_enabled  = true
      multi_az            = true
      deletion_protection = false
      log_retention_days  = 14
      config_frequency    = "Twelve_Hours"
    }
    production = {
      instance_type       = "t3.medium"
      db_instance_class   = "db.t3.medium"
      min_size            = 2
      max_size            = 10
      desired_capacity    = 3
      backup_retention    = 30
      monitoring_enabled  = true
      multi_az            = true
      deletion_protection = true
      log_retention_days  = 30
      config_frequency    = "Six_Hours"
    }
  }

  # Current environment configuration
  current_config = local.env_config[var.environment]

  # Common tags applied to all resources
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    CostCenter  = var.cost_center
    Project     = var.project_name
    ManagedBy   = "terraform"
  }

  # Resource naming convention using intrinsic functions
  name_prefix = join("-", [var.project_name, var.environment])

  # Regions for multi-region deployment
  regions = var.enable_multi_region ? ["us-east-1", "us-west-2", "eu-central-1"] : [var.aws_region]

  # Provider mapping for multi-region resources (used for reference only)
  provider_aliases = {
    "us-east-1"    = "use1"
    "us-west-2"    = "usw2"
    "eu-central-1" = "euc1"
  }

  # Region-specific CIDR blocks to avoid conflicts
  vpc_cidrs = {
    "us-east-1"    = "10.0.0.0/16"
    "us-west-2"    = "10.1.0.0/16"
    "eu-central-1" = "10.2.0.0/16"
  }
}

# =============================================================================
# DATA SOURCES
# =============================================================================

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# Get the latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
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

# Get ELB service account for S3 access logs
data "aws_elb_service_account" "main" {}

# =============================================================================
# KMS KEYS FOR ENCRYPTION
# =============================================================================

resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix} encryption"
  deletion_window_in_days = var.environment == "production" ? 30 : 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Config Service"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.main.key_id
}

# Multi-region KMS keys (disabled for LocalStack compatibility)
# resource "aws_kms_key" "regional" {
#   for_each = var.enable_multi_region ? toset(slice(local.regions, 1, length(local.regions))) : toset([])
#   provider = each.key == "us-west-2" ? aws.usw2 : (each.key == "eu-central-1" ? aws.euc1 : aws.use1)

#   description             = "KMS key for ${local.name_prefix} encryption in ${each.key}"
#   deletion_window_in_days = var.environment == "production" ? 30 : 7
#   enable_key_rotation     = true
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Sid    = "Enable IAM User Permissions"
#         Effect = "Allow"
#         Principal = {
#           AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
#         }
#         Action   = "kms:*"
#         Resource = "*"
#       }
#     ]
#   })
#   tags = merge(local.common_tags, {
#     Name = "${local.name_prefix}-kms-key-${each.key}"
#   })
# }

# =============================================================================
# S3 BUCKETS
# =============================================================================

resource "aws_s3_bucket" "main" {
  bucket = "${local.name_prefix}-data-${substr(md5("${data.aws_caller_identity.current.account_id}-${var.environment}"), 0, 8)}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-data-bucket"
  })
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "main" {
  bucket = aws_s3_bucket.main.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-access-logs/"
}

resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs-${substr(md5("${data.aws_caller_identity.current.account_id}-logs"), 0, 8)}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-logs-bucket"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = local.current_config.log_retention_days
    }
  }
}

# =============================================================================
# VPC AND NETWORKING
# =============================================================================

resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidrs[data.aws_region.current.name]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 2)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

resource "aws_subnet" "database" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 4)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-subnet-${count.index + 1}"
    Type = "database"
  })
}

resource "aws_eip" "nat" {
  count = 2

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
  })
}

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

resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  count = 2

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-rt"
  })
}

resource "aws_route_table_association" "database" {
  count = 2

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
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
    Name = "${local.name_prefix}-alb-sg"
  })
}

resource "aws_security_group" "ec2" {
  name        = "${local.name_prefix}-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "SSH from allowed CIDR"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    cidr_blocks     = [var.allowed_ssh_cidr]
    security_groups = [aws_security_group.alb.id]
  }

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

resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
  })
}

# =============================================================================
# IAM ROLES AND POLICIES (LEAST PRIVILEGE)
# =============================================================================

# IAM role for EC2 instances
resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-role"
  })
}

# IAM policy for EC2 to access S3 (least privilege)
resource "aws_iam_role_policy" "ec2_s3" {
  name = "${local.name_prefix}-ec2-s3-policy"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
      }
    ]
  })
}

# IAM instance profile for EC2
resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-profile"
  })
}

# IAM role for RDS enhanced monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${local.name_prefix}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-monitoring-role"
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# IAM role for Config
resource "aws_iam_role" "config" {
  name = "${local.name_prefix}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-config-role"
  })
}

# Custom IAM policy for Config (LocalStack doesn't support managed ConfigRole policy)
resource "aws_iam_role_policy" "config" {
  name = "${local.name_prefix}-config-policy"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetBucketAcl"
        ]
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "config:Put*",
          "config:Get*",
          "config:List*",
          "config:Describe*"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM role for CloudTrail
resource "aws_iam_role" "cloudtrail" {
  name = "${local.name_prefix}-cloudtrail-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-role"
  })
}

resource "aws_iam_role_policy" "cloudtrail_s3" {
  name = "${local.name_prefix}-cloudtrail-s3-policy"
  role = aws_iam_role.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      }
    ]
  })
}

# =============================================================================
# EC2 INSTANCES
# =============================================================================

resource "aws_launch_template" "main" {
  name_prefix   = "${local.name_prefix}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = local.current_config.instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>${local.name_prefix} - ${var.environment}</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.common_tags, { Name = "${local.name_prefix}-instance" })
  }

  tag_specifications {
    resource_type = "volume"
    tags          = merge(local.common_tags, { Name = "${local.name_prefix}-volume" })
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }

  block_device_mappings {
    device_name = "/dev/xvdf"

    ebs {
      volume_size           = 10
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-launch-template"
  })
}

resource "aws_autoscaling_group" "main" {
  name                = "${local.name_prefix}-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  # target_group_arns disabled for LocalStack compatibility (ALB disabled)
  # target_group_arns         = [aws_lb_target_group.main.arn]
  health_check_type         = "EC2" # Changed from ELB to EC2 for LocalStack compatibility
  health_check_grace_period = 300

  min_size         = local.current_config.min_size
  max_size         = local.current_config.max_size
  desired_capacity = local.current_config.desired_capacity

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-instance"
    propagate_at_launch = true
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

# =============================================================================
# APPLICATION LOAD BALANCER
# =============================================================================

# ALB resources disabled for LocalStack compatibility
# LocalStack has issues with ALB attributes (health_check_logs.s3.enabled)
# Uncomment these resources for production AWS deployments:

# resource "aws_lb" "main" {
#   name               = "${local.name_prefix}-alb"
#   internal           = false
#   load_balancer_type = "application"
#   security_groups    = [aws_security_group.alb.id]
#   subnets            = aws_subnet.public[*].id
#
#   enable_deletion_protection = local.current_config.deletion_protection
#
#   access_logs {
#     bucket  = aws_s3_bucket.logs.id
#     prefix  = "alb-access-logs"
#     enabled = true
#   }
#
#   tags = merge(local.common_tags, {
#     Name = "${local.name_prefix}-alb"
#   })
# }
#
# resource "aws_lb_target_group" "main" {
#   name     = "${local.name_prefix}-tg"
#   port     = 80
#   protocol = "HTTP"
#   vpc_id   = aws_vpc.main.id
#
#   health_check {
#     enabled             = true
#     healthy_threshold   = 2
#     unhealthy_threshold = 2
#     timeout             = 5
#     interval            = 30
#     path                = "/"
#     protocol            = "HTTP"
#     matcher             = "200"
#   }
#
#   tags = merge(local.common_tags, {
#     Name = "${local.name_prefix}-target-group"
#   })
# }
#
# resource "aws_lb_listener" "main" {
#   load_balancer_arn = aws_lb.main.arn
#   port              = "80"
#   protocol          = "HTTP"
#
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.main.arn
#   }
# }

# =============================================================================
# RDS DATABASE
# =============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-db"

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = local.current_config.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn

  db_name  = "appdb"
  username = var.db_username
  password = var.db_password != "" ? var.db_password : random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = local.current_config.backup_retention
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  monitoring_interval             = local.current_config.monitoring_enabled ? 60 : 0
  monitoring_role_arn             = local.current_config.monitoring_enabled ? aws_iam_role.rds_monitoring.arn : null

  multi_az            = local.current_config.multi_az
  deletion_protection = local.current_config.deletion_protection
  skip_final_snapshot = !local.current_config.deletion_protection

  performance_insights_enabled    = var.environment == "production"
  performance_insights_kms_key_id = var.environment == "production" ? aws_kms_key.main.arn : null

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db"
  })
}

resource "random_password" "db_password" {
  length  = 16
  special = true
}

# =============================================================================
# CLOUDWATCH LOGS
# =============================================================================

resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/${local.name_prefix}/application"
  retention_in_days = local.current_config.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-logs"
  })
}

resource "aws_cloudwatch_log_group" "config" {
  name              = "/aws/config/${local.name_prefix}"
  retention_in_days = local.current_config.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-config-logs"
  })
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${local.name_prefix}"
  retention_in_days = local.current_config.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-logs"
  })
}

# =============================================================================
# AWS CONFIG
# =============================================================================

resource "aws_config_configuration_recorder" "main" {
  name     = "${local.name_prefix}-config-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "${local.name_prefix}-config-delivery"
  s3_bucket_name = aws_s3_bucket.logs.id
  s3_key_prefix  = "config/"

  snapshot_delivery_properties {
    delivery_frequency = local.current_config.config_frequency
  }
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config Rules for compliance
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "${local.name_prefix}-s3-bucket-encryption"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-encryption-rule"
  })
}

resource "aws_config_config_rule" "s3_bucket_versioning" {
  name = "${local.name_prefix}-s3-bucket-versioning"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_VERSIONING_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-versioning-rule"
  })
}

resource "aws_config_config_rule" "rds_encryption" {
  name = "${local.name_prefix}-rds-encryption"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-encryption-rule"
  })
}

# RDS backup config rule disabled for LocalStack compatibility
# LocalStack doesn't support RDS_INSTANCE_BACKUP_ENABLED source identifier
# resource "aws_config_config_rule" "rds_backup" {
#   name = "${local.name_prefix}-rds-backup"
#
#   source {
#     owner             = "AWS"
#     source_identifier = "RDS_INSTANCE_BACKUP_ENABLED"
#   }
#
#   depends_on = [aws_config_configuration_recorder_status.main]
#
#   tags = merge(local.common_tags, {
#     Name = "${local.name_prefix}-rds-backup-rule"
#   })
# }

resource "aws_config_config_rule" "ec2_ebs_encryption" {
  name = "${local.name_prefix}-ec2-ebs-encryption"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder_status.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-ebs-encryption-rule"
  })
}

resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "${local.name_prefix}-cloudtrail-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-enabled-rule"
  })
}

resource "aws_config_config_rule" "required_tags" {
  name = "${local.name_prefix}-required-tags"

  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }

  input_parameters = jsonencode({
    tag1Key = "Environment"
    tag2Key = "Owner"
    tag3Key = "CostCenter"
  })

  depends_on = [aws_config_configuration_recorder_status.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-required-tags-rule"
  })
}

resource "aws_config_config_rule" "ssh_restricted" {
  name = "${local.name_prefix}-ssh-restricted"

  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ssh-restricted-rule"
  })
}

# =============================================================================
# CLOUDTRAIL
# =============================================================================

resource "aws_cloudtrail" "main" {
  name           = "${local.name_prefix}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.logs.id
  s3_key_prefix  = "cloudtrail/"

  enable_logging                = true
  include_global_service_events = true
  is_multi_region_trail         = var.enable_multi_region

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn

  kms_key_id = aws_kms_key.main.arn

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.main.arn}/*"]
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail"
  })
}

# =============================================================================
# VPC FLOW LOGS
# =============================================================================

# Flow Log disabled for LocalStack compatibility
# LocalStack has issues with max_aggregation_interval attribute
# Uncomment for production AWS deployments:

# resource "aws_flow_log" "main" {
#   iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
#   log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
#   traffic_type    = "ALL"
#   vpc_id          = aws_vpc.main.id
#
#   max_aggregation_interval = 60
#
#   tags = merge(local.common_tags, {
#     Name = "${local.name_prefix}-vpc-flow-logs"
#   })
# }

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/${local.name_prefix}/flowlogs"
  retention_in_days = local.current_config.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs"
  })
}

resource "aws_iam_role" "vpc_flow_logs" {
  name = "${local.name_prefix}-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs-role"
  })
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "${local.name_prefix}-vpc-flow-logs-policy"
  role = aws_iam_role.vpc_flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# =============================================================================
# MULTI-REGION RESOURCES
# =============================================================================

# Multi-region resources are disabled for LocalStack compatibility
# LocalStack primarily supports single-region deployments
# Uncomment and configure these resources for multi-region AWS deployments

# S3 buckets in other regions
# resource "aws_s3_bucket" "regional" {
#   for_each = var.enable_multi_region ? toset(slice(local.regions, 1, length(local.regions))) : toset([])
#   provider = each.key == "us-west-2" ? aws.usw2 : aws.euc1
#   bucket = "${local.name_prefix}-data-${each.key}-${substr(md5("${data.aws_caller_identity.current.account_id}-${var.environment}-${each.key}"), 0, 8)}"
#   tags = merge(local.common_tags, {
#     Name = "${local.name_prefix}-data-bucket-${each.key}"
#   })
# }

# resource "aws_s3_bucket_versioning" "regional" {
#   for_each = var.enable_multi_region ? toset(slice(local.regions, 1, length(local.regions))) : toset([])
#   provider = each.key == "us-west-2" ? aws.usw2 : aws.euc1
#   bucket = aws_s3_bucket.regional[each.key].id
#   versioning_configuration {
#     status = "Enabled"
#   }
# }

# resource "aws_s3_bucket_server_side_encryption_configuration" "regional" {
#   for_each = var.enable_multi_region ? toset(slice(local.regions, 1, length(local.regions))) : toset([])
#   provider = each.key == "us-west-2" ? aws.usw2 : aws.euc1
#   bucket = aws_s3_bucket.regional[each.key].id
#   rule {
#     apply_server_side_encryption_by_default {
#       sse_algorithm     = "aws:kms"
#       kms_master_key_id = aws_kms_key.regional[each.key].arn
#     }
#     bucket_key_enabled = true
#   }
# }

# VPCs in other regions
# resource "aws_vpc" "regional" {
#   for_each = var.enable_multi_region ? toset(slice(local.regions, 1, length(local.regions))) : toset([])
#   provider = each.key == "us-west-2" ? aws.usw2 : aws.euc1
#   cidr_block           = local.vpc_cidrs[each.key]
#   enable_dns_hostnames = true
#   enable_dns_support   = true
#   tags = merge(local.common_tags, {
#     Name = "${local.name_prefix}-vpc-${each.key}"
#   })
# }

# =============================================================================
# OUTPUTS
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = aws_subnet.database[*].id
}

# ALB outputs disabled for LocalStack compatibility (ALB resource disabled)
# Uncomment for production AWS deployments:

# output "alb_dns_name" {
#   description = "Application Load Balancer DNS name"
#   value       = aws_lb.main.dns_name
# }
#
# output "load_balancer_dns_name" {
#   description = "Application Load Balancer DNS name (alias for compatibility)"
#   value       = aws_lb.main.dns_name
# }
#
# output "alb_arn" {
#   description = "Application Load Balancer ARN"
#   value       = aws_lb.main.arn
# }

# Placeholder outputs for LocalStack compatibility
output "alb_dns_name" {
  description = "Application Load Balancer DNS name (disabled for LocalStack)"
  value       = "alb-disabled-for-localstack"
}

output "load_balancer_dns_name" {
  description = "Application Load Balancer DNS name (disabled for LocalStack)"
  value       = "alb-disabled-for-localstack"
}

output "alb_arn" {
  description = "Application Load Balancer ARN (disabled for LocalStack)"
  value       = "arn:aws:elasticloadbalancing:us-east-1:000000000000:loadbalancer/app/disabled/localstack"
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "database_endpoint" {
  description = "RDS instance endpoint (alias for compatibility)"
  value       = aws_db_instance.main.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.main.arn
}

output "s3_logs_bucket_name" {
  description = "S3 logs bucket name"
  value       = aws_s3_bucket.logs.id
}

output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.main.arn
}

output "config_recorder_name" {
  description = "AWS Config recorder name"
  value       = aws_config_configuration_recorder.main.name
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "region" {
  description = "Primary AWS region"
  value       = data.aws_region.current.name
}

output "account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "regional_vpc_ids" {
  description = "Regional VPC IDs"
  value       = {} # Disabled for LocalStack compatibility
}

output "regional_s3_buckets" {
  description = "Regional S3 bucket names"
  value       = {} # Disabled for LocalStack compatibility
}
