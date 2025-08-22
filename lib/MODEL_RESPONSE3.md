The errors indicate that resources from a previous deployment still exist. I'll fix this by adding random suffixes to resource names and implementing proper resource management. Here's the corrected Terraform configuration:

```hcl
# terraform/main.tf
# Terraform configuration for secure, multi-region AWS infrastructure
# Compliant with enterprise security requirements

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment_tag
      Project     = "SecureInfrastructure"
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment_tag" {
  description = "Environment tag in format Environment-Name"
  type        = string
  default     = "Prod-SecureApp"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
  default     = "TempPassword123!" # Should be managed via AWS Secrets Manager in production
}

variable "domain_name" {
  description = "Domain name for SSL certificate (use example.com for testing)"
  type        = string
  default     = "example.com"
}

# Random suffix for unique resource names
resource "random_id" "deployment" {
  byte_length = 4
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Get the correct ELB service account ID for the region
data "aws_elb_service_account" "main" {}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment_tag}-vpc-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.environment_tag}-igw-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

# Public Subnets (for ALB only)
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false # Requirement 1: No public IP by default

  tags = {
    Name        = "${var.environment_tag}-public-subnet-${count.index + 1}-${random_id.deployment.hex}"
    Environment = var.environment_tag
    Type        = "Public"
  }
}

# Private Subnets (for application and database)
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.environment_tag}-private-subnet-${count.index + 1}-${random_id.deployment.hex}"
    Environment = var.environment_tag
    Type        = "Private"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 20}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.environment_tag}-db-subnet-${count.index + 1}-${random_id.deployment.hex}"
    Environment = var.environment_tag
    Type        = "Database"
  }
}

# NAT Gateway for private subnet internet access
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name        = "${var.environment_tag}-nat-eip-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name        = "${var.environment_tag}-nat-gateway-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.environment_tag}-public-rt-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name        = "${var.environment_tag}-private-rt-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Security Groups
# ALB Security Group - Requirement 7: Enforce SSL/TLS
resource "aws_security_group" "alb" {
  name_prefix = "${var.environment_tag}-alb-${random_id.deployment.hex}-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP redirect to HTTPS"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment_tag}-alb-sg-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

# Application Security Group - Requirement 8: No SSH from 0.0.0.0/0
resource "aws_security_group" "app" {
  name_prefix = "${var.environment_tag}-app-${random_id.deployment.hex}-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # SSH access only from within VPC (not from 0.0.0.0/0)
  ingress {
    description = "SSH from VPC only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment_tag}-app-sg-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

# Database Security Group
resource "aws_security_group" "db" {
  name_prefix = "${var.environment_tag}-db-${random_id.deployment.hex}-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  tags = {
    Name        = "${var.environment_tag}-db-sg-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

# S3 Buckets
# Random suffix for unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 8
}

# Dedicated logging bucket for access logs - Requirement 6
resource "aws_s3_bucket" "access_logs" {
  bucket = "${lower(replace(var.environment_tag, "-", ""))}-access-logs-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.environment_tag}-access-logs-bucket"
    Environment = var.environment_tag
    Purpose     = "AccessLogs"
  }
}

# Main application bucket
resource "aws_s3_bucket" "app_data" {
  bucket = "${lower(replace(var.environment_tag, "-", ""))}-app-data-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.environment_tag}-app-data-bucket"
    Environment = var.environment_tag
    Purpose     = "ApplicationData"
  }
}

# S3 Bucket Versioning - Requirement 9
resource "aws_s3_bucket_versioning" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption - Requirement 5: AES-256
resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Logging - Requirement 6: Access logging
resource "aws_s3_bucket_logging" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "app-data-access-logs/"
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Roles - Requirement 3 & 4: Use IAM roles with least privilege
# EC2 Instance Role (FIXED: Added random suffix)
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment_tag}-ec2-role-${random_id.deployment.hex}"

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
    Name        = "${var.environment_tag}-ec2-role-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

# EC2 Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment_tag}-ec2-profile-${random_id.deployment.hex}"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name        = "${var.environment_tag}-ec2-profile-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

# S3 Access Policy for EC2 (least privilege)
resource "aws_iam_role_policy" "ec2_s3_policy" {
  name = "${var.environment_tag}-ec2-s3-policy-${random_id.deployment.hex}"
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
        Resource = "${aws_s3_bucket.app_data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.app_data.arn
      }
    ]
  })
}

# RDS Subnet Group (FIXED: Added random suffix)
resource "aws_db_subnet_group" "main" {
  name       = "${lower(var.environment_tag)}-db-subnet-group-${random_id.deployment.hex}"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name        = "${var.environment_tag}-db-subnet-group-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${lower(var.environment_tag)}-database-${random_id.deployment.hex}"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  db_name  = "appdb"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name        = "${var.environment_tag}-database-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

# Self-signed certificate for ALB
resource "tls_private_key" "main" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_self_signed_cert" "main" {
  private_key_pem = tls_private_key.main.private_key_pem

  subject {
    common_name  = var.domain_name
    organization = "Secure Infrastructure"
  }

  validity_period_hours = 8760 # 1 year

  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "server_auth",
  ]
}

resource "aws_acm_certificate" "main" {
  private_key      = tls_private_key.main.private_key_pem
  certificate_body = tls_self_signed_cert.main.cert_pem

  tags = {
    Name        = "${var.environment_tag}-ssl-cert-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }

  lifecycle {
    create_before_destroy = true
  }
}

# S3 Bucket Policy for ALB Access Logs
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.access_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.access_logs.arn}/alb-access-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.access_logs.arn}/alb-access-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.access_logs.arn
      }
    ]
  })
}

# Application Load Balancer (FIXED: Added random suffix)
resource "aws_lb" "main" {
  name               = "${lower(var.environment_tag)}-alb-${random_id.deployment.hex}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  access_logs {
    bucket  = aws_s3_bucket.access_logs.id
    prefix  = "alb-access-logs"
    enabled = true
  }

  tags = {
    Name        = "${var.environment_tag}-alb-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }

  depends_on = [aws_s3_bucket_policy.alb_logs]
}

# ALB Target Group (FIXED: Added random suffix)
resource "aws_lb_target_group" "main" {
  name     = "${lower(var.environment_tag)}-tg-${random_id.deployment.hex}"
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
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = {
    Name        = "${var.environment_tag}-target-group-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

# ALB Listener (HTTPS) - Requirement 7: Enforce SSL/TLS
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  tags = {
    Name        = "${var.environment_tag}-https-listener-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

# ALB Listener (HTTP to HTTPS redirect)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
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

  tags = {
    Name        = "${var.environment_tag}-http-listener-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

# Launch Template for Auto Scaling
resource "aws_launch_template" "main" {
  name_prefix   = "${var.environment_tag}-lt-${random_id.deployment.hex}-"
  image_id      = "ami-0c02fb55956c7d316" # Amazon Linux 2 AMI (update for your region)
  instance_type = "t3.micro"

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  network_interfaces {
    associate_public_ip_address = false # Requirement 1: No public IP by default
    security_groups             = [aws_security_group.app.id]
    delete_on_termination       = true
    device_index               = 0
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Secure Application - ${var.environment_tag}</h1>" > /var/www/html/index.html
              echo "<p>Deployment ID: ${random_id.deployment.hex}</p>" >> /var/www/html/index.html
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.environment_tag}-instance-${random_id.deployment.hex}"
      Environment = var.environment_tag
    }
  }

  tags = {
    Name        = "${var.environment_tag}-launch-template-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "${var.environment_tag}-asg-${random_id.deployment.hex}"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"

  min_size         = 1
  max_size         = 3
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.environment_tag}-asg-instance-${random_id.deployment.hex}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment_tag
    propagate_at_launch = true
  }
}

# Outputs
output "deployment_id" {
  description = "Unique deployment identifier"
  value       = random_id.deployment.hex
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_https_url" {
  description = "HTTPS URL of the load balancer"
  value       = "https://${aws_lb.main.dns_name}"
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "s3_app_bucket" {
  description = "Name of the application S3 bucket"
  value       = aws_s3_bucket.app_data.id
}

output "s3_logs_bucket" {
  description = "Name of the access logs S3 bucket"
  value       = aws_s3_bucket.access_logs.id
}

output "resource_summary" {
  description = "Summary of created resources"
  value = {
    vpc_id           = aws_vpc.main.id
    alb_name         = aws_lb.main.name
    target_group     = aws_lb_target_group.main.name
    iam_role         = aws_iam_role.ec2_role.name
    db_subnet_group  = aws_db_subnet_group.main.name
    rds_identifier   = aws_db_instance.main.identifier
  }
}
```

## Key Fixes Applied:

### 1. **Resource Name Conflicts Fixed**
- **Added `random_id.deployment`**: Creates unique 4-byte hex suffix for all resource names
- **IAM Role**: `Prod-SecureApp-ec2-role-${random_id.deployment.hex}`
- **DB Subnet Group**: `prod-secureapp-db-subnet-group-${random_id.deployment.hex}`
- **Load Balancer**: `prod-secureapp-alb-${random_id.deployment.hex}`
- **Target Group**: `prod-secureapp-tg-${random_id.deployment.hex}`

### 2. **Enhanced S3 Bucket Naming**
- **Longer random suffix**: Using 8-byte hex for S3 buckets to ensure global uniqueness
- **Character cleanup**: Removed hyphens from environment tag for bucket names

### 3. **Provider Requirements**
- **Added required providers**: `random` and `tls` providers explicitly declared

### 4. **Improved Resource Management**
- **Consistent naming**: All resources now use the same deployment ID
- **Better tracking**: Added deployment ID output for reference

## Clean Deployment Process:

If you still have existing resources, you have two options:

### Option 1: Clean Slate (Recommended)
```bash
# Destroy existing resources first
terraform destroy

# Then deploy fresh
terraform init
terraform plan
terraform apply
```

### Option 2: Import Existing Resources
```bash
# Import existing resources into state (if you want to keep them)
terraform import aws_iam_role.ec2_role Prod-SecureApp-ec2-role
terraform import aws_db_subnet_group.main prod-secureapp-db-subnet-group
# ... etc for other resources
```

## Compliance Verification:

**All 9 security requirements remain 100% compliant**:

1.  No public IP by default
2.  Environment-Name tagging format  
3.  IAM roles for service access
4.  Least privilege IAM
5.  S3 AES-256 encryption
6.  S3 access logging
7.  ALB SSL/TLS enforcement
8.  No SSH from 0.0.0.0/0
9.  S3 versioning enabled

The fixes only address naming conflicts while maintaining all security constraints. Each deployment will now have a unique identifier, preventing resource conflicts.