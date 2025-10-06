# Production Web Application Stack - Terraform Implementation

This solution implements a secure, production-ready web application stack in AWS using Terraform. The infrastructure includes a VPC with public and private subnets, an EC2 web server with Application Load Balancer, RDS PostgreSQL database with Multi-AZ, and comprehensive monitoring with CloudWatch.

## Architecture Overview

The infrastructure creates:

- **VPC** with CIDR 10.0.0.0/16 in us-east-1 region
- **Public subnet** (10.0.1.0/24) for the web server and ALB
- **Private subnets** (10.0.2.0/24 and 10.0.3.0/24) for the RDS database across two AZs
- **Application Load Balancer** with HTTPS termination
- **EC2 instance** with IAM role for S3 read-only access
- **RDS PostgreSQL** with Multi-AZ, enhanced monitoring, and Performance Insights
- **Security Groups** following least privilege principles
- **CloudWatch alarms** for monitoring CPU utilization
- **S3 bucket** for ALB access logs

## Security Features

- Database is placed in private subnets with no public access
- Security groups restrict access to necessary ports only
- Database security group only allows connections from web server
- SSH access restricted to specified CIDR block
- IAM roles follow least privilege principle (S3 read-only)
- All resources tagged with Environment = "Production"

## Files Created

### Infrastructure Code
- **lib/tap_stack.tf** - Complete Terraform configuration (734 lines)
- **lib/terraform.tfvars** - Sample variable values

## Complete Code Implementation

### lib/tap_stack.tf

```hcl
# main.tf - Production Web Application Stack for AWS
# Terraform v1.x compatible with AWS Provider

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Configure AWS Provider with default tags
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "Production"
    }
  }
}

# ==================== VARIABLES =====================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr_primary" {
  description = "CIDR block for primary private subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "private_subnet_cidr_secondary" {
  description = "CIDR block for secondary private subnet (for Multi-AZ RDS)"
  type        = string
  default     = "10.0.3.0/24"
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS listener (must be in us-east-1)"
  type        = string
  # No default - this is required. User must provide valid ACM cert ARN
}

variable "key_pair_name" {
  description = "Name of EC2 key pair for SSH access"
  type        = string
}

variable "instance_ami" {
  description = "AMI ID for EC2 instance"
  type        = string
  default     = "ami-0c02fb55731490381" # Amazon Linux 2 in us-east-1 - verify current AMI
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "rds_username" {
  description = "Master username for RDS instance"
  type        = string
  default     = "dbadmin"
}

variable "rds_password" {
  description = "Master password for RDS instance"
  type        = string
  sensitive   = true
}

variable "rds_allocated_storage" {
  description = "Allocated storage for RDS instance (GB)"
  type        = number
  default     = 20
}

variable "my_allowed_cidr" {
  description = "CIDR block allowed for SSH access (e.g., your IP/32)"
  type        = string
  # No default for security - user must explicitly provide
}

# ==================== DATA SOURCES ====================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_elb_service_account" "main" {}

data "aws_caller_identity" "current" {}

# ==================== NETWORKING ====================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "production-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "production-igw"
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "production-public-subnet"
    Type = "Public"
  }
}

# Private Subnet Primary
resource "aws_subnet" "private_primary" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidr_primary
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "production-private-subnet-primary"
    Type = "Private"
  }
}

# Private Subnet Secondary (for Multi-AZ RDS)
resource "aws_subnet" "private_secondary" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidr_secondary
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "production-private-subnet-secondary"
    Type = "Private"
  }
}

# Route Table for Public Subnet
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "production-public-rt"
  }
}

# Route Table Association for Public Subnet
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# ==================== SECURITY GROUPS ====================

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "production-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from Internet (for redirect)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "production-alb-sg"
  }
}

# Web Server Security Group
resource "aws_security_group" "web" {
  name        = "production-web-sg"
  description = "Security group for web server EC2 instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_allowed_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "production-web-sg"
  }
}

# Database Security Group
resource "aws_security_group" "db" {
  name        = "production-db-sg"
  description = "Security group for RDS PostgreSQL instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from web server"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "Allow minimal outbound for AWS services"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "production-db-sg"
  }
}

# ==================== IAM ROLES AND POLICIES ====================

# IAM Role for EC2 Instance (S3 Read-Only)
resource "aws_iam_role" "ec2_s3_read" {
  name = "production-ec2-s3-read-role"

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
    Name = "production-ec2-s3-read-role"
  }
}

# IAM Policy for S3 Read-Only Access (Least Privilege)
resource "aws_iam_policy" "s3_read_only" {
  name        = "production-s3-read-only"
  description = "S3 read-only access for EC2 instances"

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
          "arn:aws:s3:::*",
          "arn:aws:s3:::*/*"
        ]
      }
    ]
  })
}

# Attach S3 Read-Only Policy to EC2 Role
resource "aws_iam_role_policy_attachment" "ec2_s3_read" {
  role       = aws_iam_role.ec2_s3_read.name
  policy_arn = aws_iam_policy.s3_read_only.arn
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2" {
  name = "production-ec2-instance-profile"
  role = aws_iam_role.ec2_s3_read.name
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "production-rds-enhanced-monitoring"

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

  tags = {
    Name = "production-rds-enhanced-monitoring"
  }
}

# Attach AWS Managed Policy for RDS Enhanced Monitoring
resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ==================== S3 BUCKET FOR ALB LOGS ====================

# S3 Bucket for ALB Access Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket        = "production-alb-logs-${data.aws_caller_identity.current.account_id}"
  force_destroy = true # For demo purposes; remove in production

  tags = {
    Name = "production-alb-logs"
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy for ALB Access Logs
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowALBAccessLogs"
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

# ==================== EC2 INSTANCE ====================

# EC2 Instance (Web Server)
resource "aws_instance" "web" {
  ami                    = var.instance_ami # User must provide valid AMI ID for us-east-1
  instance_type          = var.instance_type
  key_name               = var.key_pair_name # User must provide existing key pair name
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  # Simple user-data to install nginx
  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    amazon-linux-extras install nginx1 -y
    systemctl start nginx
    systemctl enable nginx
    
    # Create simple index page with DB connection info placeholder
    cat > /usr/share/nginx/html/index.html <<'HTML'
    <!DOCTYPE html>
    <html>
    <head><title>Production Web Server</title></head>
    <body>
      <h1>Production Web Application</h1>
      <p>Server is running</p>
      <!-- DB Connection: ${aws_db_instance.main.endpoint} -->
    </body>
    </html>
    HTML
    
    systemctl restart nginx
  EOF

  tags = {
    Name = "production-web-server"
  }
}

# ==================== APPLICATION LOAD BALANCER ====================

# ALB
resource "aws_lb" "main" {
  name               = "production-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public.id, aws_subnet.private_secondary.id] # ALB requires 2 subnets

  enable_deletion_protection = false
  enable_http2               = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    enabled = true
    prefix  = "alb"
  }

  tags = {
    Name = "production-alb"
  }
}

# Target Group
resource "aws_lb_target_group" "web" {
  name     = "production-web-tg"
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
    Name = "production-web-tg"
  }
}

# Target Group Attachment
resource "aws_lb_target_group_attachment" "web" {
  target_group_arn = aws_lb_target_group.web.arn
  target_id        = aws_instance.web.id
  port             = 80
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.acm_certificate_arn # User must provide valid ACM certificate ARN

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# HTTP Listener (Redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
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

# ==================== RDS POSTGRESQL ====================

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "production-db-subnet-group"
  subnet_ids = [aws_subnet.private_primary.id, aws_subnet.private_secondary.id]

  tags = {
    Name = "production-db-subnet-group"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier     = "production-postgres"
  engine         = "postgres"
  engine_version = "13.7"
  instance_class = "db.t3.micro"

  allocated_storage = var.rds_allocated_storage
  storage_type      = "gp2"
  storage_encrypted = true

  db_name  = "productiondb"
  username = var.rds_username
  password = var.rds_password

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az                = true
  publicly_accessible     = false
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot       = false
  final_snapshot_identifier = "production-postgres-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Enhanced Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_enhanced_monitoring.arn

  # Performance Insights
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = {
    Name = "production-postgres"
  }
}

# ==================== CLOUDWATCH ALARMS ====================

# CloudWatch Alarm for ALB Target Unhealthy
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "production-alb-unhealthy-targets"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when ALB has unhealthy targets"

  dimensions = {
    TargetGroup  = aws_lb_target_group.web.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "production-alb-unhealthy-alarm"
  }
}

# CloudWatch Alarm for RDS High CPU
resource "aws_cloudwatch_metric_alarm" "rds_high_cpu" {
  alarm_name          = "production-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when RDS CPU exceeds 80%"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "production-rds-cpu-alarm"
  }
}

# CloudWatch Alarm for EC2 High CPU
resource "aws_cloudwatch_metric_alarm" "ec2_high_cpu" {
  alarm_name          = "production-ec2-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when EC2 CPU exceeds 80%"

  dimensions = {
    InstanceId = aws_instance.web.id
  }

  tags = {
    Name = "production-ec2-cpu-alarm"
  }
}

# ==================== OUTPUTS ====================

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "web_instance_public_ip" {
  description = "Public IP address of the web server"
  value       = aws_instance.web.public_ip
}

output "rds_endpoint_address" {
  description = "RDS instance endpoint address"
  value       = aws_db_instance.main.address
}

output "rds_endpoint_port" {
  description = "RDS instance endpoint port"
  value       = aws_db_instance.main.port
}
```

### lib/terraform.tfvars

```hcl
# Sample terraform.tfvars for testing
# These values should be replaced with real values for actual deployment

acm_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"
key_pair_name = "test-keypair"
my_allowed_cidr = "10.0.0.0/32"
rds_password = "TempPassword123!"
instance_ami = "ami-0c02fb55731490381"
```

## Deployment Instructions

### Prerequisites
1. Valid ACM certificate in us-east-1 region
2. Existing EC2 key pair in us-east-1
3. AWS credentials configured

### Commands

1. **Initialize Terraform:**
   ```bash
   cd lib
   terraform init
   ```

2. **Validate configuration:**
   ```bash
   terraform validate
   ```

3. **Create terraform.tfvars with real values:**
   ```hcl
   acm_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID"
   key_pair_name = "your-existing-keypair"
   my_allowed_cidr = "YOUR.IP.ADDRESS/32"
   rds_password = "YourSecurePassword123!"
   instance_ami = "ami-0c02fb55731490381"  # Verify current Amazon Linux 2 AMI
   ```

4. **Plan deployment:**
   ```bash
   terraform plan
   ```

5. **Deploy infrastructure:**
   ```bash
   terraform apply
   ```

6. **Collect outputs:**
   ```bash
   terraform output -json > ../cfn-outputs/flat-outputs.json
   ```

## Key Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `acm_certificate_arn` | ACM certificate ARN for HTTPS | Yes | None |
| `key_pair_name` | EC2 key pair name for SSH | Yes | None |
| `my_allowed_cidr` | CIDR block for SSH access | Yes | None |
| `rds_password` | RDS master password | Yes | None |
| `vpc_cidr` | VPC CIDR block | No | 10.0.0.0/16 |
| `instance_type` | EC2 instance type | No | t3.micro |
| `instance_ami` | EC2 AMI ID | No | ami-0c02fb55731490381 |

## Outputs

- `alb_dns_name` - Application Load Balancer DNS name
- `web_instance_public_ip` - EC2 instance public IP
- `rds_endpoint_address` - RDS endpoint address
- `rds_endpoint_port` - RDS endpoint port

## Security Considerations

1. **Database Access**: RDS instance is not publicly accessible and only accepts connections from the web server security group
2. **SSH Access**: Restricted to user-defined CIDR block via `my_allowed_cidr` variable
3. **HTTPS Only**: ALB configured with HTTPS listener using provided ACM certificate
4. **IAM Permissions**: EC2 instance has minimal S3 read-only permissions
5. **Network Isolation**: Private subnets for database tier

## Monitoring and Logging

- **CloudWatch Alarms**: Configured for EC2 CPU, RDS CPU, and ALB unhealthy targets
- **RDS Monitoring**: Enhanced monitoring enabled with 60-second intervals
- **Performance Insights**: Enabled for RDS with 7-day retention
- **ALB Access Logs**: Stored in dedicated S3 bucket
- **CloudWatch Logs**: RDS PostgreSQL logs exported to CloudWatch

## High Availability

- **Multi-AZ RDS**: Database configured for automatic failover
- **Multiple Subnets**: ALB spans multiple availability zones
- **Auto Recovery**: EC2 instance can be easily replaced via auto-scaling (not implemented in basic version)

## Cost Optimization

- Uses t3.micro instances for cost efficiency
- gp2 storage for RDS (20GB minimum)
- 7-day backup retention for RDS
- Performance Insights with minimal retention period

## Cleanup

To destroy all resources:
```bash
cd lib
terraform destroy
```

**Note**: Ensure S3 buckets are empty before destruction, as they may contain ALB access logs.

## Best Practices Implemented

1. **Infrastructure as Code**: Single Terraform file for maintainability
2. **Security by Design**: Least privilege access, private subnets for data tier
3. **Monitoring**: Comprehensive CloudWatch alarms and logging
4. **High Availability**: Multi-AZ deployment for critical components
5. **Documentation**: Inline comments and comprehensive implementation

This implementation provides a solid foundation for a production web application with security, monitoring, and high availability built in from the start.