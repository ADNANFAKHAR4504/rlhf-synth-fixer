# tap_stack.tf - Secure and Compliant AWS Infrastructure
# Region is configured in us-west-1

# Variable for AWS region (set by provider.tf)
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-1"
}

# Data sources for availability zones and AMI
data "aws_availability_zones" "available" {
  state = "available"
}

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

# Generate secure random passwords for sensitive data
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store sensitive data in Parameter Store with encryption
resource "aws_ssm_parameter" "db_password" {
  name        = "/production/database/password"
  description = "RDS PostgreSQL master password"
  type        = "SecureString"
  value       = random_password.db_password.result

  tags = {
    environment = "production"
  }
}

resource "aws_ssm_parameter" "db_username" {
  name        = "/production/database/username"
  description = "RDS PostgreSQL master username"
  type        = "SecureString"
  value       = "dbadmin"

  tags = {
    environment = "production"
  }
}

# VPC Configuration with custom CIDR
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "production-vpc"
    environment = "production"
  }
}

# Internet Gateway for public subnet connectivity
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "production-igw"
    environment = "production"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name        = "production-nat-eip-${count.index + 1}"
    environment = "production"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Subnets in two availability zones
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "production-public-subnet-${count.index + 1}"
    environment = "production"
    Type        = "public"
  }
}

# Private Subnets for application tier
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "production-private-subnet-${count.index + 1}"
    environment = "production"
    Type        = "private"
  }
}

# Private Subnets for database tier
resource "aws_subnet" "database" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 20}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "production-database-subnet-${count.index + 1}"
    environment = "production"
    Type        = "database"
  }
}

# NAT Gateways for private subnet internet access
resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "production-nat-gateway-${count.index + 1}"
    environment = "production"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "production-public-rt"
    environment = "production"
  }
}

# Route tables for private subnets
resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "production-private-rt-${count.index + 1}"
    environment = "production"
  }
}

# Route table associations
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count          = 2
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# S3 bucket for CloudTrail and access logs
resource "aws_s3_bucket" "logging" {
  bucket        = "production-logging-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name        = "production-logging-bucket"
    environment = "production"
    Purpose     = "CloudTrail and Access Logs"
  }
}

# S3 bucket for application data
resource "aws_s3_bucket" "application" {
  bucket        = "production-application-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name        = "production-application-bucket"
    environment = "production"
    Purpose     = "Application Data"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 8
}

# Block public access for logging bucket
resource "aws_s3_bucket_public_access_block" "logging" {
  bucket = aws_s3_bucket.logging.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Block public access for application bucket
resource "aws_s3_bucket_public_access_block" "application" {
  bucket = aws_s3_bucket.application.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning on buckets for data protection
resource "aws_s3_bucket_versioning" "logging" {
  bucket = aws_s3_bucket.logging.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "application" {
  bucket = aws_s3_bucket.application.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption for buckets
resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "application" {
  bucket = aws_s3_bucket.application.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Enable access logging for application bucket
resource "aws_s3_bucket_logging" "application" {
  bucket = aws_s3_bucket.application.id

  target_bucket = aws_s3_bucket.logging.id
  target_prefix = "application-logs/"
}

# Lifecycle rules for log retention (90 days for CloudTrail)
resource "aws_s3_bucket_lifecycle_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    id     = "cloudtrail-log-retention"
    status = "Enabled"

    filter {
      prefix = "cloudtrail/"
    }

    expiration {
      days = 90
    }
  }
}

# S3 bucket policy for CloudTrail
resource "aws_s3_bucket_policy" "logging" {
  bucket = aws_s3_bucket.logging.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/cloudtrail/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/config/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AWSALBAccessLogs"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::027434742980:root"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/alb-logs/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.logging]
}

# CloudTrail configuration
resource "aws_cloudtrail" "main" {
  name                          = "production-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.logging.id
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  enable_log_file_validation    = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  tags = {
    Name        = "production-cloudtrail"
    environment = "production"
  }

  depends_on = [aws_s3_bucket_policy.logging]
}

# IAM role for EC2 instances with minimal permissions
resource "aws_iam_role" "ec2_role" {
  name = "production-ec2-role"
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

  tags = {
    environment = "production"
  }
}

# IAM policy for EC2 instances - minimal permissions for SSM and CloudWatch
resource "aws_iam_role_policy" "ec2_policy" {
  name = "production-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel",
          "ec2messages:AcknowledgeMessage",
          "ec2messages:DeleteMessage",
          "ec2messages:FailMessage",
          "ec2messages:GetEndpoint",
          "ec2messages:GetMessages",
          "ec2messages:SendReply"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:us-west-1:*:parameter/production/*"
      }
    ]
  })
}

# Attach SSM managed policy for patch management
resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "production-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = {
    environment = "production"
  }
}

# Security group for Application Load Balancer
resource "aws_security_group" "alb" {
  name        = "production-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  # Allow HTTPS traffic from internet
  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTP traffic for redirect to HTTPS
  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "production-alb-sg"
    environment = "production"
  }
}

# Security group for EC2 instances
resource "aws_security_group" "ec2" {
  name        = "production-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  # Allow traffic from ALB only
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Allow HTTPS traffic for outbound connections
  egress {
    description = "HTTPS outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTP traffic for package updates
  egress {
    description = "HTTP outbound"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow database connections to RDS
  egress {
    description = "PostgreSQL to RDS"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  tags = {
    Name        = "production-ec2-sg"
    environment = "production"
  }
}

# Security group for RDS database
resource "aws_security_group" "rds" {
  name        = "production-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  # Allow PostgreSQL traffic from EC2 instances only
  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  tags = {
    Name        = "production-rds-sg"
    environment = "production"
  }
}

# KMS key for EBS encryption
resource "aws_kms_key" "ebs" {
  description             = "KMS key for EBS volume encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "production-ebs-kms-key"
    environment = "production"
  }
}

resource "aws_kms_alias" "ebs" {
  name          = "alias/production-ebs"
  target_key_id = aws_kms_key.ebs.key_id
}

# Launch template for EC2 instances
resource "aws_launch_template" "app" {
  name_prefix   = "production-app-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.medium"

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2_profile.arn
  }

  vpc_security_group_ids = [aws_security_group.ec2.id]

  # Enable detailed monitoring
  monitoring {
    enabled = true
  }

  # Encrypted root volume
  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.ebs.arn
      delete_on_termination = true
    }
  }

  # User data script for basic setup
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Production Server</h1>" > /var/www/html/index.html
    
    # Install CloudWatch agent
    wget https://s3.us-west-1.amazonaws.com/amazoncloudwatch-agent-us-west-1/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "production-ec2-instance"
      environment = "production"
    }
  }

  tag_specifications {
    resource_type = "volume"
    tags = {
      Name        = "production-ec2-volume"
      environment = "production"
    }
  }
}

# Auto Scaling Group for EC2 instances
resource "aws_autoscaling_group" "app" {
  name                      = "production-app-asg"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.app.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  min_size                  = 2
  max_size                  = 4
  desired_capacity          = 2

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "production-app-asg-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "environment"
    value               = "production"
    propagate_at_launch = true
  }
}

# Certificate for HTTPS (using ACM)
resource "aws_acm_certificate" "main" {
  domain_name       = "example.com" # Replace with your domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "production-alb-cert"
    environment = "production"
  }
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "production-app-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  # Enable access logs
  access_logs {
    bucket  = aws_s3_bucket.logging.bucket
    prefix  = "alb-logs"
    enabled = true
  }

  tags = {
    Name        = "production-app-alb"
    environment = "production"
  }
}

# Target Group for ALB
resource "aws_lb_target_group" "app" {
  name     = "production-app-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name        = "production-app-tg"
    environment = "production"
  }
}

# ALB Listener for HTTPS
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.app.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# ALB Listener for HTTP (redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "production-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name        = "production-db-subnet-group"
    environment = "production"
  }
}

# KMS key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "production-rds-kms-key"
    environment = "production"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/production-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier     = "production-postgres"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"

  allocated_storage = 100
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  db_name  = "productiondb"
  username = aws_ssm_parameter.db_username.value
  password = aws_ssm_parameter.db_password.value

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  # Backup configuration
  backup_retention_period = 30
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Enable automatic minor version upgrades
  auto_minor_version_upgrade = true

  # Deletion protection disabled for easier cleanup
  deletion_protection = false

  # Enable enhanced monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Skip final snapshot for terraform destroy
  skip_final_snapshot = true

  tags = {
    Name        = "production-postgres"
    environment = "production"
  }
}

# AWS Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "production-config-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# IAM role for AWS Config
resource "aws_iam_role" "config" {
  name = "production-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    environment = "production"
  }
}

# IAM policy for AWS Config
resource "aws_iam_role_policy" "config" {
  name = "production-config-policy"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.logging.arn}/config/*"
        Condition = {
          StringLike = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Attach AWS Config service policy
resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "production-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.logging.bucket
  s3_key_prefix  = "config"
}

# Start AWS Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config Rules for compliance checking
resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "s3-bucket-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name = "encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "rds_encryption_enabled" {
  name = "rds-storage-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Systems Manager Maintenance Window
resource "aws_ssm_maintenance_window" "patching" {
  name                       = "production-patching-window"
  description                = "Maintenance window for EC2 patching"
  schedule                   = "cron(0 2 ? * SUN *)"
  duration                   = 4
  cutoff                     = 1
  allow_unassociated_targets = false

  tags = {
    Name        = "production-patching-window"
    environment = "production"
  }
}

# Maintenance Window Target
resource "aws_ssm_maintenance_window_target" "patching" {
  window_id     = aws_ssm_maintenance_window.patching.id
  name          = "production-patching-targets"
  description   = "EC2 instances to patch"
  resource_type = "INSTANCE"

  targets {
    key    = "tag:environment"
    values = ["production"]
  }
}

# IAM role for Systems Manager maintenance tasks
resource "aws_iam_role" "ssm_maintenance" {
  name = "production-ssm-maintenance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ssm.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    environment = "production"
  }
}

resource "aws_iam_role_policy_attachment" "ssm_maintenance" {
  role       = aws_iam_role.ssm_maintenance.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonSSMMaintenanceWindowRole"
}

# Maintenance Window Task for patching
resource "aws_ssm_maintenance_window_task" "patching" {
  window_id        = aws_ssm_maintenance_window.patching.id
  name             = "production-patch-task"
  description      = "Apply OS patches to EC2 instances"
  task_type        = "RUN_COMMAND"
  task_arn         = "AWS-RunPatchBaseline"
  priority         = 1
  service_role_arn = aws_iam_role.ssm_maintenance.arn
  max_concurrency  = "50%"
  max_errors       = "0"

  targets {
    key    = "WindowTargetIds"
    values = [aws_ssm_maintenance_window_target.patching.id]
  }

  task_invocation_parameters {
    run_command_parameters {
      parameter {
        name   = "Operation"
        values = ["Install"]
      }
    }
  }
}

# CloudWatch Log Groups for application logs
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/production/application"
  retention_in_days = 30

  tags = {
    environment = "production"
    Purpose     = "Application Logs"
  }
}

# Outputs for reference
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.app.dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "s3_logging_bucket" {
  description = "Name of the S3 logging bucket"
  value       = aws_s3_bucket.logging.id
}

output "s3_application_bucket" {
  description = "Name of the S3 application bucket"
  value       = aws_s3_bucket.application.id
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.name
}