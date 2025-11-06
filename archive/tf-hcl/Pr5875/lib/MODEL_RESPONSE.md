```hcl
# tap_stack.tf

# ---------------------------------------------------------------------------------------------------------------------
# VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

variable "env" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "platform-team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "cc-0001"
}

variable "domain_name" {
  description = "Domain name for Route53 (optional)"
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID (optional)"
  type        = string
  default     = ""
}

variable "web_instance_type" {
  description = "Instance type for web servers"
  type        = string
  default     = "t3.micro"
}

variable "rds_engine" {
  description = "RDS engine type"
  type        = string
  default     = "postgres"
}

variable "rds_engine_version" {
  description = "RDS engine version (optional)"
  type        = string
  default     = ""
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage (GB)"
  type        = number
  default     = 20
}

variable "s3_upload_bucket_name" {
  description = "Name for S3 upload bucket (optional override)"
  type        = string
  default     = ""
}

variable "s3_upload_prefix" {
  description = "Prefix for S3 uploads"
  type        = string
  default     = "uploads/"
}

variable "use2_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.10.0.0/16"
}

variable "bastion_ssh_cidr" {
  description = "CIDR block for SSH access to bastion host"
  type        = string
  default     = "0.0.0.0/32"
}

# ---------------------------------------------------------------------------------------------------------------------
# DATA SOURCES
# ---------------------------------------------------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_availability_zones" "use2" {
  state = "available"
}

data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

# ---------------------------------------------------------------------------------------------------------------------
# LOCALS
# ---------------------------------------------------------------------------------------------------------------------

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  
  name = {
    use2 = "cloud-setup-${var.env}-${local.region}"
  }
  
  # Subnet calculations
  public_subnet_cidrs = [
    cidrsubnet(var.use2_cidr, 8, 0),
    cidrsubnet(var.use2_cidr, 8, 1)
  ]
  
  private_subnet_cidrs = [
    cidrsubnet(var.use2_cidr, 8, 10),
    cidrsubnet(var.use2_cidr, 8, 11)
  ]
  
  upload_bucket_name = var.s3_upload_bucket_name != "" ? var.s3_upload_bucket_name : "uploads-${local.name.use2}-${local.account_id}"
  
  base_tags = {
    Project     = "CloudSetup"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
    DoNotNuke   = "true"
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# KMS KEYS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_kms_key" "primary" {
  description             = "Primary key for general encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 7
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-primary-kms"
  })
}

resource "aws_kms_alias" "primary" {
  name          = "alias/${local.name.use2}-primary"
  target_key_id = aws_kms_key.primary.key_id
}

resource "aws_kms_key" "logs" {
  description             = "Key for CloudWatch Logs encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 7
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${local.account_id}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow CloudWatch Logs",
      "Effect": "Allow",
      "Principal": {
        "Service": "logs.${local.region}.amazonaws.com"
      },
      "Action": [
        "kms:Encrypt*",
        "kms:Decrypt*",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:Describe*"
      ],
      "Resource": "*"
    }
  ]
}
EOF

  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-logs-kms"
  })
}

resource "aws_kms_alias" "logs" {
  name          = "alias/${local.name.use2}-logs"
  target_key_id = aws_kms_key.logs.key_id
}

# ---------------------------------------------------------------------------------------------------------------------
# NETWORKING - VPC, SUBNETS, IGW, NAT, ROUTE TABLES
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_vpc" "use2" {
  cidr_block           = var.use2_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-vpc"
  })
}

resource "aws_internet_gateway" "use2" {
  vpc_id = aws_vpc.use2.id
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-igw"
  })
}

# Public subnets
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.use2.id
  cidr_block              = local.public_subnet_cidrs[0]
  availability_zone       = data.aws_availability_zones.use2.names[0]
  map_public_ip_on_launch = true
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-public-a"
  })
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.use2.id
  cidr_block              = local.public_subnet_cidrs[1]
  availability_zone       = data.aws_availability_zones.use2.names[1]
  map_public_ip_on_launch = true
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-public-b"
  })
}

# Private subnets
resource "aws_subnet" "private_a" {
  vpc_id                  = aws_vpc.use2.id
  cidr_block              = local.private_subnet_cidrs[0]
  availability_zone       = data.aws_availability_zones.use2.names[0]
  map_public_ip_on_launch = false
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-private-a"
  })
}

resource "aws_subnet" "private_b" {
  vpc_id                  = aws_vpc.use2.id
  cidr_block              = local.private_subnet_cidrs[1]
  availability_zone       = data.aws_availability_zones.use2.names[1]
  map_public_ip_on_launch = false
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-private-b"
  })
}

# NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-nat-eip"
  })
}

resource "aws_nat_gateway" "use2" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_a.id
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-nat"
  })
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.use2.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.use2.id
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-public-rt"
  })
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.use2.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.use2.id
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-private-rt"
  })
}

resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}

# ---------------------------------------------------------------------------------------------------------------------
# SECURITY GROUPS
# ---------------------------------------------------------------------------------------------------------------------

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${local.name.use2}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.use2.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from world"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-alb-sg"
  })
}

# App Security Group
resource "aws_security_group" "app" {
  name        = "${local.name.use2}-app-sg"
  description = "Security group for app tier"
  vpc_id      = aws_vpc.use2.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "HTTP from ALB"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-app-sg"
  })
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "${local.name.use2}-rds-sg"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.use2.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "PostgreSQL from App SG"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-rds-sg"
  })
}

# Web Security Group
resource "aws_security_group" "web" {
  name        = "${local.name.use2}-web-sg"
  description = "Security group for public web instance"
  vpc_id      = aws_vpc.use2.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from world"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-web-sg"
  })
}

# VPC Endpoint Security Group
resource "aws_security_group" "vpce" {
  name        = "${local.name.use2}-vpce-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.use2.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.use2_cidr]
    description = "HTTPS from VPC CIDR"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-vpce-sg"
  })
}

# Bastion Security Group
resource "aws_security_group" "bastion" {
  name        = "${local.name.use2}-bastion-sg"
  description = "Security group for bastion host"
  vpc_id      = aws_vpc.use2.id
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.bastion_ssh_cidr]
    description = "SSH from restricted CIDR"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-bastion-sg"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# VPC ENDPOINTS
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.use2.id
  service_name        = "com.amazonaws.${local.region}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  security_group_ids  = [aws_security_group.vpce.id]
  private_dns_enabled = true
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-ssm-endpoint"
  })
}

resource "aws_vpc_endpoint" "ssmmessages" {
  vpc_id              = aws_vpc.use2.id
  service_name        = "com.amazonaws.${local.region}.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  security_group_ids  = [aws_security_group.vpce.id]
  private_dns_enabled = true
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-ssmmessages-endpoint"
  })
}

resource "aws_vpc_endpoint" "ec2messages" {
  vpc_id              = aws_vpc.use2.id
  service_name        = "com.amazonaws.${local.region}.ec2messages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  security_group_ids  = [aws_security_group.vpce.id]
  private_dns_enabled = true
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-ec2messages-endpoint"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# IAM ROLES
# ---------------------------------------------------------------------------------------------------------------------

# EC2 Role for App Instances
resource "aws_iam_role" "app" {
  name = "${local.name.use2}-app-role"
  
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  tags = local.base_tags
}

resource "aws_iam_instance_profile" "app" {
  name = "${local.name.use2}-app-profile"
  role = aws_iam_role.app.name
}

resource "aws_iam_role_policy_attachment" "app_ssm" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "app_cw" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Lambda Role
resource "aws_iam_role" "lambda" {
  name = "${local.name.use2}-lambda-role"
  
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  tags = local.base_tags
}

resource "aws_iam_policy" "lambda_logs" {
  name        = "${local.name.use2}-lambda-logs-policy"
  description = "Policy for Lambda to write logs"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/*"
    }
  ]
}
EOF
}

resource "aws_iam_policy" "lambda_s3" {
  name        = "${local.name.use2}-lambda-s3-policy"
  description = "Policy for Lambda to access S3"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${local.upload_bucket_name}",
        "arn:aws:s3:::${local.upload_bucket_name}/*"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_policy" "lambda_kms" {
  name        = "${local.name.use2}-lambda-kms-policy"
  description = "Policy for Lambda to use KMS"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "${aws_kms_key.primary.arn}"
    }
  ]
}
EOF
}

resource "aws_iam_policy" "lambda_ssm" {
  name        = "${local.name.use2}-lambda-ssm-policy"
  description = "Policy for Lambda to read SSM parameters"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:${local.region}:${local.account_id}:parameter/*"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda_logs.arn
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda_s3.arn
}

resource "aws_iam_role_policy_attachment" "lambda_kms" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda_kms.arn
}

resource "aws_iam_role_policy_attachment" "lambda_ssm" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda_ssm.arn
}

# Explicit KMS grant for Lambda role
resource "aws_kms_grant" "lambda" {
  name              = "${local.name.use2}-lambda-kms-grant"
  key_id            = aws_kms_key.primary.key_id
  grantee_principal = aws_iam_role.lambda.arn
  operations        = ["Encrypt", "Decrypt", "GenerateDataKey"]
}

# ---------------------------------------------------------------------------------------------------------------------
# EC2 COMPUTE RESOURCES
# ---------------------------------------------------------------------------------------------------------------------

# Launch Template for App Instances
resource "aws_launch_template" "app" {
  name          = "${local.name.use2}-app-lt"
  image_id      = data.aws_ssm_parameter.al2023_ami.value
  instance_type = var.web_instance_type
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2 required
    http_put_response_hop_limit = 1
  }
  
  iam_instance_profile {
    name = aws_iam_instance_profile.app.name
  }
  
  vpc_security_group_ids = [aws_security_group.app.id]
  
  user_data = base64encode(<<EOF
#!/bin/bash
yum update -y
yum install -y httpd
mkdir -p /var/www/html
echo "<html><body><h1>ALB Test Page</h1><p>App server is running!</p></body></html>" > /var/www/html/alb.html
systemctl start httpd
systemctl enable httpd
EOF
  )
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(local.base_tags, {
      Name = "${local.name.use2}-app"
    })
  }
  
  tag_specifications {
    resource_type = "volume"
    tags = merge(local.base_tags, {
      Name = "${local.name.use2}-app-volume"
    })
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-app-lt"
  })
}

# Target Group for ALB
resource "aws_lb_target_group" "app" {
  name     = "${local.name.use2}-app-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.use2.id
  
  health_check {
    path                = "/alb.html"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-app-tg"
  })
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "${local.name.use2}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-alb"
  })
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name                = "${local.name.use2}-asg"
  vpc_zone_identifier = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  desired_capacity    = 3
  min_size            = 1
  max_size            = 5
  health_check_type   = "ELB"
  
  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
  
  target_group_arns = [aws_lb_target_group.app.arn]
  
  tag {
    key                 = "Name"
    value               = "${local.name.use2}-app-instance"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "PatchGroup"
    value               = "linux"
    propagate_at_launch = true
  }
  
  dynamic "tag" {
    for_each = local.base_tags

    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# Public Web Instance
resource "aws_instance" "web" {
  ami                    = data.aws_ssm_parameter.al2023_ami.value
  instance_type          = var.web_instance_type
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.app.name
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2 required
    http_put_response_hop_limit = 1
  }
  
  user_data = <<EOF
#!/bin/bash
yum update -y
yum install -y httpd curl
echo "<html><body><h1>Web Probe</h1><p>Public instance is running!</p></body></html>" > /var/www/html/index.html
systemctl start httpd
systemctl enable httpd
EOF

  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-web-probe"
  })
}

# Bastion Host
resource "aws_instance" "bastion" {
  ami                    = data.aws_ssm_parameter.al2023_ami.value
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.bastion.id]
  iam_instance_profile   = aws_iam_instance_profile.app.name
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2 required
    http_put_response_hop_limit = 1
  }
  
  user_data = <<EOF
#!/bin/bash
yum update -y
yum install -y postgresql
EOF

  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-bastion"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# S3 BUCKET
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_s3_bucket" "uploads" {
  bucket        = local.upload_bucket_name
  force_destroy = true  # For easy CI cleanup
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-uploads"
  })
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.primary.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_ownership_controls" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::${local.upload_bucket_name}",
        "arn:aws:s3:::${local.upload_bucket_name}/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
EOF
}

# ---------------------------------------------------------------------------------------------------------------------
# LAMBDA FUNCTIONS
# ---------------------------------------------------------------------------------------------------------------------

# On Upload Lambda Function
resource "aws_lambda_function" "on_upload" {
  function_name    = "${local.name.use2}-on-upload"
  role             = aws_iam_role.lambda.arn
  handler          = "index.lambda_handler"
  runtime          = "python3.12"
  timeout          = 30
  memory_size      = 128
  
  filename         = "lambda_function.zip"  # This would typically be a real file, creating a dummy file for this example
  source_code_hash = filebase64sha256("lambda_function.zip")
  
  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.uploads.id
    }
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-on-upload-lambda"
  })
}

# Heartbeat Lambda Function
resource "aws_lambda_function" "heartbeat" {
  function_name    = "${local.name.use2}-heartbeat"
  role             = aws_iam_role.lambda.arn
  handler          = "index.lambda_handler"
  runtime          = "python3.12"
  timeout          = 30
  memory_size      = 128
  
  filename         = "lambda_function.zip"  # This would typically be a real file
  source_code_hash = filebase64sha256("lambda_function.zip")
  
  environment {
    variables = {
      BUCKET_NAME      = aws_s3_bucket.uploads.id
      SSM_DB_PASSWORD  = aws_ssm_parameter.db_password.name
    }
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-heartbeat-lambda"
  })
}

# S3 Event Notification for Object Created
resource "aws_s3_bucket_notification" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  lambda_function {
    lambda_function_arn = aws_lambda_function.on_upload.arn
    events              = ["s3:ObjectCreated:*"]
  }
}

# Lambda Permission for S3
resource "aws_lambda_permission" "s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.on_upload.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.uploads.arn
}

# Warm up Lambda functions
data "aws_lambda_invocation" "on_upload_warmup" {
  function_name = aws_lambda_function.on_upload.function_name
  
  input = <<JSON
{
  "warmup": true
}
JSON
}

data "aws_lambda_invocation" "heartbeat_warmup" {
  function_name = aws_lambda_function.heartbeat.function_name
  
  input = <<JSON
{
  "warmup": true
}
JSON
}

# ---------------------------------------------------------------------------------------------------------------------
# API GATEWAY
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name.use2}-http-api"
  protocol_type = "HTTP"
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-http-api"
  })
}

resource "aws_apigatewayv2_integration" "alb" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "HTTP_PROXY"
  
  integration_method = "ANY"
  integration_uri    = "http://${aws_lb.app.dns_name}"
  
  connection_type = "INTERNET"
}

resource "aws_apigatewayv2_route" "root" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /"
  
  target = "integrations/${aws_apigatewayv2_integration.alb.id}"
  
  authorization_type = "AWS_IAM"
}

resource "aws_apigatewayv2_route" "ec2" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /ec2"
  
  target = "integrations/${aws_apigatewayv2_integration.alb.id}"
  
  authorization_type = "AWS_IAM"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-api-default-stage"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# RDS DATABASE
# ---------------------------------------------------------------------------------------------------------------------

resource "random_password" "db" {
  length  = 16
  special = false
}

resource "aws_ssm_parameter" "db_password" {
  name        = "/${local.name.use2}/database/password"
  description = "Database master password"
  type        = "SecureString"
  value       = random_password.db.result
  key_id      = aws_kms_key.primary.key_id
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-db-password"
  })
}

resource "aws_db_subnet_group" "default" {
  name       = "${local.name.use2}-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-db-subnet-group"
  })
}

resource "aws_db_instance" "postgres" {
  identifier             = "${local.name.use2}-db"
  engine                 = var.rds_engine
  engine_version         = var.rds_engine_version == "" ? null : var.rds_engine_version
  instance_class         = var.rds_instance_class
  allocated_storage      = var.rds_allocated_storage
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.primary.arn
  db_name                = "appdb"
  username               = "dbadmin"
  password               = random_password.db.result
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:30-sun:05:30"
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-db"
    Backup = "true"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# CLOUDFRONT
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_cloudfront_distribution" "alb" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  origin {
    domain_name = aws_lb.app.dns_name
    origin_id   = "alb-origin"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "alb-origin"
    
    forwarded_values {
      query_string = true
      
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "allow-all"
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
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-cloudfront"
  })
}

# ---------------------------------------------------------------------------------------------------------------------
# PATCH MANAGER
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_ssm_patch_baseline" "linux" {
  name             = "${local.name.use2}-linux-patch-baseline"
  description      = "Patch baseline for Linux instances"
  operating_system = "AMAZON_LINUX_2"
  
  approval_rule {
    approve_after_days = 7
    
    patch_filter {
      key    = "CLASSIFICATION"
      values = ["Security"]
    }
    
    patch_filter {
      key    = "SEVERITY"
      values = ["Critical", "Important"]
    }
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-linux-patch-baseline"
  })
}

resource "aws_ssm_association" "patch_association" {
  name = "AWS-RunPatchBaseline"
  
  targets {
    key    = "tag:PatchGroup"
    values = ["linux"]
  }
  
  schedule_expression = "rate(7 days)"
  
  parameters = {
    Operation = "Scan"
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# CLOUDWATCH
# ---------------------------------------------------------------------------------------------------------------------

# Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/app/${local.name.use2}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.logs.arn
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-log-group"
  })
}

# SNS Topic
resource "aws_sns_topic" "alarms" {
  name = "${local.name.use2}-alarms"
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-alarms-topic"
  })
}

# CloudWatch Alarm
resource "aws_cloudwatch_metric_alarm" "cpu" {
  alarm_name          = "${local.name.use2}-cpu-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-cpu-alarm"
  })
}

#---------------------------------------------------------------------------------------------------------------------
# AWS BACKUP
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_backup_vault" "main" {
  name        = "${local.name.use2}-backup-vault"
  kms_key_arn = aws_kms_key.primary.arn
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-backup-vault"
  })
}

resource "aws_backup_plan" "main" {
  name = "${local.name.use2}-backup-plan"
  
  rule {
    rule_name         = "DailyBackups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 * * ? *)"
    
    lifecycle {
      delete_after = 30
    }
  }
  
  tags = merge(local.base_tags, {
    Name = "${local.name.use2}-backup-plan"
  })
}

resource "aws_backup_selection" "main" {
  name         = "${local.name.use2}-backup-selection"
  iam_role_arn = "arn:aws:iam::${local.account_id}:role/service-role/AWSBackupDefaultServiceRole"
  plan_id      = aws_backup_plan.main.id
  
  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Backup"
    value = "true"
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# ROUTE 53
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_route53_record" "alb" {
  count = var.domain_name != "" && var.hosted_zone_id != "" ? 1 : 0
  
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"
  
  alias {
    name                   = aws_lb.app.dns_name
    zone_id                = aws_lb.app.zone_id
    evaluate_target_health = true
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# OUTPUTS
# ---------------------------------------------------------------------------------------------------------------------

# VPC/Subnets
output "use2_vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.use2.id
}

output "use2_public_subnet_ids" {
  description = "Public subnet IDs"
  value       = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

output "use2_private_subnet_ids" {
  description = "Private subnet IDs"
  value       = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

output "use2_cidr" {
  description = "VPC CIDR"
  value       = aws_vpc.use2.cidr_block
}

# KMS
output "use2_kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.primary.arn
}

# S3
output "upload_bucket_name" {
  description = "Upload bucket name"
  value       = aws_s3_bucket.uploads.id
}

output "app_bucket_name" {
  description = "App bucket name (alias for upload_bucket_name)"
  value       = aws_s3_bucket.uploads.id
}

# Lambda
output "lambda_on_upload_name" {
  description = "Lambda on_upload function name"
  value       = aws_lambda_function.on_upload.function_name
}

output "lambda_on_upload_arn" {
  description = "Lambda on_upload function ARN"
  value       = aws_lambda_function.on_upload.arn
}

output "lambda_heartbeat_name" {
  description = "Lambda heartbeat function name"
  value       = aws_lambda_function.heartbeat.function_name
}

output "lambda_function_name" {
  description = "Lambda function name (alias for lambda_heartbeat_name)"
  value       = aws_lambda_function.heartbeat.function_name
}

# ALB/API/CF
output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.app.arn
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.app.dns_name
}

output "alb_target_group_arn" {
  description = "ALB target group ARN"
  value       = aws_lb_target_group.app.arn
}

output "api_invoke_url" {
  description = "API Gateway invoke URL"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = aws_cloudfront_distribution.alb.domain_name
}

# RDS
output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_port" {
  description = "RDS port"
  value       = aws_db_instance.postgres.port
}

output "rds_password_param_name" {
  description = "RDS password parameter name"
  value       = aws_ssm_parameter.db_password.name
}

output "rds_username" {
  description = "RDS username"
  value       = aws_db_instance.postgres.username
}

# IAM
output "app_role_name" {
  description = "App role name"
  value       = aws_iam_role.app.name
}

output "app_role_arn" {
  description = "App role ARN"
  value       = aws_iam_role.app.arn
}

# SNS/Logs
output "sns_alarms_topic_arn" {
  description = "SNS alarms topic ARN"
  value       = aws_sns_topic.alarms.arn
}

output "cw_log_group_use2" {
  description = "CloudWatch log group"
  value       = aws_cloudwatch_log_group.app.name
}

# Aliases
output "vpc_id" {
  description = "VPC ID (alias for use2_vpc_id)"
  value       = aws_vpc.use2.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs (alias for use2_public_subnet_ids)"
  value       = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

output "private_subnet_ids" {
  description = "Private subnet IDs (alias for use2_private_subnet_ids)"
  value       = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

output "security_group_web_id" {
  description = "Web security group ID"
  value       = aws_security_group.web.id
}
```
