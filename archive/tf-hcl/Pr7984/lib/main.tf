# Optimized Payment Processing Infrastructure
# Platform: Terraform
# Language: HCL

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.common_tags
  }
}

# Data source for latest Amazon Linux 2 AMI
# OPTIMIZATION #2: Replace hardcoded AMI IDs with data source
data "aws_ami" "amazon_linux_2" {
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

# Data source for availability zones
# OPTIMIZATION #2: Replace hardcoded AZs with data source
data "aws_availability_zones" "available" {
  state = "available"
}

# IAM Policy Document for EC2 instances
# OPTIMIZATION #4: Convert inline IAM policies to policy documents
data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# Comprehensive IAM permissions including EC2 describe
data "aws_iam_policy_document" "ec2_s3_access" {
  statement {
    sid    = "S3LogAccess"
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket",
      "s3:DeleteObject"
    ]

    resources = [
      "arn:aws:s3:::payment-logs-*",
      "arn:aws:s3:::payment-logs-*/*"
    ]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"

    actions = [
      "cloudwatch:PutMetricData",
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "EC2Describe"
    effect = "Allow"

    actions = [
      "ec2:DescribeInstances",
      "ec2:DescribeTags",
      "ec2:DescribeVolumes"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "SSMParameterAccess"
    effect = "Allow"

    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters"
    ]

    resources = ["arn:aws:ssm:${var.aws_region}:*:parameter/payment/*"]
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_payment_role" {
  name               = "ec2-payment-role-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json

  tags = merge(
    var.common_tags,
    {
      Name = "ec2-payment-role-${var.environment_suffix}"
      Role = "PaymentProcessing"
    }
  )
}

# IAM Policy for EC2 instances
resource "aws_iam_role_policy" "ec2_s3_policy" {
  name   = "ec2-s3-policy-${var.environment_suffix}"
  role   = aws_iam_role.ec2_payment_role.id
  policy = data.aws_iam_policy_document.ec2_s3_access.json
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_payment_profile" {
  name = "ec2-payment-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2_payment_role.name

  tags = merge(
    var.common_tags,
    {
      Name = "ec2-payment-profile-${var.environment_suffix}"
    }
  )
}

# Security Group for EC2 instances
# OPTIMIZATION #1: Use dynamic blocks for repetitive rules
resource "aws_security_group" "payment_sg" {
  name        = "payment-sg-${var.environment_suffix}"
  description = "Security group for payment processing instances"

  # Dynamic ingress rules for multiple ports and CIDR blocks
  dynamic "ingress" {
    for_each = [
      for pair in setproduct(var.allowed_ports, var.allowed_cidr_blocks) : {
        port = pair[0]
        cidr = pair[1]
      }
    ]

    content {
      description = "Allow port ${ingress.value.port} from ${ingress.value.cidr}"
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = "tcp"
      cidr_blocks = [ingress.value.cidr]
    }
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # OPTIMIZATION #7: Implement proper tagging with merge()
  tags = merge(
    var.common_tags,
    {
      Name        = "payment-sg-${var.environment_suffix}"
      Description = "Payment Processing Security Group"
    }
  )
}

# Security Group for RDS
resource "aws_security_group" "rds_sg" {
  name        = "rds-sg-${var.environment_suffix}"
  description = "Security group for RDS PostgreSQL"

  ingress {
    description     = "PostgreSQL from payment instances"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.payment_sg.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "rds-sg-${var.environment_suffix}"
      Type = "Database"
    }
  )
}

# RDS Subnet Group
resource "aws_db_subnet_group" "payment_db_subnet" {
  name       = "payment-db-subnet-${var.environment_suffix}"
  subnet_ids = data.aws_subnets.default.ids

  tags = merge(
    var.common_tags,
    {
      Name = "payment-db-subnet-${var.environment_suffix}"
    }
  )
}

# Data source for default VPC subnets
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# RDS PostgreSQL Instance
# OPTIMIZATION #3: Add explicit dependency
# OPTIMIZATION #6: Add lifecycle ignore_changes for password
resource "aws_db_instance" "payment_db" {
  identifier     = "payment-db-${var.environment_suffix}"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "paymentdb"
  username = var.db_username
  password = var.db_password

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.payment_db_subnet.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  # Enable CloudWatch log exports for comprehensive monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # OPTIMIZATION #3: Explicit dependency to prevent race condition
  depends_on = [
    aws_security_group.rds_sg,
    aws_db_subnet_group.payment_db_subnet
  ]

  # OPTIMIZATION #6: Prevent password changes from forcing replacement
  lifecycle {
    ignore_changes = [password]
  }

  tags = merge(
    var.common_tags,
    {
      Name     = "payment-db-${var.environment_suffix}"
      Database = "PostgreSQL"
      Purpose  = "Transaction Storage"
    }
  )
}

# S3 Buckets for Transaction Logs
# OPTIMIZATION #5: Consolidate identical buckets using for_each
resource "aws_s3_bucket" "transaction_logs" {
  for_each = toset(var.s3_bucket_environments)

  bucket = "payment-logs-${each.key}-${var.environment_suffix}"

  tags = merge(
    var.common_tags,
    {
      Name        = "payment-logs-${each.key}-${var.environment_suffix}"
      Environment = each.key
      Purpose     = "Transaction Logs"
    }
  )
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "transaction_logs" {
  for_each = aws_s3_bucket.transaction_logs

  bucket = each.value.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs" {
  for_each = aws_s3_bucket.transaction_logs

  bucket = each.value.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "transaction_logs" {
  for_each = aws_s3_bucket.transaction_logs

  bucket = each.value.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Add S3 lifecycle policies for log rotation and cost optimization
resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs" {
  for_each = aws_s3_bucket.transaction_logs

  bucket = each.value.id

  rule {
    id     = "transition-old-logs"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 60
      storage_class = "GLACIER"
    }

    expiration {
      days = var.log_retention_days
    }
  }

  rule {
    id     = "delete-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 Bucket for ALB Access Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "payment-alb-logs-${var.environment_suffix}"

  tags = merge(
    var.common_tags,
    {
      Name    = "payment-alb-logs-${var.environment_suffix}"
      Purpose = "ALB Access Logs"
    }
  )
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Data source for ALB service account (for access logs)
data "aws_elb_service_account" "main" {}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

# Application Load Balancer
resource "aws_lb" "payment_alb" {
  name               = "payment-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.payment_sg.id]
  subnets            = data.aws_subnets.default.ids

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  # Enable ALB access logs to S3 for debugging and compliance
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    enabled = true
  }

  tags = merge(
    var.common_tags,
    {
      Name = "payment-alb-${var.environment_suffix}"
      Type = "LoadBalancer"
    }
  )
}

# ALB Target Group
resource "aws_lb_target_group" "payment_tg" {
  name     = "payment-tg-${var.environment_suffix}"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  # Add deregistration_delay for faster deployments
  deregistration_delay = 30

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  # Add stickiness for session management
  stickiness {
    type            = "lb_cookie"
    enabled         = true
    cookie_duration = 86400 # 24 hours
  }

  tags = merge(
    var.common_tags,
    {
      Name = "payment-tg-${var.environment_suffix}"
    }
  )
}

# ALB Listener
resource "aws_lb_listener" "payment_listener" {
  load_balancer_arn = aws_lb.payment_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.payment_tg.arn
  }
}

# EC2 Instances for Payment Processing
resource "aws_instance" "payment_server" {
  count = 2

  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  availability_zone      = var.availability_zones[count.index % length(var.availability_zones)]
  iam_instance_profile   = aws_iam_instance_profile.ec2_payment_profile.name
  vpc_security_group_ids = [aws_security_group.payment_sg.id]

  monitoring = true

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  # Enhanced user_data with proper error handling and logging
  user_data = <<-EOF
              #!/bin/bash
              set -e

              # Configure logging
              exec > >(tee /var/log/user-data.log)
              exec 2>&1

              echo "Starting instance initialization at $(date)"

              # Update system packages
              echo "Updating system packages..."
              yum update -y || { echo "Failed to update packages"; exit 1; }

              # Install CloudWatch agent
              echo "Installing CloudWatch agent..."
              yum install -y amazon-cloudwatch-agent || { echo "Failed to install CloudWatch agent"; exit 1; }

              # Configure CloudWatch agent
              cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOC
              {
                "logs": {
                  "logs_collected": {
                    "files": {
                      "collect_list": [
                        {
                          "file_path": "/var/log/payment-app.log",
                          "log_group_name": "/aws/ec2/payment-processing",
                          "log_stream_name": "{instance_id}"
                        }
                      ]
                    }
                  }
                },
                "metrics": {
                  "metrics_collected": {
                    "mem": {
                      "measurement": [{"name": "mem_used_percent"}]
                    },
                    "disk": {
                      "measurement": [{"name": "disk_used_percent"}],
                      "resources": ["*"]
                    }
                  }
                }
              }
              EOC

              # Start CloudWatch agent
              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
                -a fetch-config \
                -m ec2 \
                -s \
                -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

              echo "Payment processing server initialized successfully at $(date)"
              EOF

  tags = merge(
    var.common_tags,
    {
      Name  = "payment-server-${count.index + 1}-${var.environment_suffix}"
      Role  = "PaymentProcessing"
      Index = count.index + 1
    }
  )
}

# Register EC2 instances with target group
resource "aws_lb_target_group_attachment" "payment_server" {
  count = length(aws_instance.payment_server)

  target_group_arn = aws_lb_target_group.payment_tg.arn
  target_id        = aws_instance.payment_server[count.index].id
  port             = 8080
}
